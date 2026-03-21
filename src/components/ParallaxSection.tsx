'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Props {
  children: React.ReactNode;
  bgImage?: string;
  bgColor?: string;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
  overlay?: boolean;
}

export default function ParallaxSection({
  children,
  bgImage,
  bgColor = '#0F0520',
  speed = 0.3,
  className,
  style,
  overlay = true,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !bgRef.current) return;

    gsap.to(bgRef.current, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, [speed]);

  return (
    <div
      ref={sectionRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: bgColor,
        ...style,
      }}
    >
      {bgImage && (
        <div
          ref={bgRef}
          style={{
            position: 'absolute',
            inset: '-20% 0',
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: 0,
          }}
        />
      )}
      {overlay && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(15,5,32,0.7) 0%, rgba(15,5,32,0.85) 100%)',
            zIndex: 1,
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}
