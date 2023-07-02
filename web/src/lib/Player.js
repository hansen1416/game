import * as THREE from "three";

export const STATE_ENUM = {
	0: "idle",
};

export const POSE_ENUM = {
	0: "rest",
};

export default class Player {
	/**
	 * @type {THREE.Mesh}
	 */
	mesh;
	/**
	 * @type {{[key: string]: THREE.Bone}}
	 */
	bones = {};
	/**
	 * @type {any}
	 */
	body;

	uuid = "";
	state = 0;
	pose = 0;
	/**
	 * @type {THREE.Vector3}
	 */
	#speed = new THREE.Vector3();

	#speed_scalar = 0.1;

	/**
	 *
	 * @param {THREE.Mesh} model
	 * @param {{x: number, y: number, z: number}} position
	 * @param {{x: number, y: number, z: number}} rotation
	 */
	constructor(
		model,
		position = { x: 0, y: 0, z: 0 },
		rotation = { x: 0, y: 0, z: 0 }
	) {
		model.position.set(position.x, position.y, position.z);
		model.rotation.set(rotation.x, rotation.y, rotation.z);

		model.traverse((node) => {
			// @ts-ignore
			if (node.isMesh) {
				node.castShadow = true;
			}
			// @ts-ignore
			if (node.isBone) {
				// @ts-ignore
				this.bones[node.name] = node;
			}
		});

		this.mesh = model;
		this.uuid = model.uuid;
	}

	get speed() {
		return this.#speed;
	}

	get speed_scalar() {
		return this.#speed_scalar;
	}

	/**
	 *
	 * @param {THREE.Vector3} vec
	 */
	initSpeed(vec) {
		this.#speed.copy(vec);
	}

	/**
	 *
	 * @param {THREE.Quaternion} quat
	 * @returns
	 */
	rotateHorizontalSpeed(quat) {
		const new_speed = this.#speed.clone().applyQuaternion(quat).normalize();

		// console.log(new_speed, new_speed.length())

		this.#speed.lerp(new_speed, 0.1);
	}

	/**
	 *
	 * @param {{x?: number, z?: number}} obj
	 */
	updateSpeed(obj) {
		if (obj.x !== undefined) {
			this.#speed.x = obj.x;
		}
		if (obj.z !== undefined) {
			this.#speed.z = obj.z;
		}
	}

	// /**
	//  *
	//  * @param {number} rad
	//  */
	// changeSpeedDirection(rad) {
	// 	if (rad < 0.1) {
	// 		return;
	// 	}

	// 	const cos_val = Math.cos(rad);
	// 	const sin_val = Math.sin(rad);

	// 	this.#speed.x = this.#speed.x * cos_val + this.#speed.z * sin_val;
	// 	this.#speed.z = -this.#speed.x * sin_val + this.#speed.z * cos_val;
	// }

	move() {
		this.mesh.position.add(
			this.#speed.normalize().multiplyScalar(this.#speed_scalar)
		);
	}
}
