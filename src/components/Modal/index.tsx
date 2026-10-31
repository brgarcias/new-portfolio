import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/react';
// I18N
import { useI18n } from '@/src/i18n/I18nProvider';
// MOTION
import { spring } from '@/src/components/spring';

// HeroUI's own motion, on springs like the iPhone's: on phones the dialog
// slides up, and on wider screens it grows a little into place (the
// --slide and --scale variables, from HeroUI and the base class below).
const motionProps = {
  variants: {
    enter: {
      scale: 'var(--scale-enter)',
      y: 'var(--slide-enter)',
      opacity: 1,
      willChange: 'auto',
      transition: {
        scale: { duration: 0.5, ease: spring },
        y: { duration: 0.55, ease: spring },
        opacity: { duration: 0.25, ease: 'easeOut' },
      },
    },
    exit: {
      scale: 'var(--scale-exit)',
      y: 'var(--slide-exit)',
      opacity: 0,
      willChange: 'transform',
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },
  },
} as const;

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
  const t = useI18n().messages.dialog;

  return (
    <Modal
      closeButton
      isDismissable
      backdrop="opaque"
      aria-labelledby="modal-title"
      isOpen={visible}
      onClose={() => setVisible(false)}
      size={size}
      scrollBehavior="inside"
      motionProps={motionProps}
      // Keeps the height limit NextUI used before HeroUI changed it to 8rem,
      // and has the dialog grow from 96% on wider screens.
      classNames={{ base: 'max-h-[calc(100%_-_7.5rem)] sm:[--scale-exit:96%]' }}
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
            {!hideCloseButton && (
              <ModalFooter>
                <button
                  type="button"
                  className="btn btn--ghost btn--small"
                  onClick={onClose}
                >
                  {t.close}
                </button>
              </ModalFooter>
            )}
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
