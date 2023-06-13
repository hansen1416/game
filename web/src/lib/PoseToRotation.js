import * as THREE from "three";
import { clamp, BlazePoseKeypointsValues, MDMJoints } from "../utils/ropes";

function quaternionFromBasis(xaxis0, yaxis0, zaxis0, xaxis1, yaxis1, zaxis1) {
	/**
	 * transfer object from basis0 to basis1
	 */
	const m0 = new THREE.Matrix4().makeBasis(xaxis0, yaxis0, zaxis0);
	const m1 = new THREE.Matrix4().makeBasis(xaxis1, yaxis1, zaxis1);

	const m = m1.multiply(m0.invert());

	return new THREE.Quaternion().setFromRotationMatrix(m);
}

function torsoRotation(left_shoulder2, right_shoulder2, left_hip2, right_hip2) {
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

	const left_oblique = new THREE.Vector3(
		(left_shoulder2.x + left_hip2.x) / 2,
		(left_shoulder2.y + left_hip2.y) / 2,
		(left_shoulder2.z + left_hip2.z) / 2
	);
	const right_oblique = new THREE.Vector3(
		(right_shoulder2.x + right_hip2.x) / 2,
		(right_shoulder2.y + right_hip2.y) / 2,
		(right_shoulder2.z + right_hip2.z) / 2
	);
	const center = new THREE.Vector3(
		(left_oblique.x + right_oblique.x) / 2,
		(left_oblique.y + right_oblique.y) / 2,
		(left_oblique.z + right_oblique.z) / 2
	);

	// origin basis of chest
	const xaxis0 = new THREE.Vector3(1, 0, 0);
	const yaxis0 = new THREE.Vector3(0, -1, 0);
	const zaxis0 = new THREE.Vector3(0, 0, 1);

	// new basis of chest from pose data
	const xaxis1 = new THREE.Vector3(
		left_shoulder2.x - right_shoulder2.x,
		left_shoulder2.y - right_shoulder2.y,
		left_shoulder2.z - right_shoulder2.z
	).normalize();

	const y_tmp1 = new THREE.Vector3(
		left_shoulder2.x - center.x,
		left_shoulder2.y - center.y,
		left_shoulder2.z - center.z
	).normalize();

	const zaxis1 = new THREE.Vector3().crossVectors(xaxis1, y_tmp1).normalize();

	const yaxis1 = new THREE.Vector3().crossVectors(xaxis1, zaxis1).normalize();

	const chest_q = quaternionFromBasis(
		xaxis0,
		yaxis0,
		zaxis0,
		xaxis1,
		yaxis1,
		zaxis1
	);

	// origin basis of abdominal
	const xaxis2 = new THREE.Vector3(1, 0, 0);
	const yaxis2 = new THREE.Vector3(0, 1, 0);
	const zaxis2 = new THREE.Vector3(0, 0, 1);

	// new basis of abdominal from pose data
	const xaxis3 = new THREE.Vector3(
		left_hip2.x - right_hip2.x,
		left_hip2.y - right_hip2.y,
		left_hip2.z - right_hip2.z
	).normalize();

	const y_tmp3 = new THREE.Vector3(
		center.x - left_hip2.x,
		center.y - left_hip2.y,
		center.z - left_hip2.z
	).normalize();

	const zaxis3 = new THREE.Vector3().crossVectors(xaxis3, y_tmp3).normalize();

	const yaxis3 = new THREE.Vector3().crossVectors(zaxis3, xaxis3).normalize();

	// console.log(xaxis3, yaxis3, zaxis3);

	const abs_q = quaternionFromBasis(
		xaxis2,
		yaxis2,
		zaxis2,
		xaxis3,
		yaxis3,
		zaxis3
	);

	return [abs_q, chest_q];
}

// 	/**
//      *
//      * bones keys
//      [
//         "Hips",
//         "Spine",
//         "Spine1",
//         "Spine2",
//         "Neck",
//         "Head",
//         "LeftShoulder",
//         "LeftArm",
//         "LeftForeArm",
//         "LeftHand",
//         "LeftHandThumb1",
//         "LeftHandThumb2",
//         "LeftHandThumb3",
//         "LeftHandIndex1",
//         "LeftHandIndex2",
//         "LeftHandIndex3",
//         "LeftHandMiddle1",
//         "LeftHandMiddle2",
//         "LeftHandMiddle3",
//         "LeftHandRing1",
//         "LeftHandRing2",
//         "LeftHandRing3",
//         "LeftHandPinky1",
//         "LeftHandPinky2",
//         "LeftHandPinky3",
//         "RightShoulder",
//         "RightArm",
//         "RightForeArm",
//         "RightHand",
//         "RightHandThumb1",
//         "RightHandThumb2",
//         "RightHandThumb3",
//         "RightHandIndex1",
//         "RightHandIndex2",
//         "RightHandIndex3",
//         "RightHandMiddle1",
//         "RightHandMiddle2",
//         "RightHandMiddle3",
//         "RightHandRing1",
//         "RightHandRing2",
//         "RightHandRing3",
//         "RightHandPinky1",
//         "RightHandPinky2",
//         "RightHandPinky3",
//         "LeftUpLeg",
//         "LeftLeg",
//         "LeftFoot",
//         "LeftToeBase",
//         "RightUpLeg",
//         "RightLeg",
//         "RightFoot",
//         "RightToeBase"
//     ]
//      */

