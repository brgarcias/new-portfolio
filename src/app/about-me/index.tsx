"use client";
import Image from "next/image";
import { useState } from "react";
// IMAGES
import AboutMeImg from "@/public/images/about-me/about-me.png";
// COMPONENTS
import ModalComponent from "@/src/components/Modal";
import Form from "@/src/components/Form";

export default function AboutMe() {
  const [visible, setVisible] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const downloadZIP = async () => {
    try {
      const response = await fetch(
        "public/documents/cv/Bruno_Garcia_Resume.zip",
        {
          method: "GET",
          headers: {
            "Content-Type": "blob",
          },
        }
      ).then((response) => response.blob());

      const blob = new Blob([response], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Bruno_Resume.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading ZIP file", error);
    }
  };

  const submitForm = async () => {
    // const formFieldsValidated = validateFormFields(formData);
    // setCanSendFormData((prevState) => ({
    //   ...prevState,
    //   ...formFieldsValidated,
    // }));
    // if (Object.values(formFieldsValidated).every((value) => value === false)) {
    //   setSubmitting(true);
    // }
    // await sendForm(formData)
    //   .then((r) => {
    //     if (r.status <= 300) {
    //       setSnackbarData({
    //         message: f('SnackBarSuccess'),
    //         severity: 'success',
    //         variant: 'filled',
    //         duration: 3000,
    //       });
    //       setOpenSnackbar(true);
    //       setVisible(false);
    //       setSubmitting(false);
    //       return;
    //     }
    //     setSnackbarData({
    //       message: f('SnackBarError'),
    //       severity: 'error',
    //       variant: 'filled',
    //       duration: 3000,
    //     });
    //     setOpen(true);
    //     setVisible(true);
    //     setSubmitting(false);
    //   })
    //   .catch((error) => {
    //     if (error?.name === 'FormValidationError' && error?.status === 500) {
    //       setVisible(true);
    //       setSubmitting(false);
    //       return;
    //     }
    //     setSnackbarData({
    //       message: f('SnackBarError'),
    //       severity: 'error',
    //       variant: 'filled',
    //       duration: 3000,
    //     });
    //     setOpen(true);
    //     setVisible(true);
    //     setSubmitting(false);
    //   });
  };

  const openModalFeedback = () => setVisible(true);
  return (
    <div className="bp-header page" id="about-me">
      <header className="cf">
        <span className="bp-header__present">
          Bruno Garcia
          <span
            className="bp-tooltip bp-icon bp-icon--about"
            data-content="Passionate about development, eager for new experiences and constantly seeking fresh challenges"
          />
        </span>

        <h1 className="bp-header__title">Full-Stack Developer</h1>

        <p className="bp-header__desc">
          Experienced and dedicated Full Stack Developer with a proven track
          record spanning several years, showcasing expertise in programming,
          project coordination, and management. Proficient in orchestrating
          end-to-end planning, guiding clients from initial concepts to
          successful execution, and overseeing all phases of advanced
          development. Highly skilled in UI design, meticulous testing, and
          effective debugging protocols. Demonstrated ability to handle multiple
          projects concurrently with exceptional attention to detail. Adept at
          nurturing strong relationships with both clients and team members,
          prioritizing their satisfaction and project success above all else.
        </p>

        <p className="bp-header__desc">
          Possessing a versatile skill set that encompasses a wide array of
          technologies, including PHP (CodeIgniter/Laravel), GraphQL/REST API,
          ReactJS/NextJS, NodeJS/NestJS, Python, and databases like
          MySQL/PostgreSQL. Additionally, well-versed in utilizing essential
          tools such as Jira, Jenkins, and AWS. Equally proficient in both
          autonomous project management and collaborative teamwork environments.
        </p>

        <nav className="bp-nav">
          <a
            className="bp-nav__item bp-icon bp-icon--drop open-options"
            style={{ transition: "0.5s", cursor: "pointer" }}
            onClick={openModalFeedback}
            data-info="Leave Feedback"
          >
            <span> Leave Feedback</span>
          </a>
          <a
            className="bp-nav__item bp-icon bp-icon--archive"
            style={{ transition: "0.5s", cursor: "pointer" }}
            onClick={downloadZIP}
            data-info="Download CV"
          >
            <span>Download CV</span>
          </a>
        </nav>
      </header>
      <ModalComponent
        title="Welcome!"
        subtitle="Please share your thoughts and feedback to help me improve my portfolio."
        actionText="Send"
        visible={visible}
        setVisible={setVisible}
        size="md"
        actionForm={submitForm}
        actionButtonDisabled={isSubmitting}
      >
        <Form />
      </ModalComponent>
      <Image
        className="poster"
        src={AboutMeImg}
        alt="Bruno Garcia"
        unoptimized
        priority
      />
    </div>
  );
}
