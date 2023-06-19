import * as THREE from "three";
import Deque from "../utils/Deque";
import Player from "./Player";
import PoseToRotation from "./PoseToRotation";

let instance;

const INIT_SPEED_SCALAR = 0.1;

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

		// give main player an initial value
		this.initSpeed(new THREE.Vector3(0, 0, INIT_SPEED_SCALAR));
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

	calculateSpeedDirection() {
		const start_vec = this.#shoulder_track.peekFront();
		const end_vec = this.#shoulder_track.peekBack();

		if (!start_vec || !end_vec) {
			return;
		}

		// there is always very small changes in the shoulder position
		// set a threshold so that if the change is smaller than it
		// we won't change speed direction
		const change_direction_threshold = 0.1;

		const velo = new THREE.Vector3().subVectors(
			end_vec.clone().normalize(),
			start_vec.clone().normalize()
		);

		// `velo.z` and `end_vec.z` both lt 0, it means the torse towards right and rotate to right
		// `velo.z` and `end_vec.z` both gt 0, it means the torse towards left and rotate to left
		// so `velo.z` and `end_vec.z` have the same sign, we do rotation

		const angle = end_vec.angleTo(new THREE.Vector3(-1, 0, 0))


		console.log(angle)

		// if (velo.length() > change_direction_threshold && velo.z * end_vec.z > 0) {
		if (velo.length() > change_direction_threshold && velo.z * end_vec.z > 0) {

			if (velo.z > 0 && end_vec.z > 0) {

				// const new_speed = this.rotateHorizontalSpeed(velo.length())

				// console.log(new_speed)


			} else if (velo.z < 0 && end_vec.z < 0) {

			}

			return

			// we also need to know if torse is turing to left/right or restore from left/right
			const speed_dir = new THREE.Vector3(end_vec.z, 0, -end_vec.x)
				.normalize()
				.multiplyScalar(INIT_SPEED_SCALAR);

			return speed_dir;
		} else {
			return;
		}
	}

	move() {
		const speed_dir = this.calculateSpeedDirection();

		if (speed_dir) {
			this.updateSpeed(speed_dir);
		}

		this.mesh.position.add(this.speed);
	}
}
