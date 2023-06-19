import Deque from "../utils/Deque";
import * as THREE from "three";

export default class Toss {
	constructor() {
		this.left_hand_track = new Deque(10);
		this.right_hand_track = new Deque(10);
		// lower `max_deque_length` faster speed
		this.max_deque_length = 10;
	}

	getHandsPos(bones) {
		const left_hand = new THREE.Vector3();

		bones.LeftHand.getWorldPosition(left_hand);
		// Adds values to the end of a collection.
		this.left_hand_track.addFront({
			x: left_hand.x,
			y: left_hand.y,
			z: left_hand.z,
			t: performance.now(),
		});

		if (this.left_hand_track.size() > this.max_deque_length) {
			// Removes a value from the beginning of a collection, and returns that value.
			this.left_hand_track.removeBack();
		}

		const right_hand = new THREE.Vector3();

		bones.RightHand.getWorldPosition(right_hand);

		this.right_hand_track.addFront({
			x: right_hand.x,
			y: right_hand.y,
			z: right_hand.z,
			t: performance.now(),
		});

		if (this.right_hand_track.size() > this.max_deque_length) {
			// Removes a value from the beginning of a collection, and returns that value.
			this.right_hand_track.removeBack();
		}
	}

	getTrack(left = false) {
		if (left) {
			return this.left_hand_track.size() >= this.max_deque_length
				? this.left_hand_track
				: false;
		}

		return this.right_hand_track.size() >= this.max_deque_length
			? this.right_hand_track
			: false;
	}

	calculateDirection(bones, left = false) {
		const side = left ? "Left" : "Right";

		const arm_length = 0.5262200723241929;
		/**
		 * 			player1Bones.LeftArm.rotation.set(0,0,0)
			player1Bones.LeftForeArm.rotation.set(0,0,0)

			const handpos = new THREE.Vector3()
			player1Bones.LeftHand.getWorldPosition(handpos)

			const shoulderpos = new THREE.Vector3()
			player1Bones.LeftArm.getWorldPosition(shoulderpos)

			console.log('dis', handpos.distanceTo(shoulderpos))
		 */

		const handpos = new THREE.Vector3();
		bones[side + "Hand"].getWorldPosition(handpos);

		const shoulderpos = new THREE.Vector3();
		bones[side + "ForeArm"].getWorldPosition(shoulderpos);

		const direction = new THREE.Vector3()
			.subVectors(handpos, shoulderpos)
			.normalize();

		// if arm vector within 10degree from 0,0,1, we have a direction
		// and the arm is straight enough, more than 80 percent total length

		if (
			Math.abs(direction.x) < 0.6 &&
			Math.abs(direction.y) < 0.3
			// handpos.distanceTo(shoulderpos) >= arm_length * 0.7
		) {
			// direction.y = 0;
			// direction.normalize();

			return new THREE.Vector3(0, 0, 1);
		}

		return false;
	}

	/**
	 *
	 * @param {object} bones
	 * @param {boolean} left
	 * @param {number} speed_threshold
	 * @returns
	 */
	calculateAngularVelocity(bones, left = false, speed_threshold = 2) {
		/**
			if the velocity is in the right direction and has enough spped
			return velocity and let the ball fly
         */

		const direction = this.calculateDirection(bones, left);

		if (!direction) {
			return false;
		}

		let que = this.getTrack(left);

		if (!que) {
			return que;
		}

		// const points = que.toArray();
		// const end_idx = this.maxCollinearIndx(points, collinear_threshold);

		const start_point = que.peekBack();
		const end_point = que.peekFront();

		const velocity = new THREE.Vector3(
			end_point.x - start_point.x,
			end_point.y - start_point.y,
			end_point.z - start_point.z
		);

		const speed =
			(velocity.length() * 1000) / (end_point.t - start_point.t);

		// todo, decide what really is a toss
		if (speed > speed_threshold && direction) {
			console.log(
				"direction",
				direction,
				"speed",
				speed,
				"angle difference",
				direction.angleTo(new THREE.Vector3(0, 0, 1))
			);

			this.clearTrack(left);

			return direction.multiplyScalar(speed * 20);
		}

		return false;
	}

	clearTrack(left = false) {
		if (left) {
			this.left_hand_track = new Deque(10);
		} else {
			this.right_hand_track = new Deque(10);
		}
	}

	// maxCollinearIndx(points, epsilon = 0.001) {
	// 	if (points.length < 3) {
	// 		return points.length - 1;
	// 	}

	// 	const v0 = new THREE.Vector3(
	// 		points[1].x - points[0].x,
	// 		points[1].y - points[0].y,
	// 		points[1].z - points[0].z
	// 	);

	// 	for (let i = 2; i < points.length; i++) {
	// 		const vi = new THREE.Vector3(
	// 			points[i].x - points[0].x,
	// 			points[i].y - points[0].y,
	// 			points[i].z - points[0].z
	// 		);
	// 		const diff = vi.angleTo(v0);

	// 		if (diff > epsilon) {
	// 			return i;
	// 		}
	// 	}

	// 	return points.length - 1;
	// }

	//   const points = [
	// 	{ x: 1, y: 1, z: 1 },
	// 	{ x: 2, y: 2, z: 2 },
	// 	{ x: 3, y: 3, z: 3 },
	//   ];

	//   console.log(isCollinear(points)); // Output: true
}
