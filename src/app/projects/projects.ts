// PRODUCT IMAGES
import iPhoneImg from "@/public/images/projects/iphone.png";
import iPadImg from "@/public/images/projects/ipad.png";
import MacbookImg from "@/public/images/projects/macbook.png";
import iMacImg from "@/public/images/projects/imac.png";
import AppleWatchImg from "@/public/images/projects/apple-watch.png";
// PREVIEW IMAGES
import CssPreviewImg from "@/public/images/projects/css-solucoes-preview.png";
import SenseiPreviewImg from "@/public/images/projects/sensei-contabil-preview.png";
import ReparofonePreviewImg from "@/public/images/projects/trocafone_reparos_preview.png";
import SaldofonePreviewImg from "@/public/images/projects/saldofone-dashboard-preview.png";
import MalkaPreviewImg from "@/public/images/projects/malka-preview.png";
// INSIDER IMAGES
import CssSolucoesImg from "@/public/images/projects/css-solucoes.png";
import SenseiContabilImg from "@/public/images/projects/sensei-contabil.png";
import ReparofoneImg from "@/public/images/projects/trocafone_reparos.png";
import MalkaImg from "@/public/images/projects/malka.png";

export const projects = [
  {
    contentId: "content-1",
    titleSpan: "Integrated Solutions",
    title: "CSS",
    image: iPhoneImg,
    previewImage: CssPreviewImg,
    imageWidth: "117px",
    heightWidth: "auto",
    insideImage: CssSolucoesImg,
    insideTitle: "CSS - Integrated Solutions",
    insideSubtitle: "Specialized services for terminals",
    description: `
      This was the first website I developed entirely on my own,
      starting from scratch. Since the company offers a wide range of services,
      I had to create multiple pages to accommodate all the information. The
      service names were quite lengthy, which challenged me to ensure that the
      design was responsive and that the layout of the menus (header, footer, and sidebar)
      was correct in all situations.
    `,
    websiteLink: "http://csssolucoes.com.br/",
  },
  {
    contentId: "content-2",
    titleSpan: "Accounting Organization",
    title: "Sensei",
    image: iPadImg,
    imageWidth: "152px",
    heightWidth: "auto",
    previewImage: SenseiPreviewImg,
    insideImage: SenseiContabilImg,
    insideTitle: "Sensei Accounting Organization",
    insideSubtitle: "Accounting firm",
    description: `
      This was my first time implementing a responsive website.
      During this occasion, I had to deal with several responsiveness
      issues, especially with the breadcrumb, where both the images
      and the text/title needed significant improvements. Additionally,
      it was also my first time creating a drop-down menu, which can
      be seen in the "Services" tab.
    `,
    websiteLink: "https://www.senseicontabil.com.br/",
  },
  {
    contentId: "content-3",
    titleSpan: "Smartphone Repair",
    title: "Reparofone",
    image: MacbookImg,
    imageWidth: "321px",
    heightWidth: "203px",
    previewImage: ReparofonePreviewImg,
    insideImage: ReparofoneImg,
    insideTitle: "Reparofone",
    insideSubtitle: "Smartphone Repair",
    description: `
      This was my first page developed entirely in
      React and my first experience working as a Full-Stack
      developer. On the frontend side, I used technologies
      and libraries associated with React, including Redux
      for application state management, Material UI for creating
      components and styling, and GraphQL for consuming APIs.
      For building the APIs and the backend structure, I used
      PHP with the Laravel framework and a MySQL database.
    `,
    websiteLink: "https://reparofone.com.br/novaordem",
  },
  {
    contentId: "content-4",
    titleSpan: "Sale of Scrap",
    title: "Saldofone",
    image: iMacImg,
    imageWidth: "321px",
    heightWidth: "auto",
    previewImage: SaldofonePreviewImg,
    insideImage: SaldofonePreviewImg,
    insideTitle: "Saldofone",
    insideSubtitle: "Sale of Scrap",
    description: `
      With more experience in Full-Stack development,
      this project was built using Node.js and NestJS
      for the backend, and ReactJS and NextJS for the
      frontend. It marked my first experience with the
      AWS cloud platform. I utilized various features,
      such as hosting the frontend in a serverless environment,
      building some microservices with Lambda, using SQS queues,
      reading logs in CloudWatch, establishing connections
      with the REDIS database, creating worker lambdas,
      and integrating with Nuvemshop to receive orders
      generated on the Saldofone e-commerce platform through
      a webhook. It was a remarkably successful project.
    `,
    websiteLink: "http://www.saldofone.com.br/",
  },
  {
    contentId: "content-5",
    titleSpan: "Recruitment and Selection",
    title: "Malka RH",
    imageWidth: "100px",
    heightWidth: "120px",
    image: AppleWatchImg,
    previewImage: MalkaPreviewImg,
    insideImage: MalkaImg,
    insideTitle: "Malka RH",
    insideSubtitle: "Recruitment and Selection",
    description: `
      On this website, I created my first modal.
      Inside it, I embedded an iframe that connected
      to a customer service page within the client's
      system. Given that the company operates in the
      field of recruitment and selection and provides
      rapid customer service, I had to implement a
      condition for the modal to appear only during
      specific hours (from 8 a.m. to 6 p.m. on weekdays),
      and I achieved this using JavaScript.
    `,
    websiteLink: "http://malkarh.com.br/lp/recrutamento-e-selecao/",
  },
];
