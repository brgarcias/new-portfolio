declare module "dynamics.js" {
  const dynamics: {
    animate: (...args: unknown[]) => void;
    css: (...args: unknown[]) => void;
    stop: (...args: unknown[]) => void;
    spring: unknown;
    bezier: unknown;
    easeInOut: unknown;
  };

  export default dynamics;
}
