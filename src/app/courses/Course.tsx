"use client";

// HOOKS
import { useState } from "react";
// MODAL
import ModalComponent from "@/src/components/Modal";
// DATA COURSES
import { courses } from "./courses";

export default function Course(data: (typeof courses)[0]) {
  const [visible, setVisible] = useState(false);
  const {
    id,
    title,
    subtitle,
    description,
    isLarger,
    descriptionTitle,
    descriptionSubtitle,
  } = data;

  return (
    <li
      className={`icon-clima-${id} ${isLarger}`}
      onClick={() => setVisible(true)}
    >
      <h3>{title}</h3>
      <span className="rb-temp">{subtitle}</span>
      <ModalComponent
        visible={visible}
        setVisible={setVisible}
        size="5xl"
        actionForm={() => null}
        actionButtonDisabled={false}
        hideActionButton={true}
      >
        <div className="rb-week">
          <p className="description-title">{descriptionTitle}</p>
          <p className="description-subtitle">{descriptionSubtitle}</p>
          {description.map((item, index) => (
            <div key={index} className="div-span-cursos">
              <span className="rb-city">{item.title}</span>
              <span className="desc-course">{item.description}</span>
            </div>
          ))}
        </div>
      </ModalComponent>
    </li>
  );
}
