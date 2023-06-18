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
		const shoulder_rotation =
			this.main_player.pose2totation.applyPoseToBone(pose3D, lower_body);

		// console.log("shoulder angle", shoulder_rotation);

		// there will be a initial speed, which will be modified by user torse orientation
		// const speed = new THREE.Vector3(0, 0, 0.1);

		// const alpha = Math.atan(Math.abs(speed.z) / Math.abs(speed.x));
		// const beta = alpha - shoulder_rotation;

		// const speed_scalar = Math.sqrt(speed.x ** 2 + speed.z ** 2);

		// speed.x = speed_scalar * Math.cos(beta)
		// speed.z = speed_scalar * Math.sin(beta)

		// console.log(speed);

		// the user's character movement
		this.main_player.mesh.position.add(this.main_player.speed);

		// note: the speed.z can be 0, the atan will be Math.PI/2
		// use absolute value to calculate the angle, so theta always lower than Math.PI/2
		// use the sign of x/z to control the diff instead
		const theta = Math.atan(
			Math.abs(this.main_player.speed.x) /
				Math.abs(this.main_player.speed.z)
		);

		// the x offset of camera, always behind the back of player
		// when x is 0, the z offset is a default value
		this.renderer.camera.position.x =
			this.main_player.mesh.position.x +
			(this.main_player.speed.x > 0 ? -1 : 1) *
				Math.sin(theta) *
				SceneProperties.camera_far_z;
		this.renderer.camera.position.z =
			this.main_player.mesh.position.z +
			(this.main_player.speed.z > 0 ? -1 : 1) *
				Math.cos(theta) *
				SceneProperties.camera_far_z;

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
