import {
  expect as baseExpect,
  test,
  type Page,
  type Route,
} from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// The content panel (/admin) works on GitHub, so these tests answer for it:
// main has the test content, and a pull request opened by the panel changes
// the About text.

test.skip(({ isMobile }) => isMobile, 'O painel é usado no computador.');

// Decap is a heavy page, and the tests share the machine.
test.describe.configure({ timeout: 60_000 });
const expect = baseExpect.configure({ timeout: 15_000 });

const repo = '/repos/brgarcias/new-portfolio';
const contentDir = path.join(process.cwd(), 'tests/fixtures/content');
const branch = 'cms/site/about';
const title = 'chore(conteúdo): atualiza "about" em Textos do site';
const preview = 'https://deploy-preview-31--brgarcias-portfolio.netlify.app';

type Write = { method: string; path: string; body: unknown };
type CommitInput = {
  branch: { repositoryNameWithOwner: string; branchName: string };
  expectedHeadOid: string;
  message: { headline: string; body?: string };
  fileChanges: {
    additions: { path: string; contents: string }[];
    deletions: { path: string }[];
  };
};

async function fakeGitHub(page: Page) {
  const blobs = new Map<string, string>();
  const blob = (text: string) => {
    const sha = `blob${blobs.size}`;
    blobs.set(sha, text);
    return sha;
  };
  const about = readFileSync(path.join(contentDir, 'site/about.json'), 'utf8');
  const github = {
    checks: 'pending' as 'pending' | 'green' | 'failure',
    behind: false,
    refuseMerge: false,
    merged: false,
    commits: 0,
    head: 'head1',
    file: blob(about.replace('Technologies & tools', 'Technologies and tools')),
    // Requests that change the repository.
    writes: [] as Write[],
  };

  const pullRequest = () => ({
    number: 31,
    title,
    state: 'open',
    html_url: 'https://github.com/brgarcias/new-portfolio/pull/31',
    head: { ref: branch, sha: github.head, repo: { fork: false } },
    base: { ref: 'main', sha: 'main1', repo: { fork: false } },
    labels: [{ id: 1, name: 'decap-cms/pending_publish' }],
    user: { login: 'brgarcias' },
    updated_at: '2026-10-24T17:39:31Z',
  });

  const status = () => {
    const done = github.checks !== 'pending';
    const quality = github.checks === 'green' ? 'SUCCESS' : 'FAILURE';
    let mergeStateStatus = 'BLOCKED';
    if (github.behind) mergeStateStatus = 'BEHIND';
    else if (github.checks === 'green') mergeStateStatus = 'CLEAN';
    return {
      number: 31,
      title,
      url: 'https://github.com/brgarcias/new-portfolio/pull/31',
      headRefName: branch,
      headRefOid: github.head,
      mergeStateStatus,
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: {
                contexts: {
                  nodes: [
                    {
                      __typename: 'CheckRun',
                      name: 'quality',
                      status: done ? 'COMPLETED' : 'IN_PROGRESS',
                      conclusion: done ? quality : null,
                      detailsUrl:
                        'https://github.com/brgarcias/new-portfolio/actions/runs/1',
                    },
                    {
                      __typename: 'CheckRun',
                      name: 'Pages changed - brgarcias-portfolio',
                      status: 'COMPLETED',
                      conclusion: 'NEUTRAL',
                      detailsUrl: 'https://app.netlify.com/',
                    },
                    {
                      __typename: 'StatusContext',
                      context: 'netlify/brgarcias-portfolio/deploy-preview',
                      state: 'SUCCESS',
                      targetUrl: preview,
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    };
  };

  async function handle(route: Route) {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = decodeURIComponent(url.pathname);
    const method = request.method();
    const json = (body: unknown, status = 200) =>
      route.fulfill({ status, json: body });
    // Only the pull request of the About text exists.
    const head = url.searchParams.get('head');
    const open = !github.merged && (!head || head === `brgarcias:${branch}`);

    if (pathname === '/graphql') {
      const { query, variables } = request.postDataJSON();
      if (query.includes('createCommitOnBranch')) {
        const input = variables.input as CommitInput;
        github.writes.push({
          method,
          path: 'createCommitOnBranch',
          body: input,
        });
        const contents = input.fileChanges.additions[0].contents;
        github.file = blob(Buffer.from(contents, 'base64').toString());
        github.commits += 1;
        github.head = `head${github.commits + 1}`;
        return json({
          data: { createCommitOnBranch: { commit: { oid: github.head } } },
        });
      }
      const listed =
        !github.merged && (!variables.head || variables.head === branch);
      return json({
        data: {
          repository: { pullRequests: { nodes: listed ? [status()] : [] } },
        },
      });
    }
    if (method !== 'GET') {
      github.writes.push({
        method,
        path: pathname,
        body: request.postDataJSON(),
      });
    }

    if (pathname === '/user' || pathname.startsWith('/users/')) {
      return json({ login: 'brgarcias', name: 'Bruno Garcia' });
    }
    if (pathname === repo) {
      return json({
        owner: { login: 'brgarcias' },
        permissions: { push: true },
      });
    }
    if (pathname === `${repo}/pulls`) return json(open ? [pullRequest()] : []);
    if (pathname === `${repo}/pulls/31/merge`) {
      if (github.refuseMerge) {
        return json(
          { message: 'Required status check "quality" is failing.' },
          405,
        );
      }
      github.merged = true;
      return json({ merged: true });
    }
    if (pathname === `${repo}/pulls/31/update-branch`) {
      return json({ message: 'Updating pull request branch.' }, 202);
    }
    if (pathname === `${repo}/git/refs/heads/${branch}`) {
      return route.fulfill({ status: 204 });
    }
    if (pathname === `${repo}/branches/main`) {
      return json({ commit: { sha: 'main1' } });
    }
    if (pathname.startsWith(`${repo}/compare/`)) {
      return json({
        behind_by: github.behind ? 1 : 0,
        files: [
          {
            filename: 'content/site/about.json',
            status: 'modified',
            sha: github.file,
            patch: '@@ -1 +1 @@',
          },
        ],
      });
    }
    const folder = /\/git\/trees\/main:content\/(.+)$/.exec(pathname);
    if (folder) {
      const dir = path.join(contentDir, folder[1]);
      return json({
        tree: readdirSync(dir).map((name) => ({
          path: name,
          type: 'blob',
          sha: blob(readFileSync(path.join(dir, name), 'utf8')),
        })),
      });
    }
    // The media folders.
    if (pathname.startsWith(`${repo}/git/trees/`)) return json({ tree: [] });
    const file = /\/git\/blobs\/(.+)$/.exec(pathname);
    if (file && blobs.has(file[1])) {
      const text = blobs.get(file[1]) ?? '';
      return json({
        content: Buffer.from(text).toString('base64'),
        encoding: 'base64',
      });
    }
    if (pathname === `${repo}/commits`) {
      return json([
        { commit: { author: { name: 'Bruno Garcia', date: '2026-10-24' } } },
      ]);
    }
    if (pathname.endsWith('/status')) return json({ statuses: [] });
    if (pathname === `${repo}/issues`) return json([]);
    return json({ message: 'Not Found' }, 404);
  }

  await page.route('https://api.github.com/**', handle);
  return github;
}

const writes = (github: { writes: Write[] }) =>
  github.writes.map(({ method, path }) => `${method} ${path}`);

// The card reads GitHub again when the route changes.
async function refreshCard(page: Page) {
  await page.evaluate(() =>
    window.dispatchEvent(new HashChangeEvent('hashchange')),
  );
}

test.beforeEach(async ({ page }) => {
  // Decap confirms before publishing and deleting.
  page.on('dialog', (dialog) => dialog.accept());
  await page.addInitScript(() =>
    localStorage.setItem(
      'decap-cms-user',
      JSON.stringify({ backendName: 'github', token: 'token' }),
    ),
  );
});

test('mostra os checks do PR no painel e só publica com tudo verde', async ({
  page,
}) => {
  const github = await fakeGitHub(page);
  await page.goto('/admin#/collections/site/entries/about');
  const card = page.getByRole('region', { name: 'Status no GitHub' });
  const toggle = card.locator('.pr-status__toggle');
  await expect(toggle).toHaveText('PR #31 · checks rodando');
  await expect(card.getByRole('listitem')).toHaveText([
    /Deploy Preview\s*passou/,
    /Pages changed\s*ignorado/,
    /quality\s*rodando/,
  ]);
  await expect(
    card.getByRole('link', { name: 'Ver a prévia' }),
  ).toHaveAttribute('href', preview);

  // "Publicar" looks disabled, and a click on it opens the card instead.
  const publish = page.getByRole('button', { name: 'Publicar', exact: true });
  await expect(publish).toHaveCSS('opacity', '0.45');
  await publish.click();
  await expect(toggle).toBeFocused();
  await expect(page.getByText('Publicar agora')).toBeHidden();

  // The card may be out of date: publishing asks GitHub again.
  github.checks = 'green';
  await refreshCard(page);
  await expect(toggle).toHaveText('PR #31 · tudo verde');
  await expect(publish).toHaveCSS('opacity', '1');
  github.checks = 'pending';
  await publish.click();
  await page.getByText('Publicar agora').click();
  await expect(
    page.getByText(
      'Falha ao publicar: os checks do PR #31 ainda estão rodando. Publique quando tudo ficar verde.',
    ),
  ).toBeVisible();
  await expect(toggle).toHaveText('PR #31 · checks rodando');
  expect(writes(github)).toEqual([]);

  github.checks = 'green';
  await refreshCard(page);
  await expect(toggle).toHaveText('PR #31 · tudo verde');
  await publish.click();
  await page.getByText('Publicar agora').click();
  await expect(page.getByText('Entrada publicada')).toBeVisible();
  // GitHub squash-merges the pull request and signs that commit.
  expect(writes(github)).toEqual([
    `PUT ${repo}/pulls/31/merge`,
    `DELETE ${repo}/git/refs/heads/${branch}`,
  ]);
  expect(github.writes[0].body).toMatchObject({ merge_method: 'squash' });
  await expect(card).toBeHidden();
});

test('mostra o check que falhou', async ({ page }) => {
  const github = await fakeGitHub(page);
  github.checks = 'failure';
  await page.goto('/admin#/collections/site/entries/about');
  const card = page.getByRole('region', { name: 'Status no GitHub' });
  await expect(card.locator('.pr-status__toggle')).toHaveText(
    'PR #31 · check falhou',
  );
  await expect(card.locator('.pr-status__summary')).toHaveText(
    'O check quality falhou. Veja o motivo no GitHub.',
  );
  await expect(card.getByRole('link', { name: 'quality' })).toHaveAttribute(
    'href',
    'https://github.com/brgarcias/new-portfolio/actions/runs/1',
  );
  await expect(
    page.getByRole('button', { name: 'Publicar', exact: true }),
  ).toHaveCSS('opacity', '0.45');
});

test('salva cada alteração num commit assinado pelo GitHub', async ({
  page,
}) => {
  const github = await fakeGitHub(page);
  github.behind = true;
  await page.goto('/admin#/collections/site/entries/about');
  const field = page
    .getByRole('textbox', { name: 'Título da lista de tecnologias' })
    .first();
  await expect(field).toHaveValue('Technologies and tools');
  await field.fill('Technologies and tooling');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByText('Entrada salva')).toBeVisible();

  // One commit by createCommitOnBranch, which GitHub signs, and then a merge
  // of main, which GitHub also signs, because the branch was behind.
  expect(writes(github)).toEqual([
    'POST createCommitOnBranch',
    `PUT ${repo}/pulls/31/update-branch`,
  ]);
  const commit = github.writes[0].body as CommitInput;
  expect(commit.branch).toEqual({
    repositoryNameWithOwner: 'brgarcias/new-portfolio',
    branchName: branch,
  });
  expect(commit.expectedHeadOid).toBe('head1');
  expect(commit.message).toEqual({ headline: title });
  expect(commit.fileChanges.deletions).toEqual([]);
  const [file] = commit.fileChanges.additions;
  expect(file.path).toBe('content/site/about.json');
  const saved = JSON.parse(Buffer.from(file.contents, 'base64').toString());
  expect(saved.en.stackTitle).toBe('Technologies and tooling');
  expect(saved.pt.stackTitle).toBe('Tecnologias e ferramentas');
  expect(github.writes[1].body).toEqual({ expected_head_sha: 'head2' });
});

test('mostra os PRs abertos no fluxo de trabalho e atualiza o que está atrás da main', async ({
  page,
}) => {
  const github = await fakeGitHub(page);
  github.behind = true;
  await page.goto('/admin#/workflow');
  const card = page.getByRole('region', { name: 'Status no GitHub' });
  await expect(card.locator('.pr-status__toggle')).toHaveText(
    'PRs abertos · 1',
  );
  await expect(
    card.getByRole('link', { name: '#31 Atualiza "about" em Textos do site' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/brgarcias/new-portfolio/pull/31',
  );
  await expect(card.locator('.pr-status__summary')).toHaveText(
    'A main mudou depois deste PR. Atualize para os checks rodarem de novo.',
  );
  await expect(
    page.getByRole('button', { name: 'Publicar alterações' }),
  ).toHaveCSS('opacity', '0.45');

  await card.getByRole('button', { name: 'Atualizar com a main' }).click();
  await expect(
    card.getByRole('button', { name: 'Atualizando…' }),
  ).toBeDisabled();
  expect(writes(github)).toEqual([`PUT ${repo}/pulls/31/update-branch`]);
  expect(github.writes[0].body).toEqual({ expected_head_sha: 'head1' });

  // The card can be closed, and it stays closed.
  await card.locator('.pr-status__toggle').click();
  await expect(card.locator('.pr-status__body')).toBeHidden();
  await page.reload();
  await expect(card.locator('.pr-status__toggle')).toHaveAttribute(
    'aria-expanded',
    'false',
  );
});

test('não grava direto na main', async ({ page }) => {
  const github = await fakeGitHub(page);
  github.checks = 'green';
  github.refuseMerge = true;
  await page.goto('/admin#/collections/site/entries/about');
  await expect(page.locator('.pr-status__toggle')).toHaveText(
    'PR #31 · tudo verde',
  );
  // When GitHub refuses the merge, Decap would commit to main instead.
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await page.getByText('Publicar agora').click();
  await expect(
    page.getByText(
      'Falha ao publicar: o GitHub não aceitou o merge do PR #31. Confira os checks e tente de novo.',
    ),
  ).toBeVisible();
  expect(writes(github)).toEqual([`PUT ${repo}/pulls/31/merge`]);

  // Unpublishing deletes the entry from main, another commit to main.
  await page.goto('/admin#/collections/experiences/entries/2021-03-trocafone');
  await page.getByRole('button', { name: 'Publicado' }).click();
  await page.getByText('Despublicar').click();
  await expect(
    page.getByText(
      /^Falha ao cancelar a publicação da entrada: a main só aceita mudanças por PR/,
    ),
  ).toBeVisible();
  expect(writes(github)).toEqual([`PUT ${repo}/pulls/31/merge`]);
});
