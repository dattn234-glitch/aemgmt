import { useEffect, useRef, useState, type CSSProperties } from "react";

export function useReveal<T extends HTMLElement>(options?: { delay?: number }) {
  const ref = useRef<T | null>(null);
  const [revealed, setRevealed] = useState(false);
  const delay = options?.delay ?? 0;

  useEffect(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.16 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const style: CSSProperties | undefined = delay > 0 ? { transitionDelay: `${delay}ms` } : undefined;

  return {
    ref,
    style,
    className: revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
  };
}
