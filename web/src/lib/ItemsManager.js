/**
 * @typedef {{x: number, y: number, z: number}} vec3
 */

import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";

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
	 */
	addItem(pos) {
		const mesh = this.renderer.createRandomSample(pos);

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

		this.addItem({ x: 3, y: -0.2, z: 8 });
	}
}
