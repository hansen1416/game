import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GROUND_LEVEL, GROUND_WIDTH, GROUND_HEIGHT } from "../utils/constants";
import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";
import { poissonDiskSampling } from "../utils/poissonSampling";

/**
 * @typedef {{x: number, y: number, z: number}} vec3
 */

let instance;

export default class ItemsManager {
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

	/**
	 *
	 * @param {vec3} pos
	 * @param {{color: number}} prop
	 */
	addItem(pos, prop) {
		const mesh = new THREE.Mesh(
			new THREE.BoxGeometry(1, 0.8, 0.5),
			new THREE.MeshBasicMaterial({ color: prop.color })
		);

		mesh.position.set(pos.x, pos.y, pos.z);

		this.renderer.addItemMesh(mesh);

		this.physics.createRandomSample(mesh, pos);
	}

	spreadItems() {
		// const points = poissonDiskSampling(GROUND_WIDTH/10, GROUND_HEIGHT/10, 20, 30);

		// const y = GROUND_LEVEL + 2;

		// for (let p of points) {
		// 	// todo this approach isn't effective, must reuse the items
		// 	this.addItem(
		// 		{ x: p.x - 50, y: y, z: p.y - 50 },
		// 		{ color: 0xff0099 }
		// 	);
		// }

		this.addItem({ x: 2, y: 2, z: 2 }, { color: 0xff0099 });
	}
}
