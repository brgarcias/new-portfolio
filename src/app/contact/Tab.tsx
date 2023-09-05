// FONT AWESOME
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// FONTS
import { Roboto_Condensed } from "next/font/google";

interface TabProps {
  id: string;
  icon: IconProp;
  iconTop: IconProp;
  title: string;
  subtitle: string;
  extraInfo: string[];
  checked: boolean;
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
  checked,
  iconTop,
}: TabProps) {
  return (
    <>
      <input id={id} name="buttons" type="radio" defaultChecked={checked} />
      <label htmlFor={id}>
        <div className="app_inner__tab">
          <h2 className={robotoCondensed.className}>
            <FontAwesomeIcon className="icon-shadow" icon={icon} /> {title}
          </h2>
          <div className="tab_left">
            <FontAwesomeIcon className="icon-top" icon={iconTop} />
            <div className="tab_left__image">
              <FontAwesomeIcon icon={iconTop} />
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
