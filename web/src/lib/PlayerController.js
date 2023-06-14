import Player from "./Player";
import PlayerMain from "./PlayerMain";
import ThreeScene from "./ThreeScene";
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
		
		console.log('PlayerController destructor')
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
		}

		this.renderer.addPlayerObj(player.mesh);

		if (player.body) {
			this.physics.addPlayerBody(player.body, player.mesh);
		}

		this.players.push(player);
		this.players_mapping[player.uuid] = this.players.length - 1;
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

		this.main_player.pose2totation.applyPoseToBone(pose3D, lower_body);

		// this.main_player.pose2totation.applyPosition(pose2D, this.lateral);
	}

	// todo, we need the speed
	// each player has a speed, calculate the next position for each player based on their speed
	//

	// call this in each animaiton frame
	onFrameUpdate() {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].speed) {
				const speed = this.players[i].speed.clone();

				// todo calculate the next position based on the speed vector and current position
			}
		}
	}
}
