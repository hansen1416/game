import * as THREE from "three";
import Deque from "../utils/Deque";
import Player from "./Player";
import PoseToRotation from "./PoseToRotation";
import { clamp, BlazePoseKeypointsValues } from "../utils/ropes";

let instance;

export default class PlayerMain extends Player {
	#hands_track = new Deque(10);

	/**
	 * @type {THREE.Vector3}
	 */
	shoulder_vector_mesh;

	// the angle threshold, to start rotation
	rotation_threshold = 0.1;
	// [0, 1] how sensitive the mesh's rotation react to player's rotation, higher is more sensitive
	rotation_sensitivity = 0.1;

	/**
	 * @type {THREE.Vector3[]}
	 */
	pose3d_mediapipe = Array.from({ length: 33 }, () => new THREE.Vector3());

	joints_map = BlazePoseKeypointsValues;

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

		if (angle > this.rotation_threshold) {
			this.mesh.applyQuaternion(
				new THREE.Quaternion().setFromAxisAngle(
					new THREE.Vector3(0, 1, 0),
					sign * angle * this.rotation_sensitivity // maybe convert it to a curve making the rotaion more smooth
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

	/**
	 *
	 * @param {{x:number, y:number, z:number}[]} pose3D
	 * @param {boolean} lower_body
	 */
	applyPoseToBone(pose3D, lower_body = false) {
		// multiply x,y by width/height factor
		for (let i = 0; i < pose3D.length; i++) {
			this.pose3d_mediapipe[i].x = pose3D[i].x;
			this.pose3d_mediapipe[i].y = pose3D[i].y;
			this.pose3d_mediapipe[i].z = pose3D[i].z;

			this.pose3d_mediapipe[i].applyQuaternion(this.mesh.quaternion);
		}

		const [abs_q, chest_q] = this.torsoRotation();

		this.bones.Hips.rotation.setFromQuaternion(abs_q);

		const chest_local = new THREE.Quaternion().multiplyQuaternions(
			abs_q.conjugate(),
			chest_q
		);

		this.bones.Spine2.rotation.setFromQuaternion(chest_local);

		this.rotateLimb(
			"LeftArm",
			"LeftShoulder",
			"LEFT_SHOULDER",
			"LEFT_ELBOW",
			new THREE.Euler(0, 0, 0),
			new THREE.Vector3(0, 1, 0)
		);

		this.rotateLimb(
			"LeftForeArm",
			"LeftArm",
			"LEFT_ELBOW",
			"LEFT_WRIST",
			new THREE.Euler(0, 0, 0),
			new THREE.Vector3(0, 1, 0)
		);

		this.rotateLimb(
			"RightArm",
			"RightShoulder",
			"RIGHT_SHOULDER",
			"RIGHT_ELBOW",
			new THREE.Euler(0, 0, 0),
			new THREE.Vector3(0, 1, 0)
		);

		this.rotateLimb(
			"RightForeArm",
			"RightArm",
			"RIGHT_ELBOW",
			"RIGHT_WRIST",
			new THREE.Euler(0, 0, 0),
			new THREE.Vector3(0, 1, 0)
		);

		if (lower_body) {
			this.rotateLimb(
				"LeftUpLeg",
				"Hips",
				"LEFT_HIP",
				"LEFT_KNEE",
				new THREE.Euler(0, 0, -3.14),
				new THREE.Vector3(0, -1, 0)
			);

			this.rotateLimb(
				"LeftLeg",
				"LeftUpLeg",
				"LEFT_HIP",
				"LEFT_ANKLE",
				new THREE.Euler(0, 0, 0),
				new THREE.Vector3(0, 1, 0)
			);

			this.rotateLimb(
				"LeftFoot",
				"LeftLeg",
				"LEFT_ANKLE",
				"LEFT_FOOT_INDEX",
				new THREE.Euler(1.035, 0, 0),
				new THREE.Vector3(0, 0, 1)
			);

			this.rotateLimb(
				"RightUpLeg",
				"Hips",
				"RIGHT_HIP",
				"RIGHT_KNEE",
				new THREE.Euler(0, 0, 3.14),
				new THREE.Vector3(0, -1, 0)
			);

			this.rotateLimb(
				"RightLeg",
				"RightUpLeg",
				"RIGHT_KNEE",
				"RIGHT_ANKLE",
				new THREE.Euler(0, 0, 0),
				new THREE.Vector3(0, 1, 0)
			);

			this.rotateLimb(
				"RightFoot",
				"RightLeg",
				"RIGHT_ANKLE",
				"RIGHT_FOOT_INDEX",
				new THREE.Euler(1.035, 0, 0),
				new THREE.Vector3(0, 0, 1)
			);
		}
	}

	/**
	 *
	 * @param {string} bone_name
	 * @param {string} parent_bone_name
	 * @param {string} start_joint_name
	 * @param {string} end_joint_name
	 * @param {THREE.Euler} init_euler
	 * @param {THREE.Vector3} up_vector
	 */
	rotateLimb(
		bone_name,
		parent_bone_name,
		start_joint_name,
		end_joint_name,
		init_euler,
		up_vector
	) {
		// if (
		// 	(this.pose3D[this.joints_map[start_joint_name]] &&
		// 		this.pose3D[this.joints_map[start_joint_name]]
		// 			.visibility < 0.5) ||
		// 	(this.pose3D[this.joints_map[end_joint_name]] &&
		// 		this.pose3D[this.joints_map[end_joint_name]]
		// 			.visibility < 0.5)
		// ) {
		// 	return;
		// }

		const start_joint =
			this.pose3d_mediapipe[this.joints_map[start_joint_name]];
		const end_joint =
			this.pose3d_mediapipe[this.joints_map[end_joint_name]];

		const world_target_vector = new THREE.Vector3(
			end_joint.x - start_joint.x,
			end_joint.y - start_joint.y,
			end_joint.z - start_joint.z
		).normalize();

		const world_quaternion = new THREE.Quaternion();

		this.bones[parent_bone_name].getWorldQuaternion(world_quaternion);

		// after apply the parent quaternion,
		// `world_target_vector` actually became the local target vector
		world_target_vector.applyQuaternion(world_quaternion.conjugate());

		// store the local vectors for all bones, used for gesture classification
		// this.local_vectors[bone_name] = world_target_vector.clone();

		// all the bones rest pose in the model is (0,1,0)
		// first place the limb to the human body nature position
		const init_quaternion = new THREE.Quaternion().setFromEuler(init_euler);

		// this is the real human body rotation,
		let local_quaternion_bio = new THREE.Quaternion().setFromUnitVectors(
			up_vector,
			world_target_vector
		);

		/*
			Notice that rotating by `a` and then by `b` is equivalent to 
			performing a single rotation by the quaternion product `ba`. 
			This is a key observation.
			*/
		const local_quaternion_bone =
			new THREE.Quaternion().multiplyQuaternions(
				local_quaternion_bio,
				init_quaternion
			);

		// const angle = local_quaternion_bone.angleTo(new THREE.Quaternion());

		// const axis = new THREE.Vector3(
		// 	local_quaternion_bone.x,
		// 	local_quaternion_bone.y,
		// 	local_quaternion_bone.z
		// );

		// const local_quaternion_round = new THREE.Quaternion().setFromAxisAngle(
		// 	axis,
		// 	parseFloat(angle.toFixed(2)) // this will cause the left arm unable to hang down
		// );

		this.bones[bone_name].rotation.setFromQuaternion(
			local_quaternion_bone.normalize()
		);
	}

	/**
	 *
	 * @param {THREE.Vector3} left_shoulder
	 * @param {THREE.Vector3} right_shoulder
	 * @param {THREE.Vector3} core
	 * @returns {THREE.Quaternion}
	 */
	getChestQuaternion(left_shoulder, right_shoulder, core) {
		// origin basis of chest
		// const xaxis0 = new THREE.Vector3(1, 0, 0);
		// const yaxis0 = new THREE.Vector3(0, -1, 0);
		// const zaxis0 = new THREE.Vector3(0, 0, 1);

		// new basis of chest from pose data
		const xaxis = new THREE.Vector3()
			.subVectors(left_shoulder, right_shoulder)
			.normalize();

		const y_tmp = new THREE.Vector3()
			.subVectors(left_shoulder, core)
			.normalize();

		const zaxis = new THREE.Vector3()
			.crossVectors(xaxis, y_tmp)
			.normalize();

		const yaxis = new THREE.Vector3()
			.crossVectors(xaxis, zaxis)
			.normalize();

		/**
		 * transfer object from basis0 to basis1
		 */
		const m0 = new THREE.Matrix4().makeBasis(
			new THREE.Vector3(1, 0, 0),
			new THREE.Vector3(0, -1, 0),
			new THREE.Vector3(0, 0, 1)
		);

		m0.makeRotationFromQuaternion(this.mesh.quaternion);

		const m1 = new THREE.Matrix4().makeBasis(xaxis, yaxis, zaxis);

		const m = m1.multiply(m0.invert());

		return new THREE.Quaternion().setFromRotationMatrix(m);
	}

	/**
	 *
	 * @param {THREE.Vector3} left_hip
	 * @param {THREE.Vector3} right_hip
	 * @param {THREE.Vector3} core
	 * @returns {THREE.Quaternion}
	 */
	getAbsQuaternion(left_hip, right_hip, core) {
		// new basis of abdominal from pose data
		const xaxis = new THREE.Vector3()
			.subVectors(left_hip, right_hip)
			.normalize();

		const y_tmp = new THREE.Vector3()
			.subVectors(core, left_hip)
			.normalize();

		const zaxis = new THREE.Vector3()
			.crossVectors(xaxis, y_tmp)
			.normalize();

		const yaxis = new THREE.Vector3()
			.crossVectors(zaxis, xaxis)
			.normalize();

		/**
		 * transfer origin basis of abdominal to target basis
		 */
		const m0 = new THREE.Matrix4().makeBasis(
			new THREE.Vector3(1, 0, 0),
			new THREE.Vector3(0, 1, 0),
			new THREE.Vector3(0, 0, 1)
		);

		m0.makeRotationFromQuaternion(this.mesh.quaternion);

		const m1 = new THREE.Matrix4().makeBasis(xaxis, yaxis, zaxis);

		const m = m1.multiply(m0.invert());

		return new THREE.Quaternion().setFromRotationMatrix(m);
	}

	torsoRotation() {
		/**
			Now you want matrix B that maps from 1st set of coords to 2nd set:
			A2 = B * A1
			This is now a very complex math problem that requires advanced skills to arrive at the solution:
			B = A2 * inverse of A1
		*/

		// if (
		// 	(left_shoulder2.visibility && left_shoulder2.visibility < 0.5) ||
		// 	(right_shoulder2.visibility && right_shoulder2.visibility < 0.5) ||
		// 	(left_hip2.visibility && left_hip2.visibility < 0.5) ||
		// 	(right_hip2.visibility && right_hip2.visibility < 0.5)
		// ) {
		// 	return [new THREE.Quaternion(), new THREE.Quaternion()];
		// }

		const left_oblique = new THREE.Vector3()
			.addVectors(
				this.pose3d_mediapipe[this.joints_map["LEFT_SHOULDER"]],
				this.pose3d_mediapipe[this.joints_map["LEFT_HIP"]]
			)
			.multiplyScalar(0.5);
		const right_oblique = new THREE.Vector3()
			.addVectors(
				this.pose3d_mediapipe[this.joints_map["RIGHT_SHOULDER"]],
				this.pose3d_mediapipe[this.joints_map["RIGHT_HIP"]]
			)
			.multiplyScalar(0.5);
		const core = new THREE.Vector3()
			.addVectors(left_oblique, right_oblique)
			.multiplyScalar(0.5);

		const chest_q = this.getChestQuaternion(
			this.pose3d_mediapipe[this.joints_map["LEFT_SHOULDER"]],
			this.pose3d_mediapipe[this.joints_map["RIGHT_SHOULDER"]],
			core
		);

		const abs_q = this.getAbsQuaternion(
			this.pose3d_mediapipe[this.joints_map["LEFT_HIP"]],
			this.pose3d_mediapipe[this.joints_map["RIGHT_HIP"]],
			core
		);

		return [abs_q, chest_q];
	}
}
