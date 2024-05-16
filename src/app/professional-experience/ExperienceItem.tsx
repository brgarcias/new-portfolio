// FONT AWESOME
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface ExperienceItemProps {
  date: string;
  company: string;
  icon: IconProp;
  title: string;
  description: string;
}

export default function ExperienceItem({
  date,
  company,
  icon,
  title,
  description,
}: Readonly<ExperienceItemProps>) {
  return (
    <li>
      <time className="cbp_tmtime" dateTime={date}>
        <span>{date}</span> <span>{company}</span>
      </time>
      <div className={`cbp_tmicon cbp_tmicon`}>
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="cbp_tmlabel">
        <h2 className="heading">{title}</h2>
        <div className="description" dangerouslySetInnerHTML={{ __html: description }} />
      </div>
    </li>
  );
}
