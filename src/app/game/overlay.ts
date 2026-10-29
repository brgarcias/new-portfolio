// The elements over the canvas that the frame loop writes to, as the ship
// flies: the HUD gets the ship's position, heading and speed as data
// attributes, and the labels of the pads are moved over their pads. They
// register themselves here when they mount.
export const overlay = {
  hud: null as HTMLElement | null,
  labels: null as HTMLElement | null,
};
