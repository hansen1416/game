import * as THREE from "three";
import Deque from "../utils/Deque";
import Player from "./Player";
import PoseToRotation from "./PoseToRotation";

let instance;

// const INIT_SPEED_SCALAR = 0.1;

export default class PlayerMain extends Player {
	#hands_track = new Deque(10);

	#shoulder_track = new Deque(10);

	/**
	 * @type {THREE.Vector3}
	 */
	shoulder_vector_mesh;

	// [0, 1] how sensitive the mesh's rotation react to player's rotation, higher is more sensitive
	rotation_sensitivity = 0.1;

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
		// this.initSpeed(new THREE.Vector3(0, 0, 1));
	}

	/**
	 * the `shoulder_vec_pose` is from data captured by mediapipe pose landmark
	 * when there is a left/right angle,
	 * and the `angle` is gt a threshold
	 * keep turning the speed direction
	 *
	 * @param {THREE.Vector3} shoulder_vec_pose
	 */
	rotate(shoulder_vec_pose) {
		const angle = shoulder_vec_pose.angleTo(new THREE.Vector3(-1, 0, 0));

		const sign = shoulder_vec_pose.z > 0 ? 1 : -1;

		const angle_threshold = 0.1;

		if (angle > angle_threshold) {
			this.mesh.applyQuaternion(
				new THREE.Quaternion().setFromAxisAngle(
					new THREE.Vector3(0, 1, 0),
					sign * angle * this.rotation_sensitivity
				)
			);
		}
	}

	/**
	 * shoulder mesh rotation control the camera direction and speed direction
	 * update it on each frame
	 */
	updateShoulderVectorMesh() {
		// return this.#shoulder_track.peekBack();
		const left_shoulder_pos = new THREE.Vector3();
		const right_shoulder_pos = new THREE.Vector3();

		this.bones.LeftShoulder.getWorldPosition(left_shoulder_pos);
		this.bones.RightShoulder.getWorldPosition(right_shoulder_pos);

		this.shoulder_vector_mesh = new THREE.Vector3().subVectors(
			right_shoulder_pos,
			left_shoulder_pos
		);
	}

	/**
	 * movement direction is always same as the direction the mesh facing
	 * the velocity is controlled by `speed_scalar`
	 */
	move() {
		this.updateSpeed({
			x: this.shoulder_vector_mesh.z,
			z: -this.shoulder_vector_mesh.x,
		});

		this.mesh.position.add(
			this.speed.normalize().multiplyScalar(this.speed_scalar)
		);
	}

	/**
	 * the camera direction
	 * @returns {THREE.Vector3}
	 */
	getCameraDirection() {
		return new THREE.Vector3(
			-this.shoulder_vector_mesh.z,
			0,
			this.shoulder_vector_mesh.x
		).normalize();
	}
}
