'use client';

// NEXT
import dynamic from 'next/dynamic';
// HOOKS
import { useEffect, useState } from 'react';
// TYPES
import type { ModalProps } from '.';
// UTILS
import { whenIdle } from './whenIdle';

// HeroUI's dialog, with react-aria and the animation code behind it, is the
// largest part of the page's JavaScript and only matters once a dialog
// opens. It loads while the browser is idle after the page, or as soon as a
// dialog opens, if that comes first.
const loadModal = () => import('.');
const Modal = dynamic(loadModal, { ssr: false });

export default function LazyModal(props: Readonly<ModalProps>) {
  const [needed, setNeeded] = useState(props.visible);
  if (props.visible && !needed) setNeeded(true);

  useEffect(() => whenIdle(() => void loadModal()), []);

  return needed ? <Modal {...props} /> : null;
}
