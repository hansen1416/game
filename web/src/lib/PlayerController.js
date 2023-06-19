import * as THREE from "three";
import Player from "./Player";
import PlayerMain from "./PlayerMain";
import ThreeScene, { SceneProperties } from "./ThreeScene";
import CannonWorld from "./CannonWorld";

let instance;

export default class PlayerController {
	/**
	 * @type {Player[]}
	 */
	players = [];
	/**
	 * @type {{[key: string]: number}}
	 */
	players_mapping = {};

	/**
	 * @type {PlayerMain}
	 */
	main_player;

	//
	lateral = 20;

	/**
	 *
	 * @param {ThreeScene} renderer
	 * @param {CannonWorld} physics
	 */
	constructor(renderer, physics) {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.renderer = renderer;
		this.physics = physics;
	}

	destructor() {
		// todo clear all players, from this class, threejs scene, cannon world

		console.log("PlayerController destructor");
	}

	/**
	 *
	 * @param {THREE.Object3D} model
	 * @param {{x: number, y: number, z: number}} position
	 * @param {{x: number, y: number, z: number}} rotation
	 * @param {boolean} is_main
	 */
	addPlayer(
		model,
		position = { x: 0, y: 0, z: 0 },
		rotation = { x: 0, y: 0, z: 0 },
		is_main = false
	) {
		let player;

		if (is_main) {
			player = new PlayerMain(model, position, rotation);
			this.main_player = player;
		} else {
			player = new Player(model, position, rotation);

			this.players.push(player);
			this.players_mapping[player.uuid] = this.players.length - 1;
		}

		this.renderer.addPlayerObj(player.mesh);

		if (player.body) {
			this.physics.addPlayerBody(player.body, player.mesh);
		}
	}

	/**
	 *
	 * @param {string} uuid
	 */
	removePlayer(uuid) {
		const player = this.players[this.players_mapping[uuid]];

		this.renderer.removePlayerObj(player.mesh);

		if (player.body) {
			this.physics.removePlayerBody(player.body);
		}

		// how to effctively remove the player from array
		const idx = this.players_mapping[uuid];

		// remove Player instance from `this.players`, also update
		if (idx >= 0) {
			this.players.splice(idx, 1);

			for (let i = idx; i < this.players.length; i++) {
				this.players_mapping[this.players[i].uuid] = i;
			}
		}

		delete this.players_mapping[uuid];
	}

	/**
	 *	this function is called in the onPoseCallback,
	 *  so it's a bit slower than requestAnimationFrame
	 *
	 * @param {object} pose3D
	 * @param {object} pose2D
	 * @param {boolean} lower_body
	 * @returns
	 */
	playerMainPose2Bone(pose3D, pose2D, lower_body = false) {
		if (!this.main_player) {
			return;
		}

		// we also need the direction that the user is facing, to caluclate the speed on the x axis
		// const shoulder_rotation =
		this.main_player.pose2totation.applyPoseToBone(pose3D, lower_body);

		// keep a track of shoulder movement, used to calculate speed direction and camera position
		this.main_player.updateShoulderTrack();

		// there will be a initial speed, which will be modified by user torse orientation
		// the user's character movement
		this.main_player.move();

		this._cameraFollow();
	}

	/**
		given two shoulder positions, calculate the middle orthogonal vector

		const direction = new THREE.Vector2().subVectors(point2, point1).normalize();
		const orthogonal1 = new THREE.Vector2(-direction.y, direction.x).normalize();
		const orthogonal2 = new THREE.Vector2(direction.y, -direction.x).normalize();

		note that for main player, the +x is to the left hand side, +z is toward the screen.
		so the vector towards the player's back is (-z, y, x)

		and multiply a scalar to the vector which towards back,
		and add to the players position
		we should have the camera position, which is always at the back of player

		slerp by 0.1 each step, so the camera is smooth
	 */
	_cameraFollow() {
		// calculate camera direction

		// const left_shoulder_pos = new THREE.Vector3()
		// const right_shoulder_pos = new THREE.Vector3()

		// this.main_player.bones.LeftShoulder.getWorldPosition(left_shoulder_pos)
		// this.main_player.bones.RightShoulder.getWorldPosition(right_shoulder_pos)

		// new THREE.Vector3().subVectors(right_shoulder_pos, left_shoulder_pos);

		const shoulder_vector = this.main_player.currentShoulderVector();

		if (!shoulder_vector) {
			return;
		}

		const camera_dir = new THREE.Vector3(
			-shoulder_vector.z,
			0,
			shoulder_vector.x
		)
			.normalize()
			.multiplyScalar(SceneProperties.camera_far_z);

		// camera_dir.multiplyScalar(SceneProperties.camera_far_z)

		const camera_target_pos = new THREE.Vector3(
			this.main_player.mesh.position.x + camera_dir.x,
			this.renderer.camera.position.y,
			this.main_player.mesh.position.z + camera_dir.z
		);

		this.renderer.camera.position.lerp(camera_target_pos, 0.1);
		this.renderer.camera.lookAt(this.main_player.mesh.position);
	}

	// call this in each animaiton frame
	onFrameUpdate() {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].speed) {
				this.players[i].mesh.position.add(this.players[i].speed);
			}
		}
	}
}
