import * as CANNON from "cannon-es";
import * as THREE from "three";
import { GROUND_LEVEL, GROUND_WIDTH, GROUND_HEIGHT } from "../utils/constants";
import ThreeScene from "./ThreeScene";
import CannonWorld from "./CannonWorld";


export default class WorldBuilder {
	/**
	 *
	 * @param {ThreeScene} renderer
	 * @param {CannonWorld} physics
	 */
	constructor(renderer, physics) {
		this.renderer = renderer;
		this.physics = physics;
	}

	addGround() {
		// add floor
		const groundBody = new CANNON.Body({
			mass: 0,
			shape: new CANNON.Plane(),
		});

		groundBody.position.set(0, GROUND_LEVEL, 0);
		groundBody.quaternion.setFromAxisAngle(
			new CANNON.Vec3(1, 0, 0),
			-Math.PI / 2
		);

		this.physics.addStaticBody(groundBody);

		// Create a Three.js ground plane mesh
		const groundMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_HEIGHT),
			new THREE.MeshStandardMaterial({ color: 0x363795 })
		);

		groundMesh.position.set(0, GROUND_LEVEL, 0);
		groundMesh.rotation.set(-Math.PI / 2, 0, 0);

		this.renderer.addStaticMesh(groundMesh);

		return this;
	}

	build() {
		// do something when build process complete
	}
}

//Parent Class
class BaseBuilder {
	init() {
		Object.keys(this).forEach((key) => {
			const withName = `with${key
				.substring(0, 1)
				.toUpperCase()}${key.substring(1)}`;
			this[withName] = (value) => {
				this[key] = value;
				return this;
			};
		});
	}

	build() {
		const keysNoWithers = Object.keys(this).filter(
			(key) => typeof this[key] !== "function"
		);

		return keysNoWithers.reduce((returnValue, key) => {
			return {
				...returnValue,
				[key]: this[key],
			};
		}, {});
	}
}
