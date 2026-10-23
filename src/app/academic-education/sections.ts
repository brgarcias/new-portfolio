interface EducationStep {
  label: string;
  title: string;
  content: string;
  // Steps that are still ahead.
  upcoming?: boolean;
}

export const steps: EducationStep[] = [
  {
    label: 'Elementary School',
    title: 'Colégio Salesiano Santa Teresinha',
    content: `I began my education at the age of 3 in 2002 at Salesian School Santa Teresinha.
      My mother worked as a teaching assistant at the school, which made it possible for 
      me to attend on a full scholarship. This excellent school played a pivotal role in my 
      early development, imparting a variety of values and fundamental principles crucial 
      for a child's growth.`,
  },
  {
    label: 'High school',
    title: 'Colégio Salesiano Santa Teresinha',
    content: `I continued my high school studies at Salesian School Santa Teresinha, which greatly aided
      me in preparing for exams and practice tests, including the ENEM and FUVEST. After completing
      high school, I spent one year in a preparatory course at ETAPA. I successfully passed the first
      phase of the FUVEST, but unfortunately, I didn't make it through the second phase.`,
  },
  {
    label: 'University Education',
    title: 'Universidade São Judas Tadeu',
    content: `Although I completed my studies at São Judas Tadeu University, I began my undergraduate education in
      2018 at Anhembi Morumbi University, majoring in Computer Engineering. I really enjoyed the program and
      the university's excellent facilities, and my studies were progressing well. However, after the first
      semester, the tuition fees became prohibitively high, and I didn't have the financial resources to continue.
      So, in mid-2018, I transferred to São Judas Tadeu University and switched to the Computer Science program,
      ultimately graduating in the first semester of 2022.`,
  },
  {
    label: 'Postgraduate',
    title: 'Which course?',
    content: `A dream to come true...`,
    upcoming: true,
  },
  {
    label: 'Doctorate Degree',
    title: 'When will be?',
    content: `But I don't want to be called a doctor!`,
    upcoming: true,
  },
];
