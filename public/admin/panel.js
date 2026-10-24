// Changes to the content panel (Decap CMS, in public/admin/cms). This script
// loads before Decap, adapts it and only then starts it.
//
// Commits: Decap writes commits with GitHub's Git Data API, which leaves them
// unsigned, and main only takes verified commits, through pull requests. Here
// each save becomes one commit made by createCommitOnBranch, which GitHub
// signs, and the panel never writes to main: "Publicar" squash-merges the pull
// request, and GitHub signs that commit too.
//
// Status: a card in the corner shows the checks of the entry's pull request,
// or of every open one on the workflow page. "Publicar" only merges a pull
// request whose checks all passed, and its buttons look disabled until then.
(() => {
  // Decap starts by itself as soon as it loads, unless this flag is set.
  window.CMS_MANUAL_INIT = true;

  // Decap's class names (emotion targets) for the "Publicar" button of the
  // editor, the workflow card and its "Publicar" button. They come from Decap
  // 3.17.1; check them when updating it.
  const editorPublishButton = '.e1d2l9mo5';
  const workflowCard = '.ewffzyy0';
  const workflowPublishButton = '.ewffzyy1';

  const pendingRefresh = 15_000;
  const settledRefresh = 60_000;

  // The GitHub API of the logged-in session.
  let github = null;

  async function graphql(api, query, variables) {
    const { data, errors } = await api.request('/graphql', {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    });
    if (errors?.length) {
      throw new Error(errors.map((error) => error.message).join(' '));
    }
    return data;
  }

  // Decap shows these messages after "Falha ao publicar:" and the like. An
  // error without a name prints only its message.
  function notice(message) {
    const error = new Error(message);
    error.name = '';
    return error;
  }

  // Commits

  const commitMutation = `mutation ($input: CreateCommitOnBranchInput!) {
    createCommitOnBranch(input: $input) { commit { oid } }
  }`;

  const directWrite =
    'a main só aceita mudanças por PR, e o painel não grava nela direto. ' +
    'Envie imagens pelo campo do próprio item. Para remover um item ' +
    'publicado ou uma imagem, use o GitHub.';

  const trimSlashes = (path) => path.replace(/^\/+/, '');

  async function commit(api, branch, expectedHeadOid, message, fileChanges) {
    const [headline, ...lines] = message.split('\n');
    const body = lines.join('\n').trim();
    const data = await graphql(api, commitMutation, {
      input: {
        branch: { repositoryNameWithOwner: api.repo, branchName: branch },
        expectedHeadOid,
        message: body ? { headline, body } : { headline },
        fileChanges,
      },
    });
    return data.createCommitOnBranch.commit.oid;
  }

  function updateBranch(api, number, headSha) {
    return api.request(`${api.originRepoURL}/pulls/${number}/update-branch`, {
      method: 'PUT',
      body: JSON.stringify({ expected_head_sha: headSha }),
    });
  }

  // Replaces Decap's editorialWorkflowGit: the same branch and pull request,
  // with a signed commit.
  async function persistEntry(api, dataFiles, mediaFiles, options) {
    const contentKey = api.generateContentKey(
      options.collectionName,
      dataFiles[0].slug,
    );
    const branch = `cms/${contentKey}`;
    const files = [...mediaFiles, ...dataFiles];
    const additions = await Promise.all(
      files.map(async (file) => ({
        path: trimSlashes(file.newPath ?? file.path),
        contents: file.toBase64
          ? await file.toBase64()
          : await api.toBase64(file.raw),
      })),
    );
    const deletions = files
      .filter((file) => file.newPath)
      .map((file) => ({ path: trimSlashes(file.path) }));
    const message = options.commitMessage;

    if (!options.unpublished) {
      const main = await api.getDefaultBranch();
      await api.createBranch(branch, main.commit.sha);
      await commit(api, branch, main.commit.sha, message, {
        additions,
        deletions,
      });
      const pullRequest = await api.createPR(message, branch);
      await api.setPullRequestStatus(
        pullRequest,
        options.status || api.initialWorkflowStatus,
      );
      return;
    }

    const pullRequest = await api.getBranchPullRequest(branch);
    const comparison = await api.getDifferences(
      api.branch,
      pullRequest.head.sha,
    );
    const diffs = await Promise.all(
      (comparison.files ?? [])
        .filter((file) => file.status !== 'removed')
        .map((file) => api.diffFromFile(file)),
    );
    // Images the entry no longer uses leave the branch, as in Decap.
    const saved = new Set(additions.map((file) => file.path));
    for (const diff of diffs) {
      if (diff.binary && !saved.has(diff.path)) {
        deletions.push({ path: diff.path });
      }
    }
    const head = await commit(api, branch, pullRequest.head.sha, message, {
      additions,
      deletions,
    });
    // Decap rebased the branch on main at every save. Merging main into it,
    // which GitHub signs, keeps the pull request current instead.
    if (comparison.behind_by > 0) {
      await updateBranch(api, pullRequest.number, head).catch(() => {});
    }
  }

  function adapt(api) {
    api.persistFiles = async (dataFiles, mediaFiles, options) => {
      if (!options.useWorkflow) throw notice(directWrite);
      return persistEntry(api, dataFiles, mediaFiles, options);
    };
    api.deleteFiles = async () => {
      throw notice(directWrite);
    };
    // When GitHub refuses a merge, Decap commits the changes straight to main.
    api.forceMergePR = async (pullRequest) => {
      throw notice(
        `o GitHub não aceitou o merge do PR #${pullRequest.number}. ` +
          'Confira os checks e tente de novo.',
      );
    };
  }

  function adaptGitHub(CMS) {
    const backend = CMS.getBackend('github');
    const create = backend.init;
    backend.init = (...args) => {
      const implementation = create(...args);
      const { authenticate, logout } = implementation;
      implementation.authenticate = async (credentials) => {
        const user = await authenticate.call(implementation, credentials);
        adapt(implementation.api);
        github = implementation.api;
        refresh();
        return user;
      };
      implementation.logout = (...rest) => {
        github = null;
        refresh();
        return logout.apply(implementation, rest);
      };
      return implementation;
    };
  }

  // Status

  const statusQuery = `query ($owner: String!, $name: String!, $base: String!, $head: String) {
    repository(owner: $owner, name: $name) {
      pullRequests(states: OPEN, baseRefName: $base, headRefName: $head, first: 20, orderBy: { field: UPDATED_AT, direction: DESC }) {
        nodes {
          number
          title
          url
          headRefName
          headRefOid
          mergeStateStatus
          commits(last: 1) {
            nodes {
              commit {
                statusCheckRollup {
                  contexts(first: 50) {
                    nodes {
                      __typename
                      ... on CheckRun { name status conclusion detailsUrl }
                      ... on StatusContext { context state targetUrl }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`;

  // Conclusions of check runs and states of commit statuses. The others,
  // like FAILURE, ERROR, CANCELLED and TIMED_OUT, are failures.
  const outcomes = {
    SUCCESS: 'success',
    NEUTRAL: 'skipped',
    SKIPPED: 'skipped',
    PENDING: 'pending',
    EXPECTED: 'pending',
  };

  // Netlify names its checks "<check> - <site>", and its deploy status
  // "netlify/<site>/deploy-preview".
  function checkName(name) {
    return /^netlify\/[^/]+\/deploy-preview$/.test(name)
      ? 'Deploy Preview'
      : name.replace(/ - [\w.-]+$/, '');
  }

  function readCheck(node) {
    if (node.__typename === 'StatusContext') {
      return {
        name: checkName(node.context),
        url: node.targetUrl,
        state: outcomes[node.state] ?? 'failure',
      };
    }
    const result = node.status === 'COMPLETED' ? node.conclusion : 'PENDING';
    return {
      name: checkName(node.name),
      url: node.detailsUrl,
      state: outcomes[result] ?? 'failure',
    };
  }

  function describe(pullRequest) {
    const contexts =
      pullRequest.commits.nodes[0]?.commit.statusCheckRollup?.contexts.nodes ??
      [];
    const checks = contexts
      .map(readCheck)
      .sort((a, b) => a.name.localeCompare(b.name));
    const failed = checks.filter((check) => check.state === 'failure');
    const merge = pullRequest.mergeStateStatus;
    let state = 'green';
    if (merge === 'DIRTY') state = 'conflict';
    else if (merge === 'BEHIND') state = 'behind';
    else if (failed.length) state = 'failure';
    // BLOCKED with every check done means a required check hasn't started.
    else if (
      checks.some((check) => check.state === 'pending') ||
      !['CLEAN', 'HAS_HOOKS'].includes(merge)
    ) {
      state = 'pending';
    }
    const title = pullRequest.title.replace(/^\w+(\([^)]*\))?!?:\s*/, '');
    return {
      number: pullRequest.number,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      url: pullRequest.url,
      branch: pullRequest.headRefName,
      head: pullRequest.headRefOid,
      checks,
      failed: failed.map((check) => check.name),
      preview: checks.find(
        (check) => check.name === 'Deploy Preview' && check.state === 'success',
      )?.url,
      state,
    };
  }

  async function readPullRequests(api, branch) {
    const data = await graphql(api, statusQuery, {
      owner: api.originRepoOwner,
      name: api.originRepoName,
      base: api.branch,
      head: branch,
    });
    return data.repository.pullRequests.nodes
      .filter((pullRequest) => pullRequest.headRefName.startsWith('cms/'))
      .map(describe);
  }

  const joinNames = (names) =>
    names.length > 1
      ? `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`
      : names[0];

  function failureText(pullRequest) {
    const names = joinNames(pullRequest.failed);
    return pullRequest.failed.length > 1
      ? `os checks ${names} falharam`
      : `o check ${names} falhou`;
  }

  async function guardPublish({ entry }) {
    if (!github) return;
    const branch = `cms/${github.generateContentKey(entry.get('collection'), entry.get('slug'))}`;
    let pullRequest;
    try {
      [pullRequest] = await readPullRequests(github, branch);
    } catch (error) {
      throw notice(
        `não consegui conferir os checks no GitHub (${error.message}). Tente de novo.`,
      );
    }
    if (!pullRequest) throw notice('não encontrei o PR deste item no GitHub.');
    const { checks, number, state } = pullRequest;
    const running = checks.some((check) => check.state === 'pending');
    const reasons = {
      pending:
        running || !checks.length
          ? `os checks do PR #${number} ainda estão rodando. Publique quando tudo ficar verde.`
          : `o GitHub ainda não liberou o merge do PR #${number}. Tente de novo em instantes.`,
      failure: `${failureText(pullRequest)} no PR #${number}. Veja o motivo no GitHub.`,
      behind: `o PR #${number} está atrás da main. Atualize pelo quadro de status do GitHub e espere os checks.`,
      conflict: `o PR #${number} tem conflitos com a main. Resolva no GitHub.`,
    };
    if (state !== 'green') {
      refresh();
      throw notice(reasons[state]);
    }
  }

  // The card

  const stateLabels = {
    green: 'tudo verde',
    pending: 'checks rodando',
    failure: 'check falhou',
    behind: 'desatualizado',
    conflict: 'com conflito',
  };
  const checkLabels = {
    success: 'passou',
    skipped: 'ignorado',
    pending: 'rodando',
    failure: 'falhou',
  };
  const severity = ['green', 'pending', 'behind', 'failure', 'conflict'];

  function summary(pullRequest) {
    const { checks, state } = pullRequest;
    const done = checks.filter((check) => check.state !== 'pending').length;
    const wait = '“Publicar” libera quando tudo ficar verde.';
    switch (state) {
      case 'green':
        return 'Tudo verde: pode publicar.';
      case 'failure': {
        const text = failureText(pullRequest);
        return `${text.charAt(0).toUpperCase()}${text.slice(1)}. Veja o motivo no GitHub.`;
      }
      case 'behind':
        return 'A main mudou depois deste PR. Atualize para os checks rodarem de novo.';
      case 'conflict':
        return 'Este PR tem conflitos com a main. Resolva no GitHub.';
      default:
        if (!checks.length) return `Esperando os checks começarem. ${wait}`;
        if (done === checks.length)
          return `Esperando o GitHub liberar o merge. ${wait}`;
        return `${done} de ${checks.length} checks prontos. ${wait}`;
    }
  }

  function h(tag, attributes, ...children) {
    const element = document.createElement(tag);
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined || value === false) continue;
      if (name.startsWith('on')) element.addEventListener(name.slice(2), value);
      else element.setAttribute(name, value === true ? '' : value);
    }
    element.append(...children.flat().filter((child) => child || child === 0));
    return element;
  }

  const link = (href, text) =>
    h('a', { href, target: '_blank', rel: 'noreferrer' }, text);

  const card = h('section', {
    class: 'pr-status',
    'aria-label': 'Status no GitHub',
    hidden: true,
  });
  // Tells screen readers when the entry's pull request changes state.
  const announcer = h('p', { class: 'pr-status-live', role: 'status' });
  // The "Publicar" buttons of pull requests that aren't green look disabled,
  // and a click on one opens the card instead of publishing.
  const lock = h('style', { id: 'pr-status-lock' });
  let locked = '';

  let collapsed = false;
  try {
    collapsed = localStorage.getItem('pr-status-collapsed') === '1';
  } catch {}

  let timer = 0;
  let request = 0;
  let shown = '';
  let view = null;
  let last = null;

  function currentView() {
    let route = location.hash.slice(1).split('?')[0];
    try {
      route = decodeURIComponent(route);
    } catch {}
    const entry = /^\/collections\/([^/]+)\/entries\/(.+)$/.exec(route);
    if (entry) {
      return { branch: `cms/${github.generateContentKey(entry[1], entry[2])}` };
    }
    return /^\/workflow(\/|$)/.test(route) ? { branch: null } : null;
  }

  function hide() {
    card.hidden = true;
    locked = '';
    lock.textContent = '';
    announcer.textContent = '';
    shown = '';
  }

  function lockPublishing(pullRequests) {
    locked = pullRequests
      .filter((pullRequest) => pullRequest.state !== 'green')
      .map((pullRequest) => {
        if (view.branch) return editorPublishButton;
        const { collection, slug } = github.parseContentKey(
          pullRequest.branch.slice('cms/'.length),
        );
        // The cards link to the entry with "?ref=workflow".
        const href = `#/collections/${collection}/entries/${slug}`;
        const exact = CSS.escape(href);
        const withQuery = CSS.escape(href + '?');
        return `${workflowCard}:has(a[href="${exact}"], a[href^="${withQuery}"]) ${workflowPublishButton}`;
      })
      .join(', ');
    lock.textContent = locked
      ? `${locked} { opacity: 0.45; cursor: not-allowed; }`
      : '';
  }

  function stopLockedPublish(event) {
    if (!locked || !event.target.closest?.(locked)) return;
    event.preventDefault();
    event.stopPropagation();
    collapsed = false;
    render(last.pullRequests, last.failure);
    card.querySelector('.pr-status__toggle').focus();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      card.animate(
        [
          { outline: '3px solid rgba(58, 105, 199, 0.7)', outlineOffset: '0' },
          { outline: '3px solid rgba(58, 105, 199, 0)', outlineOffset: '10px' },
        ],
        { duration: 700, easing: 'ease-out' },
      );
    }
  }

  async function updateWithMain(pullRequest, button) {
    button.disabled = true;
    button.textContent = 'Atualizando…';
    try {
      await updateBranch(github, pullRequest.number, pullRequest.head);
      schedule(3000);
    } catch {
      button.disabled = false;
      button.textContent = 'Não deu certo. Tentar de novo';
    }
  }

  function pullRequestBlock(pullRequest) {
    const single = Boolean(view.branch);
    return h(
      'article',
      { class: 'pr-status__pr', 'data-state': pullRequest.state },
      !single &&
        h(
          'h3',
          { class: 'pr-status__name' },
          link(pullRequest.url, `#${pullRequest.number} ${pullRequest.title}`),
        ),
      h('p', { class: 'pr-status__summary' }, summary(pullRequest)),
      single &&
        h(
          'ul',
          { class: 'pr-status__checks' },
          pullRequest.checks.map((check) =>
            h(
              'li',
              { 'data-state': check.state },
              h('span', { class: 'pr-status__dot', 'aria-hidden': 'true' }),
              check.url ? link(check.url, check.name) : h('span', {}, check.name),
              h('span', { class: 'pr-status__result' }, checkLabels[check.state]),
            ),
          ),
        ),
      h(
        'p',
        { class: 'pr-status__actions' },
        single && link(pullRequest.url, `Abrir o PR #${pullRequest.number}`),
        pullRequest.preview && link(pullRequest.preview, 'Ver a prévia'),
        pullRequest.state === 'behind' &&
          h(
            'button',
            {
              type: 'button',
              onclick: (event) => updateWithMain(pullRequest, event.currentTarget),
            },
            'Atualizar com a main',
          ),
      ),
    );
  }

  function render(pullRequests, failure) {
    last = { pullRequests, failure };
    const key = JSON.stringify([view, pullRequests, failure?.message, collapsed]);
    if (key === shown) return;
    if (!pullRequests.length && !failure) {
      hide();
      return;
    }
    shown = key;
    lockPublishing(pullRequests);

    const worst = pullRequests.reduce(
      (state, pullRequest) =>
        severity.indexOf(pullRequest.state) > severity.indexOf(state)
          ? pullRequest.state
          : state,
      'green',
    );
    let title = `PRs abertos · ${pullRequests.length}`;
    let announcement = '';
    if (failure) {
      title = 'GitHub sem resposta';
    } else if (view.branch) {
      title = `PR #${pullRequests[0].number} · ${stateLabels[worst]}`;
      announcement = `PR #${pullRequests[0].number}: ${stateLabels[worst]}`;
    }
    announcer.textContent = announcement;

    const toggle = h(
      'button',
      {
        class: 'pr-status__toggle',
        type: 'button',
        'aria-expanded': String(!collapsed),
        'aria-controls': 'pr-status-body',
        onclick: () => {
          collapsed = !collapsed;
          try {
            localStorage.setItem('pr-status-collapsed', collapsed ? '1' : '0');
          } catch {}
          render(pullRequests, failure);
        },
      },
      h('span', {
        class: 'pr-status__dot',
        'data-state': failure ? 'failure' : worst,
        'aria-hidden': 'true',
      }),
      h('span', { class: 'pr-status__title' }, title),
      h('span', { class: 'pr-status__chevron', 'aria-hidden': 'true' }),
    );
    const body = h(
      'div',
      { class: 'pr-status__body', id: 'pr-status-body', hidden: collapsed },
      failure
        ? [
            h(
              'p',
              { class: 'pr-status__summary' },
              'Não consegui ler o status dos PRs no GitHub.',
            ),
            h(
              'p',
              { class: 'pr-status__actions' },
              h('button', { type: 'button', onclick: refresh }, 'Tentar de novo'),
            ),
          ]
        : pullRequests.map(pullRequestBlock),
    );
    card.replaceChildren(toggle, body);
    card.hidden = false;
  }

  async function refresh() {
    clearTimeout(timer);
    const next = github && currentView();
    if (JSON.stringify(next) !== JSON.stringify(view)) {
      view = next;
      hide();
    }
    if (!view || document.hidden) return;
    const id = ++request;
    try {
      const pullRequests = await readPullRequests(github, view.branch);
      if (id !== request) return;
      render(pullRequests);
      schedule(
        pullRequests.some((pullRequest) => pullRequest.state === 'pending')
          ? pendingRefresh
          : settledRefresh,
      );
    } catch (error) {
      if (id !== request) return;
      render([], error);
      schedule(settledRefresh);
    }
  }

  function schedule(delay) {
    clearTimeout(timer);
    timer = setTimeout(refresh, delay);
  }

  window.addEventListener('DOMContentLoaded', () => {
    const { CMS } = window;
    if (!CMS) return;
    adaptGitHub(CMS);
    CMS.registerEventListener({ name: 'prePublish', handler: guardPublish });
    // A save starts the checks again; a publish closes the pull request.
    CMS.registerEventListener({
      name: 'postSave',
      handler: () => schedule(3000),
    });
    CMS.registerEventListener({
      name: 'postPublish',
      handler: () => schedule(1000),
    });
    CMS.init();
    document.head.append(lock);
    document.body.append(card, announcer);
    window.addEventListener('hashchange', refresh);
    document.addEventListener('visibilitychange', refresh);
    // Before Decap's own handlers, which React attaches to its root.
    document.addEventListener('click', stopLockedPublish, true);
  });
})();
