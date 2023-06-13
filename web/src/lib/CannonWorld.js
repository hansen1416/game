import * as CANNON from "cannon-es";

let instance;

export default class CannonWorld {
	constructor() {
		// make it a singleton, so we only have 1 threejs scene
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

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
	}

	onFrameUpdate() {
		this.world.fixedStep();

		for (let i in this.rigid) {
			this.mesh[i].position.copy(this.rigid[i].position);
			this.mesh[i].quaternion.copy(this.rigid[i].quaternion);
		}
	}

	/**
	 *
	 * @param {CANNON.Body} body
	 */
	addStaticBody(body) {
		this.world.addBody(body);
	}

	/**
	 *
	 * @param {CANNON.Body} body
	 * @param {THREE.Mesh} mesh
	 */
	addItemBody(body, mesh) {
		this.world.addBody(body);

		this.rigid.push(body);
		this.mesh.push(mesh);
	}

	/**
	 *
	 * @param {CANNON.Body} body
	 * @param {THREE.Object3D} mesh
	 */
	addPlayerBody(body, mesh) {
		this.world.addBody(body);

		this.rigid.push(body);
		this.mesh.push(mesh);
	}
}

/**



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

	



	//  The value of linearDamping can be set to any non-negative number, 
	// 	with higher values resulting in faster loss of velocity. 
	// 	A value of 0 means there is no damping effect, 
	// 	and the body will continue moving at a constant velocity forever.

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


 */
