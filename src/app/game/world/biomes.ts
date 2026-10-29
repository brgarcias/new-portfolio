import { sectionIds, type SectionId } from '@/src/content/sections';

// Each section of the site owns a sector of the world, a slice of the
// platform around its landing pad, dressed as a planet of the saga: its
// ground, its sky, its weather, its buildings, its plants and its animals.
// The hub in the middle, where the ships start, stays a deck in space. The
// planets' names are their own; everything built from them is ours.

export type Sector = SectionId | 'hub';

export interface Palette {
  // The sky overhead, at the horizon and below the platform.
  top: string;
  horizon: string;
  below: string;
  fog: string;
  density: number;
  // How bright the stars show, from 0 to 1.
  stars: number;
  // The light from the sky, the light from the ground and the sun.
  skyLight: string;
  groundLight: string;
  sun: string;
  sunIntensity: number;
}

export type Weather =
  'sand' | 'spores' | 'rain' | 'pollen' | 'fireflies' | 'snow';

export interface Biome {
  id: SectionId;
  planet: string;
  // The ground's two colors, mixed by a noise, and the accent of the
  // sector on the platform's edge and on the radar.
  ground: [string, string];
  accent: string;
  palette: Palette;
  weather?: Weather;
  weatherColor?: string;
}

export const hubRadius = 18;
export const sectorAngle = (Math.PI * 2) / sectionIds.length;

// The hub, and the space around the platform.
export const space: Palette = {
  top: '#07080f',
  horizon: '#1d1848',
  below: '#0b0c14',
  fog: '#0b0c14',
  density: 0.0032,
  stars: 1,
  skyLight: '#9c9eff',
  groundLight: '#171826',
  sun: '#fff2e0',
  sunIntensity: 1.9,
};

export const biomes: Record<SectionId, Biome> = {
  // Where the story starts: the desert, under two suns.
  about: {
    id: 'about',
    planet: 'Tatooine',
    ground: ['#d9b074', '#c08f58'],
    accent: '#f2b26a',
    weather: 'sand',
    weatherColor: '#f2d2a0',
    palette: {
      top: '#5a7ab8',
      horizon: '#f2b26a',
      below: '#b8803f',
      fog: '#e4ad78',
      density: 0.0034,
      stars: 0,
      skyLight: '#ffe3b8',
      groundLight: '#a06a3c',
      sun: '#fff0d0',
      sunIntensity: 2.1,
    },
  },
  // The career: the city that covers a planet, at night.
  experience: {
    id: 'experience',
    planet: 'Coruscant',
    ground: ['#23263b', '#2c3050'],
    accent: '#ff7a9c',
    palette: {
      top: '#05060e',
      horizon: '#3a2a5a',
      below: '#0b0c14',
      fog: '#151830',
      density: 0.0032,
      stars: 1,
      skyLight: '#5c5edc',
      groundLight: '#0f1020',
      sun: '#c7c9ff',
      sunIntensity: 1,
    },
  },
  // The schooling: the swamp where a master teaches.
  education: {
    id: 'education',
    planet: 'Dagobah',
    ground: ['#3a4a2c', '#2b3a22'],
    accent: '#7fcf8a',
    weather: 'spores',
    weatherColor: '#b6f0a8',
    palette: {
      top: '#0e1a14',
      horizon: '#3b5a3a',
      below: '#101810',
      fog: '#2b3d2a',
      density: 0.0062,
      stars: 0.15,
      skyLight: '#8fb08a',
      groundLight: '#1a2416',
      sun: '#cfe3b0',
      sunIntensity: 0.9,
    },
  },
  // The training: the ocean world of the cloning halls, in the rain.
  courses: {
    id: 'courses',
    planet: 'Kamino',
    ground: ['#1c3242', '#17293a'],
    accent: '#8fc5ff',
    weather: 'rain',
    weatherColor: '#bcd8ff',
    palette: {
      top: '#1a2230',
      horizon: '#4a5566',
      below: '#0e1218',
      fog: '#3a4553',
      density: 0.0045,
      stars: 0,
      skyLight: '#9fb0c8',
      groundLight: '#1c2430',
      sun: '#cdd6e6',
      sunIntensity: 1.2,
    },
  },
  // The things built: the green world of domes and waterfalls.
  projects: {
    id: 'projects',
    planet: 'Naboo',
    ground: ['#4f9a4a', '#3f7f3c'],
    accent: '#7ddc9a',
    weather: 'pollen',
    weatherColor: '#fff0f6',
    palette: {
      top: '#3f7fd6',
      horizon: '#bfe0ff',
      below: '#6f8fa8',
      fog: '#bcd6f2',
      density: 0.003,
      stars: 0,
      skyLight: '#dfefff',
      groundLight: '#4a7a3a',
      sun: '#fff8e8',
      sunIntensity: 2.2,
    },
  },
  // The community: the forest moon and its villages in the trees.
  contributing: {
    id: 'contributing',
    planet: 'Endor',
    ground: ['#2f5a2a', '#3a4a26'],
    accent: '#9ad36a',
    weather: 'fireflies',
    weatherColor: '#fff0a0',
    palette: {
      top: '#4a86c8',
      horizon: '#a8c6a0',
      below: '#2a3a2a',
      fog: '#6c8a66',
      density: 0.0038,
      stars: 0,
      skyLight: '#cfe6c8',
      groundLight: '#27401f',
      sun: '#ffefc8',
      sunIntensity: 1.8,
    },
  },
  // The call: the ice world of the hidden base and its transmitters.
  contact: {
    id: 'contact',
    planet: 'Hoth',
    ground: ['#eef4fa', '#cfe0ee'],
    accent: '#bfe3ff',
    weather: 'snow',
    weatherColor: '#ffffff',
    palette: {
      top: '#8fb3d9',
      horizon: '#e6eef7',
      below: '#9fb3c7',
      fog: '#dce6f0',
      density: 0.0042,
      stars: 0,
      skyLight: '#ffffff',
      groundLight: '#9fb4c9',
      sun: '#fff6ea',
      sunIntensity: 1.8,
    },
  },
};

// The angle of a sector's middle, where its pad lies: the first one is
// straight ahead of the spawn, at -Z.
export const angleOf = (id: SectionId) => sectionIds.indexOf(id) * sectorAngle;

export function sectorOfAngle(angle: number): SectionId {
  const count = sectionIds.length;
  const index = Math.round(angle / sectorAngle);
  return sectionIds[((index % count) + count) % count];
}

// The sector over a point of the platform, or the hub in the middle.
export function sectorAt(x: number, z: number): Sector {
  if (Math.hypot(x, z) < hubRadius) return 'hub';
  return sectorOfAngle(Math.atan2(x, -z));
}

export const paletteOf = (sector: Sector) =>
  sector === 'hub' ? space : biomes[sector].palette;

// The unit vector from the middle of the platform to the middle of a sector.
export const directionOf = (id: SectionId) => {
  const angle = angleOf(id);
  return { x: Math.sin(angle), z: -Math.cos(angle) };
};

// Where the ship is, for the sky and the lights to follow.
export const atmosphere = { sector: 'hub' as Sector };
