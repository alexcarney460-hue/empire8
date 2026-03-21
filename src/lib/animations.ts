'use client';

export const EASE = {
  smooth: [0.16, 1, 0.3, 1] as const,  // expo out
  snappy: [0.65, 0, 0.35, 1] as const,  // cubic
  bounce: [0.34, 1.56, 0.64, 1] as const,
};

// Standard reveal animation config for scroll-triggered elements
export const REVEAL_CONFIG = {
  y: 60,
  opacity: 0,
  duration: 1,
  ease: 'power3.out',
  stagger: 0.12,
};

// Counter animation for stats
export function animateCounter(element: HTMLElement, target: number, duration = 2) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / (duration * 1000), 1);
    // Ease out expo
    const eased = 1 - Math.pow(1 - progress, 4);
    const current = Math.round(start + (target - start) * eased);
    element.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
