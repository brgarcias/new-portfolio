import {
  faUserNinja,
  faUserTie,
  faEnvelopeOpenText,
  faUserAstronaut,
  faUserGraduate,
  faBalanceScale,
} from "@fortawesome/free-solid-svg-icons";
import { faAngellist, faMailchimp } from "@fortawesome/free-brands-svg-icons";

export const tabs = [
  {
    id: "tab-1",
    icon: faUserNinja,
    iconTop: faUserAstronaut,
    title: "Bruno Garcia da Silva",
    subtitle: "Full-Stack Developer",
    extraInfo: ["Single", "23 years"],
  },
  {
    id: "tab-2",
    icon: faUserTie,
    iconTop: faUserGraduate,
    title: "Computer Science",
    subtitle: "Universidade São Judas Tadeu - USJT",
    extraInfo: ["Concluded", "06/2018 - 06/2022"],
  },
  {
    id: "tab-3",
    icon: faEnvelopeOpenText,
    iconTop: faMailchimp,
    title: "bruno-151299@hotmail.com",
    subtitle: "+55 (11) 99696-9301",
    extraInfo: ["Vila Nova Mazzei - Tucuruvi", "São Paulo, SP - Brazil"],
  },
  {
    id: "tab-4",
    icon: faAngellist,
    iconTop: faBalanceScale,
    title: "Advanced English",
    subtitle: "English Course - Number One",
    extraInfo: ["Available for travel and relocation", "An exchange soon"],
  },
];