export default class PoseToRotation {
	/**
	 *
	 * @param {{[key: string]: THREE.Bone}} bones
	 * @param {string} capture_type
	 */
	constructor(bones, capture_type = "mediapipe") {
		this.bones = bones;
		// this.local_vectors = {};

		if (capture_type === "mediapipe") {
			this.joints_map = BlazePoseKeypointsValues;
		} else if (capture_type === "mdm") {
			this.joints_map = MDMJoints;
		}
	}

	/**
	 *
	 * @param {Array} pose3D
	 * @param {boolean} lower_body
	 */
	applyPoseToBone(pose3D, lower_body = false) {
		this.pose3D = pose3D;

		const swap_left_right = false;

		const [abs_q, chest_q] = torsoRotation(
			swap_left_right
				? this.pose3D[this.joints_map["RIGHT_SHOULDER"]]
				: this.pose3D[this.joints_map["LEFT_SHOULDER"]],
			swap_left_right
				? this.pose3D[this.joints_map["LEFT_SHOULDER"]]
				: this.pose3D[this.joints_map["RIGHT_SHOULDER"]],
			swap_left_right
				? this.pose3D[this.joints_map["RIGHT_HIP"]]
				: this.pose3D[this.joints_map["LEFT_HIP"]],
			swap_left_right
				? this.pose3D[this.joints_map["LEFT_HIP"]]
				: this.pose3D[this.joints_map["RIGHT_HIP"]]
		);

		this.bones.Hips.rotation.setFromQuaternion(abs_q);

		const chest_local = new THREE.Quaternion().multiplyQuaternions(
			abs_q.conjugate(),
			chest_q
		);

		this.bones.Spine2.rotation.setFromQuaternion(chest_local);

		this.rotateLimb(
			"LeftArm",
			"LeftShoulder",
			swap_left_right ? "RIGHT_SHOULDER" : "LEFT_SHOULDER",
			swap_left_right ? "RIGHT_ELBOW" : "LEFT_ELBOW",
			new THREE.Euler(0, 0, 0),
			new THREE.Vector3(0, 1, 0),
			{
				x: [-1.6, 1.5],
				y: [-2, 1.5],
				z: [-0.6, 2.2],
			}
		);

		this.rotateLimb(
			"LeftForeArm",
			"LeftArm",
			swap_left_right ? "RIGHT_ELBOW" : "LEFT_ELBOW",
			swap_left_right ? "RIGHT_WRIST" : "LEFT_WRIST",
			new THREE.Euler(0, 0, 0),
			new THREE.Vector3(0, 1, 0)
			// {
			// 	x: [0, 0],
			// 	y: [0, 3.14],
			// 	z: [0, 2.53],
			// } // flexion is 0-145 degrees 2.53073, extension is 0-180 degrees.
			// not limit forearm for now, cause when big arm rotats,
			// the limited axis/value is changing, very complicated
		);

		this.rotateLimb(
			"RightArm",
			"RightShoulder",
			swap_left_right ? "LEFT_SHOULDER" : "RIGHT_SHOULDER",
			swap_left_right ? "LEFT_ELBOW" : "RIGHT_ELBOW",
			new THREE.Euler(0, 0, 0),
			new THREE.Vector3(0, 1, 0),
			{
				x: [-1.6, 1.5],
				y: [-1.5, 2],
				z: [-2.2, 0.6],
			}
		);

		this.rotateLimb(
			"RightForeArm",
			"RightArm",
			swap_left_right ? "LEFT_ELBOW" : "RIGHT_ELBOW",
			swap_left_right ? "LEFT_WRIST" : "RIGHT_WRIST",
			new THREE.Euler(0, 0, 0),
			new THREE.Vector3(0, 1, 0)
			// {
			// 	x: [0, 2.53],
			// 	y: [0, 3.14],
			// 	z: [-2.53, 0],
			// }
		);

		if (lower_body) {
			this.rotateLimb(
				"LeftUpLeg",
				"Hips",
				swap_left_right ? "RIGHT_HIP" : "LEFT_HIP",
				swap_left_right ? "RIGHT_KNEE" : "LEFT_KNEE",
				new THREE.Euler(0, 0, -3.14),
				new THREE.Vector3(0, -1, 0)
			);

			this.rotateLimb(
				"LeftLeg",
				"LeftUpLeg",
				swap_left_right ? "RIGHT_KNEE" : "LEFT_HIP",
				swap_left_right ? "RIGHT_ANKLE" : "LEFT_ANKLE",
				new THREE.Euler(0, 0, 0),
				new THREE.Vector3(0, 1, 0),
				{
					x: [-1.8, 0.6],
					y: [-1, 1],
					z: [-3.14, 3.14],
				}
			);

			this.rotateLimb(
				"LeftFoot",
				"LeftLeg",
				swap_left_right ? "RIGHT_ANKLE" : "LEFT_ANKLE",
				swap_left_right ? "RIGHT_FOOT_INDEX" : "LEFT_FOOT_INDEX",
				new THREE.Euler(1.035, 0, 0),
				new THREE.Vector3(0, 0, 1)
			);

			this.rotateLimb(
				"RightUpLeg",
				"Hips",
				swap_left_right ? "LEFT_HIP" : "RIGHT_HIP",
				swap_left_right ? "LEFT_KNEE" : "RIGHT_KNEE",
				new THREE.Euler(0, 0, 3.14),
				new THREE.Vector3(0, -1, 0),
				{
					x: [-1.8, 0.6],
					y: [-1, 1],
					z: [-3.14, 3.14],
				}
			);

			this.rotateLimb(
				"RightLeg",
				"RightUpLeg",
				swap_left_right ? "LEFT_KNEE" : "RIGHT_KNEE",
				swap_left_right ? "LEFT_ANKLE" : "RIGHT_ANKLE",
				new THREE.Euler(0, 0, 0),
				new THREE.Vector3(0, 1, 0)
			);

			this.rotateLimb(
				"RightFoot",
				"RightLeg",
				swap_left_right ? "LEFT_ANKLE" : "RIGHT_ANKLE",
				swap_left_right ? "LEFT_FOOT_INDEX" : "RIGHT_FOOT_INDEX",
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
	 * @param {object} angle_restrain 
	 */
	rotateLimb(
		bone_name,
		parent_bone_name,
		start_joint_name,
		end_joint_name,
		init_euler,
		up_vector,
		angle_restrain
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

		const start_joint = this.pose3D[this.joints_map[start_joint_name]];
		const end_joint = this.pose3D[this.joints_map[end_joint_name]];

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
		// todo, limit this rotation by human body restrain
		// todo, use matrix basis rotations to adjust the orientations
		let local_quaternion_bio = new THREE.Quaternion().setFromUnitVectors(
			up_vector,
			world_target_vector
		);

		if (angle_restrain) {
			const angles = new THREE.Euler().setFromQuaternion(
				local_quaternion_bio
			);

			angles.x = clamp(
				angles.x,
				angle_restrain.x[0],
				angle_restrain.x[1]
			);
			angles.y = clamp(
				angles.y,
				angle_restrain.y[0],
				angle_restrain.y[1]
			);
			angles.z = clamp(
				angles.z,
				angle_restrain.z[0],
				angle_restrain.z[1]
			);

			local_quaternion_bio = new THREE.Quaternion().setFromEuler(angles);
		}

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
	 * pose2D are [{x:0.5, y:0.5, z:-1}, ...]
	 *
	 * x in [0,1], 1 means reaching the right end of the video view port,
	 * to the left end in threejs world
	 *
	 * y in [0,1]. indicate the height of the model
	 *
	 * z not to be trusted
	 *
	 * @param {object} pose2D
	 * @param {number} movableWidth
	 * @returns
	 */
	applyPosition(pose2D, movableWidth) {
		if (!pose2D || !pose2D.length) {
			return;
		}

		// const left_shoulder =
		// 	pose2D[this.joints_map["RIGHT_SHOULDER"]];
		// const right_shoulder =
		// 	pose2D[this.joints_map["LEFT_SHOULDER"]];
		const left_hip = pose2D[this.joints_map["RIGHT_HIP"]];
		const right_hip = pose2D[this.joints_map["LEFT_HIP"]];

		// if (
		// 	left_shoulder.visibility < 0.5 ||
		// 	right_shoulder.visibility < 0.5 ||
		// 	left_hip.visibility < 0.5 ||
		// 	right_hip.visibility < 0.5
		// ) {
		// 	return;
		// }

		// use middle point of hips as model position
		// because we placed abdominal at (0,0,0)
		const pixel_pos = {
			x: (left_hip.x + right_hip.x) / 2,
			// y: (left_hip.y + right_hip.y) / 2,
		};

		// // 1 - x because left/right are swaped
		// let object_x =
		// 	(1 - pixel_pos.x / videoWidth) * movableWidth - movableWidth / 2;
		// // 1 - y because in threejs y axis is twowards top
		// let object_y =
		// 	(1 - pixel_pos.y / videoHeight) * visibleHeight - visibleHeight / 2;

		let object_x = pixel_pos.x * movableWidth - movableWidth / 2;

		if (object_x < -movableWidth / 2) {
			object_x = -movableWidth / 2;
		}

		if (object_x > movableWidth / 2) {
			object_x = movableWidth / 2;
		}
		/*
		let object_y = pixel_pos.y * visibleHeight - visibleHeight / 2;

		if (object_y < -visibleHeight / 2) {
			object_y = -visibleHeight / 2;
		}

		if (object_y > visibleHeight / 2) {
			object_y = visibleHeight / 2;
		}
*/
		// this.body.position.set(object_x, object_y, 0);
		// limit model in the center +- 0.3 range
		// this.bones["Hips"].position.x = object_x * 0.3;
		return {
			x: object_x,
		};
	}
}
