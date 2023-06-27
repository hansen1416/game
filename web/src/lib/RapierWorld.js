import * as THREE from "three";

let instance;

/**
 * @typedef {import('../../node_modules/@dimforge/rapier3d/pipeline/world').World} World
 * @typedef {import('../../node_modules/@dimforge/rapier3d/geometry/collider').ColliderDesc} ColliderDesc
 * @typedef {import('../../node_modules/@dimforge/rapier3d/dynamics/rigid_body').RigidBodyDesc} RigidBodyDesc
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
		/** @type {RigidBodyDesc} */
		this.RigidBodyDesc = RAPIER.RigidBodyDesc;
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
	 * @param {THREE.Vector3} origin
	 * @param {number} terrain_size
	 * @param {Float32Array} heights - The heights of the heightfield along its local `y` axis,
	 *                  provided as a matrix stored in column-major order.
	 */
	createTerrain(origin, terrain_size, heights) {
		// @ts-ignore
		const rbDesc = this.RigidBodyDesc.fixed().setTranslation(
			origin.x + terrain_size * 0.5,
			origin.y,
			origin.z + terrain_size * 0.5
		);
		const terrainBody = this.world.createRigidBody(rbDesc);

		// @ts-ignore
		const clDesc = this.ColliderDesc.heightfield(
			terrain_size,
			terrain_size,
			heights,
			new THREE.Vector3(terrain_size, 1, terrain_size)
		);
		this.world.createCollider(clDesc, terrainBody);
	}
}
