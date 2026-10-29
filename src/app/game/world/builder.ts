import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Collects low-poly shapes, each in a flat color, and merges them into one
// geometry with the colors on its vertices, so a whole sector of props
// draws in one call. Lit shapes, like windows and lamps, go to a second
// geometry, drawn without lighting.

export type Vec = [number, number, number];

const matrix = new THREE.Matrix4();
const position = new THREE.Vector3();
const quaternion = new THREE.Quaternion();
const euler = new THREE.Euler();
const scaling = new THREE.Vector3();
const tint = new THREE.Color();

export interface Built {
  solid: THREE.BufferGeometry | null;
  lit: THREE.BufferGeometry | null;
}

export class Builder {
  private solid: THREE.BufferGeometry[] = [];
  private lit: THREE.BufferGeometry[] = [];
  // Added to the height of every shape: the ground under what is built.
  lift = 0;

  add(
    geometry: THREE.BufferGeometry,
    color: string | THREE.Color,
    at: Vec,
    rotation: Vec = [0, 0, 0],
    scale: Vec | number = 1,
    lit = false,
  ) {
    const part = geometry.index ? geometry.toNonIndexed() : geometry;
    if (part !== geometry) geometry.dispose();
    part.deleteAttribute('uv');
    position.set(at[0], at[1] + this.lift, at[2]);
    // Yaw, pitch and roll: the roll and the pitch turn the shape on its
    // own axes, and the yaw turns it on the ground.
    quaternion.setFromEuler(
      euler.set(rotation[0], rotation[1], rotation[2], 'YXZ'),
    );
    if (typeof scale === 'number') scaling.setScalar(scale);
    else scaling.set(...scale);
    part.applyMatrix4(matrix.compose(position, quaternion, scaling));
    const count = part.attributes.position.count;
    const colors = new Float32Array(count * 3);
    tint.set(color);
    for (let i = 0; i < count; i++) {
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    part.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    (lit ? this.lit : this.solid).push(part);
    return this;
  }

  box(size: Vec, color: string, at: Vec, rotation?: Vec, lit?: boolean) {
    return this.add(
      new THREE.BoxGeometry(...size),
      color,
      at,
      rotation,
      1,
      lit,
    );
  }

  cylinder(
    top: number,
    bottom: number,
    height: number,
    segments: number,
    color: string,
    at: Vec,
    rotation?: Vec,
    lit?: boolean,
  ) {
    return this.add(
      new THREE.CylinderGeometry(top, bottom, height, segments),
      color,
      at,
      rotation,
      1,
      lit,
    );
  }

  cone(
    radius: number,
    height: number,
    segments: number,
    color: string,
    at: Vec,
    rotation?: Vec,
    lit?: boolean,
  ) {
    return this.cylinder(0, radius, height, segments, color, at, rotation, lit);
  }

  sphere(
    radius: number,
    segments: number,
    color: string,
    at: Vec,
    scale: Vec | number = 1,
    lit?: boolean,
  ) {
    return this.add(
      new THREE.SphereGeometry(radius, segments, Math.max(4, segments - 2)),
      color,
      at,
      undefined,
      scale,
      lit,
    );
  }

  rock(radius: number, color: string, at: Vec, rotation?: Vec, scale?: Vec) {
    return this.add(
      new THREE.DodecahedronGeometry(radius, 0),
      color,
      at,
      rotation,
      scale,
    );
  }

  ring(
    radius: number,
    tube: number,
    color: string,
    at: Vec,
    rotation?: Vec,
    lit?: boolean,
    arc = Math.PI * 2,
  ) {
    return this.add(
      new THREE.TorusGeometry(radius, tube, 5, 14, arc),
      color,
      at,
      rotation,
      1,
      lit,
    );
  }

  // Bakes a model built from meshes, like a ship, into the geometry, with
  // the colors of its materials.
  model(object: THREE.Object3D, at: Vec, rotation: Vec, scale = 1) {
    object.position.set(at[0], at[1] + this.lift, at[2]);
    object.rotation.set(...rotation);
    object.scale.setScalar(scale);
    object.updateMatrixWorld(true);
    object.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const material = child.material as THREE.MeshStandardMaterial;
      const part = child.geometry.clone() as THREE.BufferGeometry;
      part.applyMatrix4(child.matrixWorld);
      child.geometry.dispose();
      // The model is already in place: no lift twice.
      this.add(
        part,
        material.color,
        [0, -this.lift, 0],
        undefined,
        1,
        !!child.userData.engine,
      );
    });
    return this;
  }

  // Merges what was added; the parts are freed.
  build(): Built {
    const merge = (parts: THREE.BufferGeometry[]) => {
      if (!parts.length) return null;
      const merged = mergeGeometries(parts, false);
      for (const part of parts) part.dispose();
      return merged;
    };
    return { solid: merge(this.solid), lit: merge(this.lit) };
  }
}

export const solidMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  flatShading: true,
  roughness: 0.85,
  metalness: 0.05,
});

export const litMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
