// CSS
import './styles.css';
// TAB COMPONENT
import Tab from './Tab';
// TABS DATA
import { getTabs } from './tabs';
// COMPONENTS
import Section from '@/src/components/Section';

export default function Contact() {
  return (
    <Section
      id="contact"
      description={
        <>
          My personal information, but if you prefer{' '}
          <a
            href="https://api.whatsapp.com/send?phone=5511996969301&text=Hello,%20Bruno!%20Really%20liked%20your%20portfolio."
            target="_blank"
            rel="noopener noreferrer"
          >
            text me
          </a>
          !
        </>
      }
      quote={{
        text: 'Facing suffering will undoubtedly contribute to the elevation of your spiritual practice, provided that you are able to transform calamity and misfortune into a path.',
        author: 'Dalai Lama',
      }}
    >
      {/* The card floats and sits partly outside its box, as in the old
          full-screen page, so the wrapper clears it and keeps the height. */}
      <div className="contact__body cf">
        <div className="left">
          <div className="app">
            <div className="app_inner">
              {getTabs().map((tab) => (
                <Tab key={tab.id} {...tab} checked={tab.id === 'tab-1'} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
