import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import {
  faGithub,
  faLinkedin,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";

export const navItems = [
  { text: "About Me", href: "#about-me" },
  { text: "Professional Experience", href: "#professional-experience" },
  { text: "Academic Education", href: "#academic-education" },
  { text: "Courses & Certifications", href: "#courses" },
  { text: "Projects", href: "#projects" },
  { text: "Contributing", href: "#contributing" },
];

export const socialLinks = [
  { icon: faEnvelope, href: "mailto:bruno-151299@hotmail.com", text: "Email" },
  {
    icon: faLinkedin,
    href: "https://www.linkedin.com/in/bruno-garcia-9854b1161/",
    text: "LinkedIn",
  },
  {
    icon: faWhatsapp,
    href: "https://api.whatsapp.com/send?phone=5511996969301&text=Hello,%20Bruno!%20Really%20liked%20your%20portfolio.",
    text: "WhatsApp",
  },
  { icon: faGithub, href: "https://github.com/brgarcias", text: "GitHub" },
];
