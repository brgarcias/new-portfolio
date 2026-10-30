// The elements over the canvas that the frame loop writes to, as the ship
// flies, so nothing renders through React every frame: the HUD gets the
// ship's position, heading and speed as data attributes, the labels of the
// pads move over their pads, and the instruments (the compass, the radar,
// the chart when it is open, the readouts and the landing status) move
// and count. They register themselves here when they mount.
export const overlay = {
  hud: null as HTMLElement | null,
  labels: null as HTMLElement | null,
  compassTape: null as HTMLElement | null,
  compassMarks: null as HTMLElement | null,
  compassReadout: null as HTMLElement | null,
  // Half the compass's window, in degrees, measured when it is laid out.
  compassHalf: 0,
  radarWorld: null as SVGGElement | null,
  radarNorth: null as SVGGElement | null,
  radarEdges: null as SVGGElement | null,
  chartShip: null as SVGGElement | null,
  chartCourse: null as SVGLineElement | null,
  // The chart's list of destinations, with their live distance and bearing.
  chartList: null as HTMLElement | null,
  landing: null as HTMLElement | null,
};
