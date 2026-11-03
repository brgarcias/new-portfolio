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

// The About section: the story, short, and how Bruno works. It is also the
// first landing pad of the game.
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
        <Reveal className="about__approach" delay={0.12}>
          <h3 className="about__approach-title">{about.principlesTitle}</h3>
          <ul className="about__principles">
            {about.principles.map((principle) => (
              <li key={principle.title}>
                <h4>{principle.title}</h4>
                <p>{principle.text}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
