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
    // The hangar.
    hangar: 'Hangar',
    shipsReady: '{count} ships ready',
    chooseShip: 'Choose your ship',
    roster: 'Ships',
    takeOff: 'Take off',
    changeShip: 'Change ship',
    backToSite: 'Back to the portfolio',
    dragToTurn: 'Drag to turn the ship',
    classes: {
      starfighter: 'Starfighter',
      interceptor: 'Interceptor',
      freighter: 'Light freighter',
      bomber: 'Bomber',
    },
    speed: 'Top speed',
    acceleration: 'Acceleration',
    agility: 'Turn rate',
    boost: 'Boost',
    ships: {
      xwing:
        'The Rebellion’s all-rounder: balanced in every way and easy to fly.',
      tie: 'The Empire’s short-range fighter: the quickest off the line and quick to turn, with a modest boost.',
      falcon:
        'A Corellian freighter: heavy in the turns, with the strongest boost in the hangar.',
      awing:
        'An interceptor built for pursuit: the fastest ship here, with the sharpest turn.',
      ywing: 'A rugged bomber: slow and steady, built to take a hit.',
      n1: 'The royal starfighter of Naboo: smooth, quick and elegant.',
    },
    // The flight's instruments.
    speedLabel: 'Speed',
    sections: 'Sections',
    holocronsLabel: 'Holocrons',
    centralDeck: 'Central deck',
    keysFly: 'Fly',
    keysBoost: 'Boost',
    keysMap: 'Chart',
    keysPhoto: 'Photo',
    joystick: 'Joystick',
    // Landing on a pad, and the section it opens.
    landingZone: 'Landing zone',
    slowDown: 'Slow down to land',
    landing: 'Landing…',
    landed: 'Landed',
    openOnSite: 'Open on the site',
    backToFlight: 'Back to the flight',
    visited: '{count} of {total} sections',
    explored: 'Portfolio explored',
    allVisited:
      'Every section explored. Thanks for flying through my portfolio.',
    // The navigation chart.
    navComputer: 'Nav computer',
    map: 'Navigation chart',
    openMap: 'Open the navigation chart',
    closeMap: 'Close the navigation chart',
    chartHint: 'Choose a destination to set a course.',
    setCourse: 'Set a course for {place}',
    courseSet: 'Course set',
    youAreHere: 'You are here',
    sectionOpened: 'Explored',
    notOpened: 'Unexplored',
    // The holocrons hidden on the planets.
    holocrons: '{count} of {total} holocrons',
    holocronFound: 'Holocron recovered',
    holocronHidden: 'Holocron hidden here',
    holocronOn: 'On {planet}',
    archiveComplete: 'Archive complete',
    allFoundTitle: 'All seven holocrons recovered',
    allFoundLine: 'May the Force be with you.',
    allFound: 'You recovered every holocron. May the Force be with you.',
    // The sounds, off until turned on, and the photo mode.
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    photoMode: 'Photo mode',
    savePhoto: 'Save photo',
    leavePhoto: 'Leave photo mode',
    photoSaved: 'Photo saved',
    loading: 'Preparing the hangar…',
    noWebgl:
      'This browser cannot draw 3D graphics, so the game cannot open here. The portfolio works as usual.',
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
