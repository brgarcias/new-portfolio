import { Input, Textarea } from "@nextui-org/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faUserAlt } from "@fortawesome/free-solid-svg-icons";

export default function Form() {
  return (
    <>
      <Input
        autoFocus
        endContent={<FontAwesomeIcon icon={faUserAlt} />}
        label="Full Name"
        placeholder="Let me know you"
        variant="bordered"
      />
      <Input
        endContent={<FontAwesomeIcon icon={faEnvelope} />}
        label="Email"
        placeholder="Enter your email"
        type="password"
        variant="bordered"
      />
      <Textarea
        label="Feedback"
        placeholder="Leave your feedback"
        type="password"
        variant="bordered"
        minRows={4}
      />
    </>
  );
}
