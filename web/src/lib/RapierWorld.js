import * as THREE from "three";

let instance;

/**
 * @typedef {import('../../node_modules/@dimforge/rapier3d/pipeline/world').World} World
 * @typedef {import('../../node_modules/@dimforge/rapier3d/geometry/collider').ColliderDesc} ColliderDesc
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
		/** @type {ColliderDesc} */
		this.ColliderDesc = RAPIER.ColliderDesc;
	}

	onFrameUpdate() {
		this.world.step();

		// for (let i in this.rigid) {
		// 	this.mesh[i].position.copy(this.rigid[i].position);
		// 	this.mesh[i].quaternion.copy(this.rigid[i].quaternion);
		// }
	}

	/**
	 *
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	createRigidBodyFixed(x, y, z) {}

	/**
	 * Creates a new collider descriptor with a heightfield shape.
	 *
	 * @param {number} nrows − The number of rows in the heights matrix.
	 * @param {number} ncols - The number of columns in the heights matrix.
	 * @param {Array} heights - The heights of the heightfield along its local `y` axis,
	 *                  provided as a matrix stored in column-major order.
	 * @param {THREE.Vector3} scale - The scale factor applied to the heightfield.
	 */
	createColliderHeightfield(nrows, ncols, heights, scale, terrainBody) {
		const clDesc = this.ColliderDesc.heightfield(
			nrows,
			ncols,
			heights,
			new THREE.Vector3(nrows, 1, ncols)
		);
		this.world.createCollider(clDesc, terrainBody);
	}
}
