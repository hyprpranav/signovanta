import confetti from 'canvas-confetti';

/**
 * Fires colorful celebration party pops / confetti across the screen
 */
export function fireCelebrationConfetti(): void {
  try {
    const count = 200;
    const defaults = {
      origin: { y: 0.65 },
      zIndex: 9999,
    };

    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    };

    fire(0.25, {
      spread: 30,
      startVelocity: 60,
    });
    fire(0.2, {
      spread: 65,
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });
    fire(0.1, {
      spread: 130,
      startVelocity: 30,
      decay: 0.92,
      scalar: 1.2,
    });
    fire(0.1, {
      spread: 130,
      startVelocity: 50,
    });
  } catch (err) {
    console.warn('Confetti animation error:', err);
  }
}
