// The spring of --ease-spring (globals.css), as an easing function for
// framer-motion: it goes 2% past the end and settles there. As the curve of
// an animation of fixed length, it ends exactly when a fade of the same
// length does, which a physical spring would not.
const damping = 0.78;
const frequency = 9;
const damped = frequency * Math.sqrt(1 - damping * damping);

export function spring(progress: number) {
  if (progress >= 1) return 1;
  const decay = Math.exp(-damping * frequency * progress);
  return (
    1 -
    decay *
      (Math.cos(damped * progress) +
        ((damping * frequency) / damped) * Math.sin(damped * progress))
  );
}
