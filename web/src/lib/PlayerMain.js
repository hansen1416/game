import * as THREE from "three";
import Deque from "../utils/Deque";
import Player from "./Player";
import PoseToRotation from "./PoseToRotation";

let instance;

export default class PlayerMain extends Player {
	#hands_track = new Deque(10);

	#shoulder_track = new Deque(10);

	/**
	 *
	 * @param {THREE.Object3D} model
	 * @param {{x: number, y: number, z: number}} position
	 * @param {{x: number, y: number, z: number}} rotation
	 */
	constructor(model, position, rotation) {
		super(model, position, rotation);

		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.pose2totation = new PoseToRotation(this.bones);
	}

	/**
	 * record motion history of the past 20 frames
	 */
	updateShoulderTrack() {
		const left_shoulder_pos = new THREE.Vector3();
		const right_shoulder_pos = new THREE.Vector3();

		this.bones.LeftShoulder.getWorldPosition(left_shoulder_pos);
		this.bones.RightShoulder.getWorldPosition(right_shoulder_pos);

		this.#shoulder_track.addBack(
			new THREE.Vector3().subVectors(
				right_shoulder_pos,
				left_shoulder_pos
			)
		);
	}

	currentShoulderVector() {
		return this.#shoulder_track.peekBack();
	}
}
