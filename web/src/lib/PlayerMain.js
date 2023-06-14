import * as THREE from "three";
import Deque from "../utils/Deque";
import Player from "./Player";
import PoseToRotation from "./PoseToRotation";

let instance;

export default class PlayerMain extends Player {
	hands_track = new Deque();
	// lower `max_deque_length` faster speed
	max_deque_length = 20;

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
	motionCache() {}
}
