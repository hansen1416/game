import * as THREE from "three";
import Deque from "../utils/Deque";

export default class Pitcher {
	/**
	 *
	 * @param {{bones: {[key: string]: THREE.Bone}, shoulder_vector_mesh: THREE.Vector3}} player_instance
	 */
	constructor(player_instance) {
		this.bones = player_instance.bones;
		this.shoulder_vector = player_instance.shoulder_vector_mesh;

		this.left_hand_track = new Deque(10);
		this.right_hand_track = new Deque(10);

		this.handsWaitingLeft = false;
		this.handsAvailableLeft = true;
		this.handsWaitingRight = false;
		this.handsAvailableRight = true;

		this.handsEmptyCounterLeft = 0;
		this.handsEmptyCounterRight = 0;
		this.handsWaitingThreshold = 60;
		/** @type {object[]} */
		this.observers = [];
	}

	/**
	 *
	 * @param {string} fn
	 * @param {array} args
	 */
	fire(fn, args) {
		this.observers.forEach((observer) => observer[fn](...args));
	}

	/**
	 *
	 * @param {object} observer
	 */
	subscribe(observer) {
		this.observers.push(observer);
	}

	/**
	 *
	 * @param {boolean} left
	 * @returns
	 */
	getHandsWaitingFlag(left = false) {
		return left ? this.handsWaitingLeft : this.handsWaitingRight;
	}

	/**
	 *
	 * @param {boolean} flag
	 * @param {boolean} left
	 */
	setHandsWaitingFlag(flag, left = false) {
		if (left) {
			this.handsWaitingLeft = flag;
		} else {
			this.handsWaitingRight = flag;
		}
	}

	/**
	 * when hands empty, add a projectile to it
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

		if (this.handsAvailableLeft) {
			const pos = new THREE.Vector3();

			this.bones.LeftHand.getWorldPosition(pos);

			this.fire("addMeshToHand", [pos, true]);

			this.handsAvailableLeft = false;
			this.handsWaitingLeft = false;
		}

		if (this.handsAvailableRight) {
			const pos = new THREE.Vector3();

			this.bones.RightHand.getWorldPosition(pos);

			this.fire("addMeshToHand", [pos, false]);

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

		// when is fore arm is roughly pointing forward, trigger the shoot
		if (Math.abs(direction.x) < 0.6 && Math.abs(direction.y) < 0.3) {
			// the direction mapping to x,z plane is orthogonal to the shoulder vector "(z, -x)"
			return new THREE.Vector3(
				this.shoulder_vector.z,
				0,
				-this.shoulder_vector.x
			);
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

		if (speed > speed_threshold && direction) {
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
	 * on each frame the model moved with the captured pose
	 * if we got a speed, lauch the projectile
	 * otherwise the projectiles move with the hands
	 */
	onPoseApplied() {
		for (let f of [true, false]) {
			if (this.getHandsWaitingFlag(f)) {
				continue;
			}
			const velocity = this.#calculateAngularVelocity(f);

			// console.log("velocity", velocity);
			if (velocity) {
				this.fire("shoot", [velocity, f]);

				// mark hand empty, waiting for new object to load
				this.setHandsWaitingFlag(true, f);
			} else {
				// let the ball move with hand
				const pos = new THREE.Vector3();

				this.bones[f ? "LeftHand" : "RightHand"].getWorldPosition(pos);

				this.fire("updateProjectilePos", [pos, f]);
			}
		}
	}
}
