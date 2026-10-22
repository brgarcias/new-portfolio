import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from '@heroui/react';

interface ModalProps {
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
}

export default function ModalComponent({
  visible,
  setVisible,
  title = '',
  subtitle = '',
  children,
  size = 'md',
  hideCloseButton = false,
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
            <ModalHeader className="flex flex-col gap-1">
              <p
                id="modal-title"
                style={{ fontSize: 26, fontWeight: 'semibold' }}
              >
                {title}
              </p>
              <p id="modal-subtitle" style={{ fontSize: 14 }}>
                {subtitle}
              </p>
            </ModalHeader>
            <ModalBody>{children}</ModalBody>
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
