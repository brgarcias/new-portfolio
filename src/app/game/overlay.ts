// The elements over the canvas that the frame loop writes to, as the ship
// flies: the HUD gets the ship's position, heading and speed as data
// attributes, the labels of the pads are moved over their pads, and the
// ship's marker is moved on the radar and on the map, when it is open.
// They register themselves here when they mount.
export const overlay = {
  hud: null as HTMLElement | null,
  labels: null as HTMLElement | null,
  radarShip: null as SVGGElement | null,
  mapShip: null as SVGGElement | null,
};
