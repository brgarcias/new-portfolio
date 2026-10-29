// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
// CONTENT
import type { About as AboutContent, SectionHeader } from '@/src/content';
// CSS
import './styles.css';

interface AboutProps {
  header: SectionHeader;
  about: AboutContent;
}

// The About section: the text and the technologies. It follows the hero on
// the home page, and it is the first landing pad of the game.
export default function About({ header, about }: Readonly<AboutProps>) {
  return (
    <Section header={header} className="about">
      <div className="about__grid">
        <Reveal className="about__text">
          <p className="about__lead">{about.lead}</p>
          {about.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>
        <Reveal className="about__stack" delay={0.12}>
          <h3 className="about__stack-title">{about.stackTitle}</h3>
          <ul className="tag-list">
            {about.technologies.map((name) => (
              <li key={name} className="tag">
                {name}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
