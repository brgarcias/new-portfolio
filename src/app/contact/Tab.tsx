// FONT AWESOME
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// FONTS
import { Roboto_Condensed } from "next/font/google";

interface TabProps {
  id: string;
  icon: IconProp;
  title: string;
  subtitle: string;
  extraInfo: string[];
}

const robotoCondensed = Roboto_Condensed({
  weight: "400",
  subsets: ["latin"],
});

export default function Tab({
  id,
  icon,
  title,
  subtitle,
  extraInfo,
}: TabProps) {
  return (
    <>
      <input id={id} name="buttons" type="radio" />
      <label htmlFor={id}>
        <div className="app_inner__tab">
          <h2 className={robotoCondensed.className}>
            <FontAwesomeIcon icon={icon} /> {title}
          </h2>
          <div className="tab_left">
            <FontAwesomeIcon className="icon-top" icon={icon} />
            <div className="tab_left__image">
              <FontAwesomeIcon icon={icon} />
            </div>
          </div>
          <div className="tab_right">
            <h3 className={robotoCondensed.className}>{subtitle}</h3>
            {extraInfo.map((info, index) => (
              <p key={index} className={robotoCondensed.className}>
                {info}
              </p>
            ))}
          </div>
        </div>
      </label>
    </>
  );
}