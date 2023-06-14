import * as THREE from "three";
import * as CANNON from "cannon-es";

export const STATE_ENUM = {
	0: "idle",
};

export const POSE_ENUM = {
	0: "rest",
};

export default class Player {
	/**
	 * @type {THREE.Object3D}
	 */
	mesh;
	/**
	 * @type {{[key: string]: THREE.Bone}}
	 */
	bones = {};
	/**
	 * @type {CANNON.Body}
	 */
	body;

	uuid = "";
	state = 0;
	pose = 0;
	/**
	 * @type {THREE.Vector3}
	 */
	speed;

	/**
	 *
	 * @param {THREE.Object3D} model
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
}
