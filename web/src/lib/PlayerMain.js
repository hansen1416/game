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

	move() {
		const start_vec = this.#shoulder_track.peekFront()
		const end_vec = this.#shoulder_track.peekBack()

		if (!start_vec || !end_vec) {
			return
		}

		// there is always very small changes in the shoulder position
		// set a threshold so that if the change is smaller than it
		// we won't change speed direction
		const change_direction_threshold = 0.2;

		const velo = new THREE.Vector3().subVectors(end_vec.clone().normalize(), start_vec.clone().normalize())

		if (velo.length() > change_direction_threshold) {
			console.log(velo.length())
		}

		this.mesh.position.add(this.speed);
		
	}
}
