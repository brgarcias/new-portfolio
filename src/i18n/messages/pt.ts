import type { Messages } from './en';

// The interface texts in Portuguese, as spoken in Brazil.
const pt: Messages = {
  meta: {
    title: 'Bruno Garcia — Dev. Full-Stack',
    description: 'Bruno Garcia: um desenvolvedor Full-Stack inspirado',
    ogLocale: 'pt_BR',
    dateLocale: 'pt-BR',
  },
  frame: {
    skipToContent: 'Pular para o conteúdo',
    sections: 'Seções',
    menu: 'Menu',
    openMenu: 'Abrir o menu',
    closeMenu: 'Fechar o menu',
    backToPage: 'Voltar para a página',
    cv: 'CV',
    downloadCv: 'Baixar CV',
    language: 'Idioma',
    toLightTheme: 'Mudar para o tema claro',
    toDarkTheme: 'Mudar para o tema escuro',
    socialLinks: 'Redes sociais',
    email: 'E-mail',
    backToTop: 'Voltar ao topo',
  },
  hero: {
    currently: 'Atualmente {role} na {company}',
    contact: 'Fale comigo',
    downloadCv: 'Baixar CV',
    feedback: 'Deixar feedback',
    scrollToAbout: 'Ir para Sobre mim',
  },
  feedback: {
    title: 'Boas-vindas!',
    subtitle:
      'Compartilhe suas impressões e sugestões para me ajudar a melhorar o portfólio.',
    nameLabel: 'Nome completo',
    namePlaceholder: 'Como você se chama?',
    nameError: 'Por favor, escreva seu nome.',
    emailLabel: 'E-mail',
    emailPlaceholder: 'Digite seu e-mail',
    emailError: 'Por favor, informe seu e-mail.',
    feedbackLabel: 'Feedback',
    feedbackPlaceholder: 'Deixe seu feedback',
    feedbackError: 'Por favor, escreva seu feedback.',
    botField: 'Não preencha este campo:',
    close: 'Fechar',
    send: 'Enviar',
    sentTitle: 'Mensagem enviada',
    sentText: 'Muito obrigado pelo seu feedback!',
    failedTitle: 'Tivemos um problema',
    failedText: 'Ocorreu um erro ao enviar sua mensagem!',
  },
  dialog: {
    close: 'Fechar',
    closeNotice: 'Fechar o aviso',
  },
  experience: {
    technologies: 'Tecnologias',
    present: 'Atual',
    years: '{count}a',
    months: '{count}m',
  },
  education: {
    steps: 'Formação',
  },
  courses: {
    details: 'Ver detalhes',
  },
  projects: {
    list: 'Projetos',
    details: 'Ver detalhes',
    detailsAbout: ' de {title}',
    previous: 'Projeto anterior',
    next: 'Próximo projeto',
    website: 'Conhecer o site',
  },
  contributing: {
    previous: 'Foto anterior',
    next: 'Próxima foto',
  },
  contact: {
    age: '{age} anos',
  },
  notFound: {
    label: 'Erro 404',
    heading: 'Página não encontrada',
    text: 'Esta página não existe, mas você pode [voltar ao portfólio]!',
    quote: 'Nem todos os que vagueiam estão perdidos.',
    author: 'J.R.R. Tolkien',
    back: 'Voltar ao portfólio',
  },
  error: {
    label: 'Erro inesperado',
    heading: 'Algo deu errado',
    text: 'Desculpe, esta página parou de funcionar. Por favor, [tente de novo]!',
    quote:
      'O fracasso é só a oportunidade de começar de novo, desta vez com mais inteligência.',
    author: 'Henry Ford',
    retry: 'Tentar de novo',
  },
};

export default pt;
