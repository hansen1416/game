import * as THREE from "three";
import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";
// import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

const TERRAIN_SIZE = 16;
const TERRAIN_STRIDE = TERRAIN_SIZE + 1;

export class TerrainShape {
	heightMap = new Float32Array(TERRAIN_STRIDE ** 2);
	positionBuffer = new THREE.Float32BufferAttribute(
		TERRAIN_STRIDE ** 2 * 18,
		3
	);
	geometry = new THREE.BufferGeometry();
	material = new THREE.MeshStandardMaterial({
		color: new THREE.Color(0x448833),
	});
	mesh = new THREE.Mesh(this.geometry, this.material);

	/**
	 *
	 * @param {ThreeScene} renderer
	 * @param {RapierWorld} physics
	 * @param {THREE.Vector3} origin
	 */
	constructor(renderer, physics, origin) {
		this.renderer = renderer;
		this.physics = physics;
		this.origin = origin;

		this.mesh.position.copy(origin);
		this.mesh.matrixAutoUpdate = false;
		this.mesh.updateMatrix();
		this.mesh.receiveShadow = true;

		for (let y = 0; y < TERRAIN_STRIDE; y++) {
			for (let x = 0; x < TERRAIN_STRIDE; x++) {
				const index = hmIndex(x, y);
				let h = 0;

				// Cheesy multi-octave noise.
				for (let octave = 1; octave < 4; octave++) {
					const scale = 2 ** octave / 16;
					const xo = (x + origin.x) * scale;
					const yo = (y + origin.z) * scale;
					const xi = Math.floor(xo);
					const yi = Math.floor(yo);
					const xf = xo - xi;
					const yf = yo - yi;
					const h00 = noise3(xi, yi, octave);
					const h01 = noise3(xi, yi + 1, octave);
					const h10 = noise3(xi + 1, yi, octave);
					const h11 = noise3(xi + 1, yi + 1, octave);
					const h0 = h00 * (1 - xf) + h10 * xf;
					const h1 = h01 * (1 - xf) + h11 * xf;
					h += h0 * (1 - yf) + h1 * yf;
				}

				h = Math.max(h * 1.5 - 1.8, 0);
				this.heightMap[index] = h;
			}
		}

		this.genMesh();
		this.addPhysics();
	}

	dispose() {
		this.geometry.dispose();
		this.material.dispose();
		this.mesh.parent?.remove(this.mesh);
	}

	// addToScene(parent) {
	// 	parent.add(this.mesh);
	// }

	genMesh() {
		const position = [];
		const indices = [];

		const pushVertex = (x, y) => {
			position.push(x, this.heightMap[hmIndex(x, y)], y);
		};

		// For this demo, we want terrain contours to be clearly visible, so generate
		// separate triangles.
		for (let y = 0; y < TERRAIN_SIZE; y++) {
			for (let x = 0; x < TERRAIN_SIZE; x++) {
				const index = position.length / 3;
				pushVertex(x, y);
				pushVertex(x, y + 1);
				pushVertex(x + 1, y);
				pushVertex(x + 1, y);
				pushVertex(x, y + 1);
				pushVertex(x + 1, y + 1);
				indices.push(index, index + 1, index + 2);
				indices.push(index + 3, index + 4, index + 5);
			}
		}

		this.positionBuffer.copyArray(position);
		this.positionBuffer.needsUpdate = true;
		this.geometry.setAttribute("position", this.positionBuffer);
		this.geometry.setIndex(indices);

		// this.geometry = BufferGeometryUtils.mergeVertices(this.geometry);

		this.geometry.computeVertexNormals();

		this.renderer.scene.add(this.mesh);
	}

	addPhysics() {
		this.physics.createTerrain(this.origin, TERRAIN_SIZE, this.heightMap);
	}
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function hmIndex(x, y) {
	return x * TERRAIN_STRIDE + y;
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
function noise3(x, y, z) {
	return permute3(x, y, z) / 289.0;
}

/**
 *
 * @param {number} x
 * @returns {number}
 */
function permute(x) {
	return THREE.MathUtils.euclideanModulo((34.0 * x + 1.0) * x, 289.0);
}

/**
 *
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
function permute3(x, y, z) {
	return permute(x + permute(y + permute(z)));
}
