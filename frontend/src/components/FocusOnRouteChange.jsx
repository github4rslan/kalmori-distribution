import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function FocusOnRouteChange() {
  const { pathname } = useLocation();

  useEffect(() => {
    const main = document.querySelector('main');
    if (main) main.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
