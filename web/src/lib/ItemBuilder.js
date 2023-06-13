import * as CANNON from "cannon-es";
import * as THREE from "three";
import { GROUND_LEVEL, GROUND_WIDTH, GROUND_HEIGHT } from "../utils/constants";
import ThreeScene from "./ThreeScene";
import CannonWorld from "./CannonWorld";
import { poissonDiskSampling } from "../lib/PoissonSampling";

export default class ItemBuilder {
	/**
	 *
	 * @param {ThreeScene} renderer
	 * @param {CannonWorld} physics
	 */
	constructor(renderer, physics) {
		this.renderer = renderer;
		this.physics = physics;
	}

    /**
     * 
     * @param {object} pos 
     * @param {object} prop 
     */
	addItem(pos, prop) {
		const { x, y, z } = pos;
		const { w, h, d } = { w: 0.5, h: 0.5, d: 0.5 };

		const mesh = new THREE.Mesh(
			new THREE.BoxGeometry(w * 2, h * 2, d * 2),
			new THREE.MeshBasicMaterial({ color: prop.color })
		);

		mesh.position.set(x, y, z);

		this.renderer.addItemMesh(mesh);

		const body = new CANNON.Body({
			mass: 10, // kg
			shape: new CANNON.Box(new CANNON.Vec3(w, h, d)),
		});

		body.position.set(x, y, z);

		this.physics.addItemBody(body, mesh);
	}

    spreadItems() {
        const points = poissonDiskSampling(100, 100, 20, 30);

        const y = GROUND_LEVEL + 0.9;

		for (let p of points) {
			this.addItem(
				{ x: p.x - 50, y: y, z: p.y - 50 },
				{ color: 0xff0099 }
			);
		}
    }
}
