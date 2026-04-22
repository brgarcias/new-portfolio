import {
  faCode,
  faDesktopAlt,
  faMobileRetro,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  calculateDuration,
  formatDateRange,
} from "@/src/app/professional-experience/date-format";

export const experiences = [
  {
    id: 1,
    date: formatDateRange("2025-10"),
    duration: calculateDuration("2025-10"),
    company: "PayPal",
    icon: faCode,
    title: "Software Engineer (Node.js / GraphQL Platform)",
    description: `
      <ul>
        <li>Designed and evolved GraphQL schemas powering scalable data access across multiple platform services and frontend applications</li>
        <li>Implemented resilient APIs supporting service-to-service communication within a distributed architecture</li>
        <li>Improved resolver performance and query efficiency, reducing over-fetching and optimizing client response times</li>
        <li>Applied clean architecture and strong modular design patterns to support maintainability across a growing codebase</li>
        <li>Collaborated cross-functionally with platform engineers, product stakeholders, and frontend teams to deliver secure and production-grade features at scale</li>
      </ul>
      `,
  },
  {
    id: 2,
    date: formatDateRange("2025-02", "2026-03"),
    duration: calculateDuration("2025-02", "2026-03"),
    company: "Ab Inbev",
    icon: faCode,
    title: "Full Stack Developer",
    description: `
    <ul>
      <li>Developing and maintaining scalable RESTful APIs and GraphQL services using NestJS.</li>  
      <li>Building high-performance web applications with Next.js, ensuring optimal user experience and performance.</li>  
      <li>Designing and optimizing relational databases using Microsoft SQL Server to support business-critical applications.</li>  
      <li>Deploying and managing cloud-based solutions on Microsoft Azure, leveraging Azure DevOps Services for CI/CD automation.</li>  
      <li>Implementing best practices in code quality, security, and performance to ensure robust and maintainable software.</li>  
      <li>Collaborating with cross-functional teams to align software solutions with business objectives.</li>  
      <li>Managing source control, pipelines, and deployments using Azure DevOps Server.</li>
    </ul>`,
  },
  {
    id: 3,
    date: formatDateRange("2024-09", "2025-02"),
    duration: calculateDuration("2024-09", "2025-02"),
    company: "Serasa",
    icon: faCode,
    title: "Backend Developer",
    description: `
    <ul>
      <li>Focused on developing unit and end-to-end (E2E) tests using Jest, ensuring the reliability and quality of delivered applications.</li>  
      <li>Experience in handling parallelism and concurrency, optimizing the performance of complex systems and ensuring efficiency in executing multiple simultaneous tasks.</li>  
      <li>Implementation of solutions with AWS Lambda, SQS, SNS, and Step Functions, leveraging serverless resources to create scalable and highly available systems.</li>  
      <li>Node.js: Development of robust and scalable applications using the NestJS framework to create modular and maintainable solutions.</li>  
      <li>Development of RESTful APIs to facilitate service integration and meet client needs with high performance and security.</li>  
      <li>Utilization of microservices-based architectures, promoting modularity and system resilience in production.</li>  
      <li>Experience with API Gateway for request management and ensuring efficient communication between services.</li>
    </ul>`,
  },
  {
    id: 4,
    date: formatDateRange("2024-06", "2025-02"),
    duration: calculateDuration("2024-06", "2025-02"),
    company: "Domy",
    icon: faCode,
    title: "Backend Developer",
    description: `
    <ul>
      <li>Backend Development: Designing and implementing server-side logic to ensure high performance and responsiveness to front-end requests.</li>
      <li>Node.js: Leveraging the power of Node.js to build efficient and scalable network applications.</li>
      <li>NestJS: Utilizing NestJS framework to develop maintainable and modular server-side applications.</li>
      <li>AWS: Implementing and managing cloud infrastructure using Amazon Web Services to ensure reliability and scalability.</li>
      <li>API REST: Designing and developing RESTful APIs to enable seamless communication between client and server.</li>
      <li>Microservices: Building and orchestrating microservices architecture to enhance modularity and improve system resilience.</li>
      <li>API Gateway: Managing and routing API requests efficiently with API Gateway to ensure secure and consistent service delivery.</li>
      <li>Passionate about leveraging modern technologies to solve complex problems, I thrive in dynamic environments where innovation and continuous learning are valued.</li>
    </ul>`,
  },
  {
    id: 5,
    date: formatDateRange("2021-03", "2024-07"),
    duration: calculateDuration("2021-03", "2024-07"),
    company: "Trocafone",
    icon: faCode,
    title: "Full Stack Developer",
    description: `
    <ul>
      <h3>Full Stack Developer</h3>
      <li>Productively collaborated with the Product team to understand portfolio
      management, analysis, and risk-related business requirements and specifications.</li>
      <li>Actively participated in creating strategic initiatives to design, code,
      and test innovative solutions.</li>
      <li>Implemented and updated application modules under Product team supervision,
      ensuring alignment with established guidelines.</li>
      <li>Led discussions, analysis, and development of new projects, ensuring their
      technical feasibility and alignment with business objectives.</li>
      <li>Worked with a wide range of technologies, including PHP (CodeIgniter/Laravel),
      GraphQl/REST API, ReactJS/NextJS, NodeJS/NestJS, Python, MySQL/PostgreSQL, Jira,
      Jenkins, and AWS Cloud (RDS, EC2, S3, SQS, SNS, Lambda).</li>
      <li>Led the development of five major projects, three of which focused on information
      distribution and idea sharing. Utilized Node.js/NestJS and PHP/Laravel for the
      backend with REST API and GraphQL, and React.js/Next.js and Blade (PHP) for
      the frontend.</li>
      <li>Actively participated in collaborative projects emphasizing information sharing,
      interdisciplinary networking, and continuous communication, demonstrating
      resilience and adaptability.</li>
      <h3>Backend Developer</h3>
      <li>Developing scalable and efficient web applications using Node.js, TypeScript,
      and Next.js.</li>
      <li>Implementing business logic and front-end to back-end integration using
      GraphQL and REST APIs.</li>
      <li>Collaborating with designers and other developers to translate business
      requirements into technical features.</li>
      <li>Utilizing AWS Lambda, SQS, CloudWatch, and S3 to build serverless architectures
      and ensure scalability and availability.</li>
      <li>Managing PostgreSQL and Redis databases for efficient data storage and
      retrieval.</li>
      <li>Actively contributing to all stages of the software development lifecycle,
      from planning to delivery and maintenance.</li>
      <li>Using GitLab and JIRA for source code management, team collaboration, and
      issue tracking.</li>
      <li>Continuous learning and improvement of technical skills, staying updated
      with the latest industry practices and technologies.</li>
      <h3>Frontend Developer</h3>
      <li>Development of responsive and intuitive user interfaces using React.js,
      Material- UI, and Bootstrap.</li>
      <li>Implementation of application logic and state management using
      Redux.js.</li>
      <li>Writing clean, efficient, and modular code in JavaScript, HTML5, and CSS
      to ensure desired functionality and appearance.</li>
      <li>Collaborating with designers and other developers to translate business
      requirements into high-quality software products.</li>
      <li>Troubleshooting and optimizing front-end application performance.</li>
      <li>Integrating external libraries and plugins, such as JQuery, to enhance
      functionality and user experience.</li>
      <li>Adhering to web development standards and best practices to ensure code
      scalability and maintainability.</li>
      <li>Actively participating in code reviews and unit testing to ensure software
      quality and stability.</li>
      <li>Continuous learning and improvement of technical skills, staying updated
      with trends and advancements in the web development industry.</li>
    </ul>`,
  },
  {
    id: 6,
    date: formatDateRange("2020-09", "2021-03"),
    duration: calculateDuration("2020-09", "2021-03"),
    company: "Art Seven",
    icon: faDesktopAlt,
    title: "Jr. Frontend Developer",
    description: `
    <ul>
      <li>Engage in in-depth discussions and thorough analysis of new customer
      requirements, strategically crafting websites with a strong focus on
      conversion optimization. Meticulously enhance SEO strategies while
      ensuring impeccable responsiveness and optimal site performance.
      Adapt websites according to evolving customer needs.</li>
      <li>Embark on a journey into framework languages and libraries like React
      and JQuery, gaining valuable insights into their application and
      potential.</li>
      <li>Cultivate a proficient understanding of PHP and Node.JS,
      encompassing their distinct back-end architectures. Develop expertise
      in MYSQL, delving into its intricacies for efficient database
      management.</li>
      <li>Take on a pivotal role in constructing diverse online platforms,
      including websites, captivating landing pages, and dynamic online.</li>
      <li>Working with HTML/CSS, Javascript, PHP, MYSQL, Wordpress, Nodejs,
      React.</li>
    </ul>
    `,
  },
  {
    id: 7,
    date: formatDateRange("2018-04", "2020-04"),
    duration: calculateDuration("2018-04", "2020-04"),
    company: "Ingenico",
    icon: faMobileRetro,
    title: "Intern Software Developer",
    description: `
    <ul>
    <li>Gained foundational experience in WEB infrastructure, including a
    comprehensive understanding of its key concepts, back-end and front-end
    structures, as well as databases and servers.</li>
    <li>Acquired introductory knowledge of programming languages such as JAVA,
    Android, C, and C++.</li>
    <li>Enhanced skills through hands-on project development, particularly within
    internal systems, involving the implementation of enhancements and
    maintenance of system components.</li>
    <li>Took charge of tailoring and customizing payment terminals to meet specific
    requirements.</li>
    <li>Demonstrated expertise in addressing customer needs through interface design,
    proficiently analyzing application logs, and serving as a pivotal troubleshooter.
    This role included the creation of development documentation for future
    reference.</li>
    </ul>
    `,
  },
  {
    id: 8,
    date: formatDateRange("2017-05", "2018-04"),
    duration: calculateDuration("2017-05", "2018-04"),
    company: "Ingenico",
    icon: faUsers,
    title: "Young HR Apprentice",
    description: `
    <ul>
      <li>Learning the Basics: Begin by grasping fundamental HR concepts such as
      recruitment, employee relations, training, and HR policies.</li>
      <li>Shadowing HR Professionals: Observe experienced HR practitioners to
      understand their roles and responsibilities in real-world scenarios.</li>
      <li>Assisting with Administrative Tasks: Help with paperwork, data entry,
      and scheduling interviews to understand the operational side of HR.</li>
      <li>Participating in Recruitment Processes: Assist in sourcing candidates,
      screening resumes, and coordinating interviews under the guidance of
      senior HR staff.</li>
      <li>Supporting Employee Onboarding: Aid in orientation programs, preparing
      materials, and ensuring new hires feel welcomed and informed about company
      policies.</li>
      <li>Learning HR Software and Systems: Gain proficiency in HRIS
      (Human Resources Information Systems) and other software used for payroll,
      attendance tracking, and performance management.</li>
      <li>Understanding Legal Compliance: Familiarize yourself with labor laws,
      regulations, and company policies to ensure HR practices align with legal
      requirements.</li>
      <li>Engaging in Training and Development Activities: Attend workshops,
      webinars, and seminars to enhance knowledge in areas like conflict
      resolution, diversity training, and leadership development.</li>
      <li>Assisting with Employee Relations: Handle basic inquiries, grievances,
      and conflicts, learning how to maintain a fair and supportive workplace
      environment.</li>
      <li>Observing HR Strategy Development: Observe strategic planning meetings
      and discussions to understand how HR aligns with broader organizational
      goals.</li>
      <li>Seeking Feedback and Mentorship: Regularly request feedback from mentors
      and supervisors to identify areas for improvement and personal growth.</li>
      <li>Building Professional Network: Attend industry events, join HR
      associations, and connect with professionals to expand your network and
      stay updated on industry trends.</li>
    </ul>`,
  },
];
