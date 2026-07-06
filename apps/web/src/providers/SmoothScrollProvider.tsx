'use client';

import { ReactLenis, useLenis } from 'lenis/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect } from 'react';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenis = useLenis(({ scroll }) => {
    // Keep ScrollTrigger in sync with Lenis
    ScrollTrigger.update();
  });

  useEffect(() => {
    // Drive Lenis with GSAP's RAF for frame-perfect sync
    function onFrame(time: number) {
      lenis?.raf(time * 1000);
    }
    const unsubscribe = gsap.ticker.add(onFrame);
    
    // Prevent GSAP's frame-drop compensation from causing scroll jumps
    gsap.ticker.lagSmoothing(0);
    
    return () => {
      unsubscribe();
    };
  }, [lenis]);

  return (
    <ReactLenis root options={{ lerp: 0.08, autoRaf: false, duration: 1.2 }}>
      {children}
    </ReactLenis>
  );
}
