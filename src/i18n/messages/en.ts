// The interface texts in English. The texts of the sections are content,
// in content/; these are the labels, buttons and messages around them.
// "{name}" marks a value filled in when the text is shown.
const en = {
  meta: {
    title: 'Bruno Garcia — Dev. Full-Stack',
    description: 'Bruno Garcia: An inspired Full-Stack Developer',
    ogLocale: 'en_US',
    // How dates are written, as in "Oct 2025".
    dateLocale: 'en-US',
  },
  frame: {
    skipToContent: 'Skip to content',
    sections: 'Sections',
    menu: 'Menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    backToPage: 'Back to the page',
    cv: 'CV',
    downloadCv: 'Download CV',
    language: 'Language',
    toLightTheme: 'Switch to light theme',
    toDarkTheme: 'Switch to dark theme',
    socialLinks: 'Social links',
    email: 'Email',
    backToTop: 'Back to top',
  },
  hero: {
    currently: 'Currently {role} at {company}',
    contact: 'Contact me',
    downloadCv: 'Download CV',
    feedback: 'Leave Feedback',
    play: 'Play',
    scrollToAbout: 'Scroll to About Me',
  },
  feedback: {
    title: 'Welcome!',
    subtitle:
      'Please share your thoughts and feedback to help me improve my portfolio.',
    nameLabel: 'Full Name',
    namePlaceholder: 'Let me know you',
    nameError: 'Please, write your name.',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    emailError: 'Please, tell me your email.',
    feedbackLabel: 'Feedback',
    feedbackPlaceholder: 'Leave your feedback',
    feedbackError: 'Please, give me your feedback.',
    // The label of the field robots fill in and visitors never see.
    botField: "Don't fill this out:",
    close: 'Close',
    send: 'Send',
    sentTitle: 'Message Submitted',
    sentText: 'Thank you very much for your feedback!',
    failedTitle: 'We had a problem',
    failedText: 'An error occurred while sending your message!',
  },
  dialog: {
    close: 'Close',
    closeNotice: 'Close notification',
  },
  experience: {
    technologies: 'Technologies',
    present: 'Present',
    // The duration of a role, such as "1y 1m".
    years: '{count}y',
    months: '{count}m',
  },
  education: {
    steps: 'Education',
  },
  courses: {
    details: 'View details',
  },
  projects: {
    list: 'Projects',
    details: 'See details',
    // Read after "See details" by screen readers only.
    detailsAbout: ' about {title}',
    previous: 'Previous Project',
    next: 'Next Project',
    website: 'See more about the website',
  },
  contributing: {
    previous: 'Previous photo',
    next: 'Next photo',
  },
  contact: {
    age: '{age} years',
  },
  game: {
    title: 'Play',
    description:
      'Fly a Star Wars ship through my portfolio: choose one in the hangar and land on the sections, each on a planet of its own.',
    hangar: 'Hangar',
    chooseShip: 'Choose your ship',
    takeOff: 'Take off',
    changeShip: 'Change ship',
    backToSite: 'Back to the portfolio',
    speed: 'Speed',
    agility: 'Agility',
    boost: 'Boost',
    keyboard:
      'W, A, S, D or the arrows fly · Shift or Space boosts · M opens the map · P takes photos',
    joystick: 'Joystick',
    radar: 'Radar',
    dragToTurn: 'Drag to turn the ship',
    map: 'Map',
    openMap: 'Open the map',
    closeMap: 'Close the map',
    youAreHere: 'You are here',
    sectionOpened: 'Section opened',
    notOpened: 'Not opened yet',
    // The holocrons hidden on the planets.
    holocrons: '{count} of {total} holocrons',
    holocronFound: 'Holocron found',
    allFound: 'You found every holocron. May the Force be with you!',
    // The sounds, off until turned on, and the photo mode.
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    photoMode: 'Photo mode',
    savePhoto: 'Save photo',
    leavePhoto: 'Leave photo mode',
    allVisited: 'You flew through the whole portfolio. Thank you!',
    // The name of the pad the ship is on.
    landingPad: 'Landing pad: {place}',
    stopToLand: 'Stop here to open it',
    openOnSite: 'Open on the site',
    visited: '{count} of {total} sections',
    loading: 'Opening the hangar…',
    noWebgl:
      'This browser cannot draw 3D graphics, so the game cannot open here. The portfolio works as usual.',
    ships: {
      xwing: 'Rebel starfighter with four wings: balanced and dependable.',
      tie: 'Imperial fighter: quick off the mark and quick to turn, light as a leaf.',
      falcon:
        'Corellian freighter: heavy and slow to turn, with the strongest boost in the hangar.',
      awing: 'Interceptor: the fastest ship here, and the sharpest turn.',
      ywing: 'Bomber: slow and steady; it shrugs off the bumps.',
      n1: 'Royal starfighter of Naboo: smooth, elegant and fast.',
    },
  },
  notFound: {
    label: 'Error 404',
    heading: 'Page Not Found',
    // The [link] goes back to the portfolio.
    text: 'This page does not exist, but you can [go back to the portfolio]!',
    quote: 'Not all those who wander are lost.',
    author: 'J.R.R. Tolkien',
    back: 'Back to the portfolio',
  },
  error: {
    label: 'Unexpected Error',
    heading: 'Something Went Wrong',
    // The [link] reloads the page.
    text: 'Sorry, this page stopped working. Please [try again]!',
    quote:
      'Failure is simply the opportunity to begin again, this time more intelligently.',
    author: 'Henry Ford',
    retry: 'Try again',
  },
};

export default en;

export type Messages = typeof en;
