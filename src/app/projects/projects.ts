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
    titleSpan: "Soluções Integradas",
    title: "CSS",
    image: iPhoneImg,
    previewImage: CssPreviewImg,
    insideImage: CssSolucoesImg,
    insideTitle: "CSS - Soluções Integradas",
    insideSubtitle: "Serviços especializados para terminais",
    description: "Primeiro site que realizei sozinho e do zero...",
    websiteLink: "http://csssolucoes.com.br/",
  },
  {
    contentId: "content-2",
    titleSpan: "Organização Contábil",
    title: "Sensei",
    image: iPadImg,
    previewImage: SenseiPreviewImg,
    insideImage: SenseiContabilImg,
    insideTitle: "Sensei Organização Contábil",
    insideSubtitle: "Empresa de contabilidade",
    description: "Primeira vez que implemento um site responsivo...",
    websiteLink: "https://www.senseicontabil.com.br/",
  },
  {
    contentId: "content-3",
    titleSpan: "Reparo de Smartphone",
    title: "Reparofone",
    image: MacbookImg,
    previewImage: ReparofonePreviewImg,
    insideImage: ReparofoneImg,
    insideTitle: "Reparofone",
    insideSubtitle: "Reparofone de Smartphones",
    description: "Primeira página feita 100% em React e primeira atuação...",
    websiteLink: "https://reparofone.com.br/novaordem",
  },
  {
    contentId: "content-4",
    titleSpan: "Venda de sucatas",
    title: "Saldofone",
    image: iMacImg,
    previewImage: SaldofonePreviewImg,
    insideImage: SaldofonePreviewImg,
    insideTitle: "Saldofone",
    insideSubtitle: "Venda de sucatas",
    description: "Com mais experiência em atuação Full-Stack...",
    websiteLink: "http://www.saldofone.com.br/",
  },
  {
    contentId: "content-5",
    titleSpan: "Recrutamento e seleção",
    title: "Malka RH",
    image: AppleWatchImg,
    previewImage: MalkaPreviewImg,
    insideImage: MalkaImg,
    insideTitle: "Malka RH",
    insideSubtitle: "Recrutamento e seleção",
    description: "Nesse site fiz meu primeiro modal. Coloquei dentro dele...",
    websiteLink: "http://malkarh.com.br/lp/recrutamento-e-selecao/",
  },
];
