import * as THREE from "three";
import Deque from "../utils/Deque";

export default class Pitcher {
	/**
	 *
	 * @param {{bones: {[key: string]: THREE.Bone}}} player_instance
	 */
	constructor(player_instance) {
		this.bones = player_instance.bones;

		this.left_hand_track = new Deque(10);
		this.right_hand_track = new Deque(10);

		this.handsWaitingLeft = false;
		this.handsAvailableLeft = true;
		this.handsWaitingRight = false;
		this.handsAvailableRight = true;

		this.handsEmptyCounterLeft = 0;
		this.handsEmptyCounterRight = 0;
		this.handsWaitingThreshold = 60;

		this.observers = [];
	}

	notify(fn, data) {
		this.observers.forEach((handler) => handler[fn](data));
	}
	subscribe(handler) {
		this.observers.push(handler);
	}

	/**
	 *

	 */
	onFrameUpdate() {
		if (this.handsWaitingLeft) {
			if (this.handsEmptyCounterLeft < this.handsWaitingThreshold) {
				this.handsEmptyCounterLeft += 1;
			} else {
				this.handsAvailableLeft = true;
				this.handsEmptyCounterLeft = 0;
			}
		}

		if (this.handsWaitingRight) {
			if (this.handsEmptyCounterRight < this.handsWaitingThreshold) {
				this.handsEmptyCounterRight += 1;
			} else {
				this.handsAvailableRight = true;
				this.handsEmptyCounterRight = 0;
			}
		}

		this.notify("addMeshToHand", new THREE.Vector3(1.1, 1.1, 1.1));

		if (this.handsAvailableLeft) {
			const pos = new THREE.Vector3();

			this.bones.LeftHand.getWorldPosition(pos);

			// addMesh2HandFn(pos);

			this.handsAvailableLeft = false;
			this.handsWaitingLeft = false;
		}

		if (this.handsAvailableRight) {
			const pos = new THREE.Vector3();

			this.bones.RightHand.getWorldPosition(pos);

			// addMesh2HandFn(pos);

			this.handsAvailableRight = false;
			this.handsWaitingRight = false;
		}
	}

	/**
	 * record a series of hand positions
	 * later calculate the velocity when projection
	 */
	trackHandsPos() {
		const left_hand = new THREE.Vector3();

		this.bones.LeftHand.getWorldPosition(left_hand);
		// Adds values to the end of a collection.
		this.left_hand_track.addFront({
			x: left_hand.x,
			y: left_hand.y,
			z: left_hand.z,
			t: performance.now(),
		});

		const right_hand = new THREE.Vector3();

		this.bones.RightHand.getWorldPosition(right_hand);

		this.right_hand_track.addFront({
			x: right_hand.x,
			y: right_hand.y,
			z: right_hand.z,
			t: performance.now(),
		});
	}

	/**
	 *
	 * @param {boolean} left
	 * @returns {Deque}
	 */
	#getTrack(left = false) {
		return left ? this.left_hand_track : this.right_hand_track;
	}

	/**
	 *
	 * @param {boolean} left
	 * @returns {THREE.Vector3}
	 */
	#calculateDirection(left = false) {
		const side = left ? "Left" : "Right";

		const handpos = new THREE.Vector3();
		this.bones[side + "Hand"].getWorldPosition(handpos);

		const shoulderpos = new THREE.Vector3();
		this.bones[side + "ForeArm"].getWorldPosition(shoulderpos);

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

		return;
	}

	/**
	 *
	 * @param {boolean} left
	 * @param {number} speed_threshold
	 * @returns {THREE.Vector3}
	 */
	#calculateAngularVelocity(left = false, speed_threshold = 2) {
		/**
			if the velocity is in the right direction and has enough spped
			return velocity and let the ball fly
         */

		const direction = this.#calculateDirection(left);

		if (!direction) {
			return;
		}

		let que = this.#getTrack(left);

		if (!que) {
			return;
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

			this.#clearTrack(left);

			return direction.multiplyScalar(speed * 20);
		}

		return;
	}

	/**
	 *
	 * @param {boolean} left
	 */
	#clearTrack(left = false) {
		if (left) {
			this.left_hand_track.clear();
		} else {
			this.right_hand_track.clear();
		}
	}

	/**
	 *
	 * @param {function} projectionFn
	 * @param {function} updatePosFn
	 */
	onPoseApplied(projectionFn, updatePosFn) {
		if (this.handsWaitingLeft === false) {
			const velocity = this.#calculateAngularVelocity(true);
			// console.log("velocity", velocity);
			if (velocity) {
				// making ball move
				projectionFn(velocity, true);

				// mark hand empty, waiting for new object to load
				this.handsWaitingLeft = true;
			} else {
				// let the ball move with hand

				const pos = new THREE.Vector3();

				this.bones.LeftHand.getWorldPosition(pos);

				updatePosFn(pos, true);
			}
		}

		if (this.handsWaitingRight === false) {
			const velocity = this.#calculateAngularVelocity(false);
			// console.log("velocity", velocity);
			if (velocity) {
				// making ball move

				projectionFn(velocity, false);

				this.handsWaitingRight = true;
			} else {
				// let the ball move with hand

				const pos = new THREE.Vector3();

				this.bones.RightHand.getWorldPosition(pos);

				updatePosFn(pos, false);
			}
		}
	}
}
