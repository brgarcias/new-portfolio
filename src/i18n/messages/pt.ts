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
    play: 'Jogar',
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
  game: {
    title: 'Jogar',
    description:
      'Pilote uma nave do Star Wars pelo meu portfólio: escolha uma no hangar e pouse nas seções, cada uma num planeta.',
    hangar: 'Hangar',
    chooseShip: 'Escolha sua nave',
    takeOff: 'Decolar',
    changeShip: 'Trocar nave',
    backToSite: 'Voltar ao portfólio',
    speed: 'Velocidade',
    agility: 'Agilidade',
    boost: 'Turbo',
    keyboard: 'W, A, S, D ou as setas pilotam · Shift ou Espaço dá turbo',
    joystick: 'Joystick',
    radar: 'Radar',
    allVisited: 'Você voou por todo o portfólio. Obrigado!',
    landingPad: 'Plataforma: {place}',
    stopToLand: 'Pare aqui para abrir',
    openOnSite: 'Abrir no site',
    visited: '{count} de {total} seções',
    loading: 'Abrindo o hangar…',
    noWebgl:
      'Este navegador não desenha gráficos 3D, então o jogo não abre aqui. O portfólio funciona normalmente.',
    ships: {
      xwing: 'Caça rebelde de quatro asas: equilibrado e confiável.',
      tie: 'Caça imperial: arranca e gira rápido, leve como uma folha.',
      falcon:
        'Cargueiro coreliano: pesado e lento nas curvas, com o turbo mais forte do hangar.',
      awing: 'Interceptador: a nave mais rápida daqui, e a curva mais fechada.',
      ywing: 'Bombardeiro: lento e firme; aguenta os esbarrões.',
      n1: 'Caça real de Naboo: suave, elegante e veloz.',
    },
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
