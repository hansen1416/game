import * as THREE from "three";
import Player from "./Player";
import PlayerMain from "./PlayerMain";
import ThreeScene, { SceneProperties } from "./ThreeScene";
import CannonWorld from "./CannonWorld";
import { BlazePoseKeypointsValues } from "../utils/ropes";

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

	// [0, 1] how sensitive the camera respond to player's rotation, higher is more sensitive
	camera_sensitivity = 0.1

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
	 *	this function is called in the `onPoseCallback`,
	 *  so it's a bit (a few ms) slower than `requestAnimationFrame`
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

		// the shoulder pose rotation control the rotation of mesh
		const shoulder_vector = new THREE.Vector3(
			pose3D[BlazePoseKeypointsValues["RIGHT_SHOULDER"]].x -
				pose3D[BlazePoseKeypointsValues["LEFT_SHOULDER"]].x,
			pose3D[BlazePoseKeypointsValues["RIGHT_SHOULDER"]].y -
				pose3D[BlazePoseKeypointsValues["LEFT_SHOULDER"]].y,
			pose3D[BlazePoseKeypointsValues["RIGHT_SHOULDER"]].z -
				pose3D[BlazePoseKeypointsValues["LEFT_SHOULDER"]].z
		).normalize();

		this.main_player.rotate(shoulder_vector);

		// the shoulder mesh rotation control the camera direction and speed direction
		this.main_player.updateShoulderVectorMesh();

		this.main_player.move();

		this.cameraFollow();
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

		slerp by `camera_sensitivity` each step, so the camera is smooth
	 */
	cameraFollow() {
		const camera_dir = this.main_player
			.getCameraDirection()
			.multiplyScalar(SceneProperties.camera_far_z);

		// the height of camera is constant
		// its direction is controlled by mesh shoulder
		const camera_target_pos = new THREE.Vector3(
			this.main_player.mesh.position.x + camera_dir.x,
			this.renderer.camera.position.y,
			this.main_player.mesh.position.z + camera_dir.z
		);

		this.renderer.camera.position.lerp(camera_target_pos, this.camera_sensitivity);
		this.renderer.camera.lookAt(this.main_player.mesh.position);
	}

	/**
	 * call this in each animaiton frame
	 * it controls the other players movement
	 */
	onFrameUpdate() {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].speed) {
				this.players[i].mesh.position.add(this.players[i].speed);
			}
		}
	}
}
