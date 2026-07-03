// src/hooks/useExitIntent.ts
// Hook de Exit Intent — OPT #4 CRO: Recuperación de abandono de carrito
import { useEffect, useRef } from 'react';

interface UseExitIntentOptions {
  onExitIntent: () => void;
  once?: boolean;
}

export function useExitIntent({ onExitIntent, once = true }: UseExitIntentOptions) {
  const triggered = useRef(false);

  useEffect(() => {
    const sessionKey = 'dante_exit_shown';
    if (once && sessionStorage.getItem(sessionKey)) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !triggered.current) {
        triggered.current = true;
        if (once) sessionStorage.setItem(sessionKey, '1');
        onExitIntent();
      }
    };

    // Mobile: detectar 75s de inactividad
    let idleTimer: ReturnType<typeof setTimeout>;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!triggered.current) {
          triggered.current = true;
          if (once) sessionStorage.setItem(sessionKey, '1');
          onExitIntent();
        }
      }, 75000);
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('touchstart', resetIdle);
    resetIdle();

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('touchstart', resetIdle);
      clearTimeout(idleTimer);
    };
  }, [onExitIntent, once]);
}
