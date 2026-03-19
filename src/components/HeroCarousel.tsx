"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const SLIDES = [
  { src: "/hero-1.jpg", alt: "Cannabis cultivation facility" },
  { src: "/hero-2.jpg", alt: "Premium cannabis plants" },
  { src: "/hero-3.jpg", alt: "Cannabis garden" },
  { src: "/hero-4.jpg", alt: "Indoor cannabis grow" },
];

const INTERVAL = 5000;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  const next = useCallback(() => {
    setActive((prev) => (prev + 1) % SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, INTERVAL);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#0F0520",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.src}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: i === active ? 1 : 0,
            transition: "opacity 1.2s ease-in-out",
          }}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            width={1200}
            height={675}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "100%",
              objectFit: "contain",
            }}
            priority={i === 0}
          />
        </div>
      ))}

      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(15,5,32,0.08) 0%, transparent 30%, transparent 70%, rgba(15,5,32,0.15) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Slide indicators */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 8,
          zIndex: 2,
        }}
      >
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === active ? 28 : 8,
              height: 8,
              borderRadius: 99,
              border: "none",
              backgroundColor: i === active ? "#C8A23C" : "rgba(255,255,255,0.3)",
              cursor: "pointer",
              transition: "all 0.4s ease",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
