import { useEffect } from 'react';

let lockCount = 0;
let scrollY = 0;
let previousBodyStyles = {};
let previousHtmlStyles = {};

export default function useBodyScrollLock(isOpen) {
  useEffect(() => {
    if (!isOpen) return;

    if (lockCount === 0) {
      scrollY = window.scrollY || window.pageYOffset || 0;
      previousBodyStyles = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        right: document.body.style.right,
        width: document.body.style.width,
        touchAction: document.body.style.touchAction,
        overscrollBehavior: document.body.style.overscrollBehavior,
      };
      previousHtmlStyles = {
        overflow: document.documentElement.style.overflow,
        overscrollBehavior: document.documentElement.style.overscrollBehavior,
      };

      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.overscrollBehavior = 'none';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      document.body.style.touchAction = 'none';
      document.body.style.overscrollBehavior = 'none';
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(lockCount - 1, 0);
      if (lockCount > 0) return;

      Object.assign(document.body.style, previousBodyStyles);
      Object.assign(document.documentElement.style, previousHtmlStyles);
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);
}
