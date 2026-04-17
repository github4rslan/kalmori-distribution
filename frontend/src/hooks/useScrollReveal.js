import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function useScrollReveal() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scan = () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const nodes = document.querySelectorAll('[data-reveal]:not(.reveal)');
      if (!nodes.length) return null;

      nodes.forEach((n) => {
        const variant = n.dataset.revealVariant;
        const delay = n.dataset.revealDelay;
        n.classList.add('reveal');
        if (variant && variant !== 'up') n.classList.add(`reveal-${variant}`);
        if (delay) n.classList.add(`delay-${delay}`);
      });

      if (prefersReduced || !('IntersectionObserver' in window)) {
        nodes.forEach((n) => n.classList.add('is-visible'));
        return null;
      }

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
      );
      nodes.forEach((n) => io.observe(n));
      return io;
    };

    const initial = scan();
    const raf = requestAnimationFrame(() => scan());

    return () => {
      cancelAnimationFrame(raf);
      if (initial) initial.disconnect();
    };
  }, [pathname]);
}
