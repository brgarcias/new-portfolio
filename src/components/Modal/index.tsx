import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@nextui-org/react";

interface ModalProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title: string;
  subtitle: string;
  actionText: string;
  size:
    | "xs"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "2xl"
    | "3xl"
    | "4xl"
    | "5xl"
    | "full"
    | undefined;
  children: JSX.Element;
  actionForm: () => void;
  isHaveCloseButton?: boolean;
  actionButtonDisabled: boolean;
}

export default function ModalComponent({
  visible,
  setVisible,
  title,
  subtitle,
  actionText,
  children,
  size = "md",
  actionForm,
  isHaveCloseButton = false,
  actionButtonDisabled,
}: ModalProps) {
  const { onOpenChange } = useDisclosure();
  const closeHandler = () => setVisible(false);
  const actionButtonForm = () => actionForm();

  return (
    <>
      <Modal
        closeButton
        isDismissable
        backdrop="blur"
        aria-labelledby="modal-title"
        isOpen={visible}
        onClose={closeHandler}
        size={size}
        onOpenChange={onOpenChange}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <p
                  id="modal-title"
                  style={{ fontSize: 26, fontWeight: "semibold" }}
                >
                  {title}
                </p>
                <p id="modal-subtitle" style={{ fontSize: 14 }}>
                  {subtitle}
                </p>
              </ModalHeader>
              <ModalBody>{children}</ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  style={{ backgroundColor: "#5c5edc" }}
                  onPress={actionButtonForm}
                  disabled={actionButtonDisabled}
                >
                  {actionText}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
