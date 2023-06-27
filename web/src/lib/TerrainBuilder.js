import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";

let instance;

export default class TerrainBuilder {
	/**
	 *
	 * @param {ThreeScene} renderer
	 * @param {RapierWorld} physics
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
}
