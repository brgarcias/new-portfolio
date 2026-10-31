// The elements over the canvas that the frame loop writes to, as the ship
// flies, so nothing renders through React every frame: the HUD gets the
// ship's position, heading and speed as data attributes, the labels of the
// pads move over their pads, and the instruments (the compass, the radar,
// the chart when it is open, the readouts and the landing status) move
// and count. They register themselves here when they mount. What moves
// every frame moves by transforms on layers of its own, which the
// compositor moves without painting anything again.
export const overlay = {
  hud: null as HTMLElement | null,
  labels: null as HTMLElement | null,
  compassTape: null as HTMLElement | null,
  compassMarks: null as HTMLElement | null,
  compassReadout: null as HTMLElement | null,
  // Half the compass's window, in degrees, measured when it is laid out.
  compassHalf: 0,
  // The radar: its map, the mark of the way the flight started, the
  // chevrons on its ring, and its width in pixels, measured.
  radarMap: null as HTMLElement | null,
  radarNorth: null as HTMLElement | null,
  radarEdges: null as HTMLElement | null,
  radarSize: 0,
  chartShip: null as SVGGElement | null,
  chartCourse: null as SVGLineElement | null,
  // The chart's list of destinations, with their live distance and bearing.
  chartList: null as HTMLElement | null,
  speedBar: null as HTMLElement | null,
  landing: null as HTMLElement | null,
};
