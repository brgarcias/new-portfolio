"use client";

// NEXT
import Image from "next/image";
// HOOKS
import { useState } from "react";
// LODASH
import { isEmpty } from "lodash";
// FONTAWESOME
import {
  faCheck,
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
// IMAGES
import AboutMeImg from "@/public/images/about-me/about-me.png";
// COMPONENTS
import ModalComponent from "@/src/components/Modal";
import Form from "@/src/components/Form";
import SnackbarFeedback from "@/src/components/SnackBar";

export default function AboutMe() {
  const [visible, setVisible] = useState(false);
  const [fullNameValue, setFullNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [feedbackValue, setFeedbackValue] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState({
    open: false,
    title: "",
    description: "",
    icon: faCheck as IconProp,
    colorIcon: "",
  });
  const [errorsState, setErrorsState] = useState({
    fullName: false,
    email: false,
    feedback: false,
  });
  const validateField = (fieldName: string, value: any) => {
    setErrorsState((prevState) => ({
      ...prevState,
      [fieldName]: isEmpty(value),
    }));
  };
  const callValidateFields = (formDataParsed: Record<string, string>) => {
    Object.entries(errorsState).map((item) => {
      validateField(item[0], formDataParsed[item[0]]);
    });
  };

  const downloadZIP = async () => {
    try {
      const response = await fetch(
        "documents/cv/Bruno_Garcia_Resume.zip",
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
      a.download = "Bruno_Garcia_Resume.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading ZIP file", error);
    }
  };

  const submitForm = async (data: any) => {
    data.preventDefault();
    const formData = new FormData(data.target);
    const formDataParsed: Record<string, string> = {};

    formData.forEach(function (value, index) {
      formDataParsed[index] = value.toString();
    });

    const validateAndSubmit = async () => {
      try {
        const response = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(formDataParsed).toString(),
        });

        if (response.ok) {
          setOpenSnackbar({
            open: true,
            title: "Message Submitted",
            description: "Thank you very much for your feedback!",
            icon: faCheck,
            colorIcon: "#66bb6a",
          });
        } else {
          console.error("Error on sending forms: ", response);
          throw new Error("An error occurred while sending your message");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        setOpenSnackbar({
          open: true,
          title: "We had a problem",
          description: "An error occurred while sending your message!",
          icon: faCircleExclamation,
          colorIcon: "rgb(230, 154, 147)",
        });
      } finally {
        setSubmitting(false);
        setVisible(false);
      }
    };
    callValidateFields(formDataParsed);

    if (Object.values(formDataParsed).every((item) => !isEmpty(item))) {
      setSubmitting(true);
      validateAndSubmit();
    }
  };

  const openModalFeedback = () => setVisible(true);
  return (
    <div className="bp-header page" id="about-me">
      <SnackbarFeedback content={openSnackbar} setOpen={setOpenSnackbar} />
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
        hideCloseButton
        hideActionButton
      >
        <Form
          submitForm={submitForm}
          isSubmitting={isSubmitting}
          formData={{
            emailValue,
            feedbackValue,
            fullNameValue,
            setEmailValue,
            setFeedbackValue,
            setFullNameValue,
          }}
          validateField={validateField}
          onClose={() => setVisible(false)}
          actionButtonDisabled={isSubmitting}
          errorsState={errorsState}
        />
      </ModalComponent>
      <Image
        className="poster"
        src={AboutMeImg}
        alt="Bruno Garcia"
        unoptimized
        priority
      />



        <Form
          hidden
          submitForm={submitForm}
          isSubmitting={isSubmitting}
          formData={{
            emailValue,
            feedbackValue,
            fullNameValue,
            setEmailValue,
            setFeedbackValue,
            setFullNameValue,
          }}
          validateField={validateField}
          onClose={() => setVisible(false)}
          actionButtonDisabled={isSubmitting}
          errorsState={errorsState}
        />
    </div>
  );
}
