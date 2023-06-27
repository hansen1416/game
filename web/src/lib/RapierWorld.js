let instance;

/**
 * @typedef {import('../../node_modules/@dimforge/rapier3d/pipeline/world').World} World
 */

export default class RapierWorld {
	/**
	 *
	 * @param {module} RAPIER
	 */
	constructor(RAPIER) {
		// make it a singleton, so we only have 1 threejs scene
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

        const gravity = { x: 0.0, y: -9.81, z: 0.0 };
        /** @type {World} */
        this.world = new RAPIER.World(gravity);
	}

    onFrameUpdate() {
		this.world.step();

		// for (let i in this.rigid) {
		// 	this.mesh[i].position.copy(this.rigid[i].position);
		// 	this.mesh[i].quaternion.copy(this.rigid[i].quaternion);
		// }
	}
}
