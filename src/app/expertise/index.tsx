// COMPONENTS
import Section from '@/src/components/Section';
import Reveal from '@/src/components/Reveal';
// CONTENT
import type {
  Expertise as ExpertiseContent,
  SectionHeader,
} from '@/src/content';
// CSS
import './styles.css';

interface ExpertiseProps {
  header: SectionHeader;
  expertise: ExpertiseContent;
}

// What Bruno does, by area, as a ledger: each line says what he does, with the
// technologies in passing, and where he has done it, so a claim always comes
// with the place to ask about it.
export default function Expertise({
  header,
  expertise,
}: Readonly<ExpertiseProps>) {
  return (
    <Section header={header} className="expertise">
      <Reveal className="ledger-wrap" amount={0.05}>
        <ul className="ledger">
          {expertise.areas.map((area) => (
            <li key={area.title} className="ledger__row">
              <h3 className="ledger__title">{area.title}</h3>
              <div className="ledger__body">
                <p className="ledger__text">{area.text}</p>
                {area.stack.length > 0 && (
                  <p className="ledger__stack">{area.stack.join(' · ')}</p>
                )}
              </div>
              <div className="ledger__side">
                {area.metric && (
                  <p className="ledger__metric">
                    <strong>{area.metric}</strong>
                    <span>{area.metricLabel}</span>
                  </p>
                )}
                <p className="ledger__where">
                  <span>{expertise.whereLabel}</span>
                  {area.where}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
