import * as THREE from 'three';

// The pieces the ships are built from: low-poly shapes with flat shading,
// in a few shared materials. Positions are x, y, z; a ship faces -Z, with
// its nose at the front and its engines at +Z.

type Vector = [number, number, number];

interface Finish {
  metalness?: number;
  roughness?: number;
  emissive?: string;
}

const materials = new Map<string, THREE.MeshStandardMaterial>();

// One material per color and finish, shared by every ship.
export function paint(color: string, finish: Finish = {}) {
  const key = JSON.stringify([color, finish]);
  let material = materials.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color,
      flatShading: true,
      metalness: finish.metalness ?? 0.1,
      roughness: finish.roughness ?? 0.75,
      emissive: finish.emissive ?? '#000000',
      emissiveIntensity: finish.emissive ? 2 : 0,
    });
    materials.set(key, material);
  }
  return material;
}

export const glass = (color = '#1b2440') =>
  paint(color, { metalness: 0.55, roughness: 0.2 });

export const chrome = paint('#d7dbe3', { metalness: 0.85, roughness: 0.3 });

function place(mesh: THREE.Mesh, at: Vector, rotation?: Vector) {
  mesh.position.set(...at);
  if (rotation) mesh.rotation.set(...rotation);
  return mesh;
}

export const box = (
  size: Vector,
  material: THREE.Material,
  at: Vector = [0, 0, 0],
  rotation?: Vector,
) =>
  place(new THREE.Mesh(new THREE.BoxGeometry(...size), material), at, rotation);

// A cylinder along Z, with the first radius at the front (-Z).
export const tube = (
  front: number,
  back: number,
  length: number,
  segments: number,
  material: THREE.Material,
  at: Vector = [0, 0, 0],
) => {
  const geometry = new THREE.CylinderGeometry(front, back, length, segments);
  geometry.rotateX(-Math.PI / 2);
  return place(new THREE.Mesh(geometry, material), at);
};

// A cylinder standing on Y.
export const post = (
  top: number,
  bottom: number,
  height: number,
  segments: number,
  material: THREE.Material,
  at: Vector = [0, 0, 0],
  rotation?: Vector,
) =>
  place(
    new THREE.Mesh(
      new THREE.CylinderGeometry(top, bottom, height, segments),
      material,
    ),
    at,
    rotation,
  );

// A cone pointing to -Z.
export const nose = (
  radius: number,
  length: number,
  segments: number,
  material: THREE.Material,
  at: Vector = [0, 0, 0],
) => tube(0.001, radius, length, segments, material, at);

export const ball = (
  radius: number,
  segments: number,
  material: THREE.Material,
  at: Vector = [0, 0, 0],
  scale: Vector = [1, 1, 1],
) => {
  const mesh = place(
    new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, segments),
      material,
    ),
    at,
  );
  mesh.scale.set(...scale);
  return mesh;
};

// A wedge, like a hull that widens towards the back: a four-sided tube
// turned so its flat sides face up and down, then flattened.
export const wedge = (
  front: number,
  back: number,
  length: number,
  width: number,
  height: number,
  material: THREE.Material,
  at: Vector = [0, 0, 0],
) => {
  const geometry = new THREE.CylinderGeometry(front, back, length, 4);
  geometry.rotateY(Math.PI / 4);
  geometry.rotateX(-Math.PI / 2);
  geometry.scale(width, height, 1);
  return place(new THREE.Mesh(geometry, material), at);
};

// The glowing mouth of an engine, at the back of the ship. Each one gets
// its own material, so a ship can brighten its engines as it accelerates.
export const engine = (
  radius: number,
  color: string,
  at: Vector,
  segments = 10,
) => {
  const mesh = tube(
    radius,
    radius,
    0.14,
    segments,
    paint(color, { emissive: color, roughness: 1, metalness: 0 }).clone(),
    at,
  );
  mesh.userData.engine = true;
  return mesh;
};

export function assemble(...parts: THREE.Object3D[]) {
  const group = new THREE.Group();
  group.add(...parts);
  return group;
}

// Two of the same part, at x and -x.
export const mirrored = (make: (x: number) => THREE.Object3D, x: number) => [
  make(x),
  make(-x),
];
