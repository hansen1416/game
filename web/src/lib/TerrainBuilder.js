import * as THREE from "three";
import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";
import { TerrainShape } from "./TerrainShape";
import { GROUND_LEVEL } from "../utils/constants";

let instance;

export default class TerrainBuilder {
	/**
	 * @type {THREE.Mesh[]}
	 */
	terrains = [];

	/**
	 *
	 * @param {ThreeScene} renderer
	 * @param {RapierWorld} physics
	 */
	constructor(renderer, physics) {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.renderer = renderer;
		this.physics = physics;
	}

	terrain() {
		for (let y = -32; y < 32; y += 16) {
			for (let x = -32; x < 32; x += 16) {
				// const terrain = new TerrainShape(new Vector3(x, 0, y));
				// terrain.addToScene(this.scene);
				// this.terrain.push(terrain);
				// this.pool.add(terrain);
				new TerrainShape(
					this.renderer,
					this.physics,
					new THREE.Vector3(x, GROUND_LEVEL, y)
				);
			}
		}

		return this;
	}
}


// import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

// function rampFunction(u, v, pos) {
// 	const alpha = 2 * Math.PI * u,
// 		r = v < 0.5 ? 2 : 3;

// 	if (v < 0.1 || v > 0.9) pos.y = 0;
// 	else
// 		pos.y =
// 			0.5 +
// 			0.3 * Math.sin(2 * alpha) +
// 			0.1 * Math.cos(3 * alpha) +
// 			0.1 * Math.cos(9 * alpha);

// 	pos.x = r * Math.cos(alpha);
// 	pos.z = r * Math.sin(alpha);
// }

// function generateTerrain() {
// 	// control how smooth is the geometry
// 	const N = 100;

// 	const geometry = new ParametricGeometry(rampFunction, N, 5);
// 	geometry.computeVertexNormals();

// 	const ramp = new THREE.Mesh(
// 		geometry,
// 		new THREE.MeshLambertMaterial({
// 			color: "Aquamarine",
// 			side: THREE.DoubleSide,
// 		})
// 	);
// 	this.scene.add(ramp);
// }
