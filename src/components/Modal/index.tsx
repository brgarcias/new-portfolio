import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from '@heroui/react';

export interface ModalProps {
  visible: boolean;
  setVisible: React.Dispatch<React.SetStateAction<boolean>>;
  title?: string;
  subtitle?: string;
  size?:
    | 'xs'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | 'full'
    | undefined;
  children: React.ReactNode;
  hideCloseButton?: boolean;
  // For content with nothing to focus: the body then takes focus itself, so
  // the keyboard can scroll it when it is taller than the dialog.
  focusableBody?: boolean;
}

export default function ModalComponent({
  visible,
  setVisible,
  title = '',
  subtitle = '',
  children,
  size = 'md',
  hideCloseButton = false,
  focusableBody = false,
}: Readonly<ModalProps>) {
  const { onOpenChange } = useDisclosure();
  const closeHandler = () => setVisible(false);

  return (
    <Modal
      closeButton
      isDismissable
      backdrop="blur"
      aria-labelledby="modal-title"
      isOpen={visible}
      onClose={closeHandler}
      size={size}
      onOpenChange={onOpenChange}
      scrollBehavior="inside"
      // Keeps the height limit NextUI used before HeroUI changed it to 8rem.
      classNames={{ base: 'max-h-[calc(100%_-_7.5rem)]' }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* HeroUI names the dialog after this header. */}
            <ModalHeader className="flex flex-col gap-1">
              {title && (
                <h2 id="modal-title" className="modal-title">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p id="modal-subtitle" className="modal-subtitle">
                  {subtitle}
                </p>
              )}
            </ModalHeader>
            <ModalBody
              className={focusableBody ? 'modal-body--focusable' : undefined}
              tabIndex={focusableBody ? 0 : undefined}
            >
              {children}
            </ModalBody>
            <ModalFooter
              style={{
                display: hideCloseButton ? 'none' : 'flex',
              }}
            >
              <Button
                style={{
                  display: hideCloseButton ? 'none' : 'block',
                }}
                color="default"
                variant="light"
                onPress={onClose}
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
