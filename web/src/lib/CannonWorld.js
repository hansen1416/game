import * as CANNON from "cannon-es";
import * as THREE from "three";
// import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";
import {
	GROUND_LEVEL,
	GROUND_WIDTH,
	GROUND_HEIGHT,
} from "../utils/constants";

let debug;

if (import.meta.env.DEV) {
	const module = await import(/* @vite-ignore */ `../utils/debugger`);

	debug = module.cannonDebugger;
}
export default class CannonWorld {
	constructor(scene) {
		this.scene = scene;

		this.world = new CANNON.World({
			gravity: new CANNON.Vec3(0, -9.82, 0), // m/s²
		});

		// add floor Material
		// const planeMaterial = new CANNON.Material();

		// planeMaterial.friction = 1;

		// const planeContactMaterial = new CANNON.ContactMaterial(
		// 	planeMaterial,
		// 	new CANNON.Material(),
		// 	{
		// 		friction: 1,
		// 		restitution: 1,
		// 		contactEquationStiffness: 1e6,
		// 	}
		// );

		// this.world.addContactMaterial(planeContactMaterial);

		this.rigid = [];
		this.mesh = [];

		if (debug) {
			this.debuggerInstance = debug(this.scene, this.world);
		}
	}

	addGround() {
		// add floor
		const groundBody = new CANNON.Body({ mass: 0 });
		// @ts-ignore
		// groundBody.material = planeContactMaterial;
		groundBody.position.set(0, GROUND_LEVEL, 0);
		groundBody.quaternion.setFromAxisAngle(
			new CANNON.Vec3(1, 0, 0),
			-Math.PI / 2
		);

		groundBody.addShape(new CANNON.Plane());

		this.world.addBody(groundBody);

		// Create a Three.js ground plane mesh
		const groundMesh = new THREE.Mesh(
			new THREE.PlaneGeometry(GROUND_WIDTH, GROUND_HEIGHT),
			new THREE.MeshStandardMaterial({ color: 0x363795 })
		);

		groundMesh.position.set(0, GROUND_LEVEL, 0);
		groundMesh.rotation.set(-Math.PI / 2, 0, 0);
		groundMesh.receiveShadow = true;

		this.scene.add(groundMesh);
	}

	// daneelBody(glb) {
	// 	// const meshes = {};
	// 	// mesh.traverse(function (node) {
	// 	// 	if (node.isMesh) {
	// 	// 		meshes[node.name] = node;
	// 	// 	}
	// 	// });
	// 	// const meshKey = "Wolf3D_Body";
	// 	// if you have another dynamic body with a non-zero mass and it collides with the static body,
	// 	// it may still pass through due to numerical errors in the physics simulation.
	// 	// // Set up contact material for collisions
	// 	// var groundMaterial = new CANNON.Material();
	// 	// var contactMaterial = new CANNON.ContactMaterial(groundMaterial, groundMaterial, {
	// 	//     friction: 0.3,
	// 	//     restitution: 0.5,
	// 	//     contactEquationStiffness: 1e9, // Increase stiffness to reduce penetration
	// 	//     contactEquationRelaxation: 4 // Increase relaxation for better stability
	// 	// });
	// 	// world.addContactMaterial(contactMaterial);
	// }

	boxTarget(
		pos = { x: 0, y: 0, z: 0 },
		prop = { mass: 10, color: 0xa8c0ff },
		size = { w: 0.5, h: 0.5, d: 0.5 }
	) {
		const { x, y, z } = pos;
		const { w, h, d } = size;

		const shape = new CANNON.Box(new CANNON.Vec3(w, h, d));

		const body = new CANNON.Body({
			mass: prop.mass, // kg
			shape: shape,
		});

		body.position.set(x, y, z);
		z;
		this.world.addBody(body);

		const mesh = new THREE.Mesh(
			new THREE.BoxGeometry(w * 2, h * 2, d * 2),
			new THREE.MeshBasicMaterial({ color: prop.color })
		);

		mesh.position.set(x, y, z);

		this.scene.add(mesh);

		this.rigid.push(body);
		this.mesh.push(mesh);
	}

	createTargets(points) {
		const y = GROUND_LEVEL + 0.9;
		// const z = -PLAYER_Z;
		const mass = 10;

		for (let p of points) {
			this.boxTarget(
				{ x: p.x - 50, y: y, z: p.y - 50 },
				{ mass: mass, color: 0xff0099 }
			);
		}
	}

	onFrameUpdate() {
		this.world.fixedStep();

		if (debug) {
			this.debuggerInstance.update();
		}

		for (let i in this.rigid) {
			this.mesh[i].position.copy(this.rigid[i].position);
			this.mesh[i].quaternion.copy(this.rigid[i].quaternion);
		}
	}

	/**
	 * 	The value of linearDamping can be set to any non-negative number, 
		with higher values resulting in faster loss of velocity. 
		A value of 0 means there is no damping effect, 
		and the body will continue moving at a constant velocity forever.

	 * @param {object} mesh 
	 * @param {CANNON.Vec3} velocity control both direction and speed,
	 * @param {number} dimping control how quickly the object loose its speed
	 * @returns 
	 */
	project(mesh, velocity, dimping = 0.3) {
		const sphereBody = new CANNON.Body({
			mass: 5, // kg
			shape: new CANNON.Sphere(mesh.geometry.parameters.radius),
		});
		sphereBody.position.set(
			mesh.position.x,
			mesh.position.y,
			mesh.position.z
		); // m

		sphereBody.velocity.set(velocity.x, velocity.y, velocity.z);

		sphereBody.linearDamping = dimping;

		this.world.addBody(sphereBody);

		this.rigid.push(sphereBody);
		this.mesh.push(mesh);

		return sphereBody;
	}
}
