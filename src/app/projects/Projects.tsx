// NEXT
import Image from "next/image";
import { projects } from "./projects";

export default function renderProjects(data: typeof projects) {
  return data.map((project, index) => (
    <div className="slide" key={index} data-content={project.contentId}>
      <div className="slide__mover">
        <div className="zoomer flex-center">
          <Image
            className="zoomer__image"
            src={project.image}
            alt={project.title}
            unoptimized
          />
          <div className="preview">
            <Image
              src={project.previewImage}
              alt={project.title}
              unoptimized
              style={{ width: `${project.imageWidth}`, height: `${project.heightWidth}` }}
            />
            <div className="zoomer__area zoomer__area--size-2"></div>
          </div>
        </div>
      </div>
      <h2 className="slide__title">
        <span>{project.titleSpan}</span> {project.title}
      </h2>
    </div>
  ));
}
