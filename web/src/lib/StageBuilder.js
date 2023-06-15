import * as CANNON from "cannon-es";
import * as THREE from "three";
import { GROUND_LEVEL, GROUND_WIDTH, GROUND_HEIGHT } from "../utils/constants";
import ThreeScene from "./ThreeScene";
import CannonWorld from "./CannonWorld";

/**
 * this class is to build the static part in the world/scene
 */
export default class StageBuilder {
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


// import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

// function rampFunction(u, v, pos) {
// 	const alpha = 2 * Math.PI * u,
// 		r = v < 0.5 ? 2 : 3;

// 	if (v < 0.1 || v > 0.9) pos.y = 0;
// 	else
// 		pos.y =
// 			0.5 +
// 			0.3 * Math.sin(2 * alpha) +
// 			0.1 * Math.cos(3 * alpha) +
// 			0.1 * Math.cos(9 * alpha);

// 	pos.x = r * Math.cos(alpha);
// 	pos.z = r * Math.sin(alpha);
// }

// function generateTerrain() {
// 	// control how smooth is the geometry
// 	const N = 100;

// 	const geometry = new ParametricGeometry(rampFunction, N, 5);
// 	geometry.computeVertexNormals();

// 	const ramp = new THREE.Mesh(
// 		geometry,
// 		new THREE.MeshLambertMaterial({
// 			color: "Aquamarine",
// 			side: THREE.DoubleSide,
// 		})
// 	);
// 	this.scene.add(ramp);
// }