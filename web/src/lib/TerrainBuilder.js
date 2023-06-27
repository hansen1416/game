import * as THREE from "three";
import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";
import { TerrainShape } from "./TerrainShape";

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
				const terrain = new TerrainShape(
					this.renderer,
					this.physics,
					new THREE.Vector3(x, 0, y)
				);
			}
		}

		return this;
	}
}
