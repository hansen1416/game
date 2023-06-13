import Player from "./Player";
import PlayerMain from "./PlayerMain";
import ThreeScene from "./ThreeScene";
import CannonWorld from "./CannonWorld";

let instance;

export default class PlayerController {
	/**
	 * @type {{[key: string]: Player}}
	 */
	players = {};
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

		this.players[player.uuid] = player;
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
	onFrameUpdate() {}
}
