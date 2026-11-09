import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function meshBox(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  material: THREE.Material,
  rounded = 0,
): THREE.Mesh {
  const geometry = rounded > 0
    ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, Math.min(rounded, ...size.map((v) => v * 0.22)))
    : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function meshCylinder(
  parent: THREE.Object3D,
  radii: [number, number],
  height: number,
  position: [number, number, number],
  material: THREE.Material,
  segments = 10,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radii[0], radii[1], height, segments), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function rodBetween(
  parent: THREE.Object3D,
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  material: THREE.Material,
  segments = 8,
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(b, a);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), segments), material);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cable(
  parent: THREE.Object3D,
  points: THREE.Vector3[],
  radius: number,
  material: THREE.Material,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, radius, 5, false), material);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function plane(
  parent: THREE.Object3D,
  width: number,
  height: number,
  position: [number, number, number],
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(...position);
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function gableRoof(
  parent: THREE.Object3D,
  width: number,
  depth: number,
  height: number,
  y: number,
  material: THREE.Material,
): THREE.Mesh {
  const w = width / 2, d = depth / 2;
  const vertices = new Float32Array([
    -w, 0, -d, w, 0, -d, 0, height, -d,
    -w, 0, d, 0, height, d, w, 0, d,
    -w, 0, -d, 0, height, -d, -w, 0, d,
    -w, 0, d, 0, height, -d, 0, height, d,
    w, 0, -d, w, 0, d, 0, height, -d,
    w, 0, d, 0, height, d, 0, height, -d,
    -w, 0, -d, -w, 0, d, w, 0, -d,
    -w, 0, d, w, 0, d, w, 0, -d,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/** Merge static meshes by material while keeping animated subtrees untouched. */
export function optimizeStatic(root: THREE.Group): void {
  root.updateMatrixWorld(true);
  const buckets = new Map<string, { material: THREE.Material; geometries: THREE.BufferGeometry[]; meshes: THREE.Mesh[]; cast: boolean; receive: boolean }>();
  const collect = (object: THREE.Object3D, dynamicAncestor = false) => {
    const dynamic = dynamicAncestor || object.userData.dynamic === true;
    if (object instanceof THREE.Mesh && !dynamic && !Array.isArray(object.material) && !(object instanceof THREE.InstancedMesh)) {
      const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { material: object.material, geometries: [], meshes: [], cast: object.castShadow, receive: object.receiveShadow };
        buckets.set(key, bucket);
      }
      const clone = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      clone.applyMatrix4(object.matrixWorld);
      // Merging requires an identical attribute layout.
      for (const name of Object.keys(clone.attributes)) {
        if (name !== "position" && name !== "normal" && name !== "uv") clone.deleteAttribute(name);
      }
      if (!clone.attributes.normal) clone.computeVertexNormals();
      if (!clone.attributes.uv) clone.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(clone.attributes.position.count * 2), 2));
      bucket.geometries.push(clone);
      bucket.meshes.push(object);
    }
    for (const child of object.children) collect(child, dynamic);
  };
  collect(root);
  for (const bucket of buckets.values()) {
    if (bucket.geometries.length < 2) {
      bucket.geometries.forEach((g) => g.dispose());
      continue;
    }
    const merged = mergeGeometries(bucket.geometries, false);
    bucket.geometries.forEach((g) => g.dispose());
    if (!merged) continue;
    for (const mesh of bucket.meshes) mesh.removeFromParent();
    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.castShadow = bucket.cast;
    mesh.receiveShadow = bucket.receive;
    mesh.frustumCulled = true;
    root.add(mesh);
  }
}
