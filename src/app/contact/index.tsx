// CSS
import "./styles.css";
// TAB COMPONENT
import Tab from "./Tab";
// TABS DATA
import { tabs } from "./tabs";

export default function Contact() {
  return (
    <div className="page" id="contact">
      <header className="bp-header cf">
        <h1 className="bp-header__title">Contact</h1>
        <p className="bp-header__desc">
          My personal information, but if you prefer{" "}
          <a
            href="https://api.whatsapp.com/send?phone=5511996969301"
            target="_blank"
          >
            text me
          </a>
          !
        </p>
        <p className="info">
          &quot;Facing suffering will undoubtedly contribute to the elevation of
          your spiritual practice, provided that you are able to transform
          calamity and misfortune into a path.&quot; &mdash;
          <span className="blue">
            <em> Dalai Lama</em>
          </span>
        </p>
      </header>
      <div>
        <div className="left">
          <div className="app">
            <div className="app_inner">
              {tabs.map((tab) => (
                <Tab key={tab.id} {...tab} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
