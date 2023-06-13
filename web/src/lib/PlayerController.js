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
		} else {
			player = new Player(model, position, rotation);
		}

		this.renderer.addPlayerObj(player.mesh);

		if (player.body) {
			this.physics.addPlayerBody(player.body, player.mesh);
		}

		this.players[player.uuid] = player;
	}
}
