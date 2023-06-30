/**
 * @typedef {import('../../node_modules/@dimforge/rapier3d/pipeline/world').World} World
 * @typedef {import('../../node_modules/@dimforge/rapier3d/geometry/collider').Collider} Collider
 * @typedef {import('../../node_modules/@dimforge/rapier3d/geometry/collider').ColliderDesc} ColliderDesc
 * @typedef {import('../../node_modules/@dimforge/rapier3d/dynamics/rigid_body').RigidBody} RigidBody
 * @typedef {import('../../node_modules/@dimforge/rapier3d/dynamics/rigid_body').RigidBodyDesc} RigidBodyDesc
 * @typedef {import('../../node_modules/@dimforge/rapier3d/dynamics/coefficient_combine_rule').CoefficientCombineRule} CoefficientCombineRule
 * @typedef {import('../../node_modules/@dimforge/rapier3d/control/character_controller').KinematicCharacterController} KinematicCharacterController
 * @typedef {{x: number, y: number, z: number}} vec3
 */

import * as THREE from "three";

let instance;

export default class RapierWorld {
	/**
	 * @type {RigidBody[]}
	 */
	rigid = [];

	/**
	 * @type {THREE.Mesh[]}
	 */
	mesh = [];

	/**
	 *  Larger values of the damping coefficients lead to a stronger slow-downs. Their default values are 0.0 (no damping at all).
	 */
	liner_damping = 0.5;

	/**
	 * A friction coefficient of 0 implies no friction at all (completely sliding contact)
	 * and a coefficient greater or equal to 1 implies a very strong friction. Values greater than 1 are allowed.
	 */
	friction = 0.5;

	/**
	 * A restitution coefficient set to 1 (fully elastic contact) implies that
	 * the exit velocity at a contact has the same magnitude as the entry velocity along the contact normal:
	 * it is as if you drop a bouncing ball and it gets back to the same height after the bounce.
	 *
	 * A restitution coefficient set ot 0 implies that
	 * the exit velocity at a contact will be zero along the contact normal:
	 * it's as if you drop a ball but it doesn't bounce at all.
	 */

	restitution = 0.3;

	/**
	 * @type {KinematicCharacterController}
	 */
	character_controller;

	/**
	 * @type {RigidBody}
	 */
	character_rigid;

	/**
	 * @type {Collider}
	 */
	character_collider;

	/**
	 *
	 * @param {module} RAPIER
	 */
	constructor(RAPIER) {
		// make it a singleton, so we only have 1 threejs scene
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		const gravity = { x: 0.0, y: -9.81, z: 0.0 };
		/** @type {World} */
		this.world = new RAPIER.World(gravity);
		/** @type {ColliderDesc} */
		this.ColliderDesc = RAPIER.ColliderDesc;
		/** @type {RigidBodyDesc} */
		this.RigidBodyDesc = RAPIER.RigidBodyDesc;
		/** @type {CoefficientCombineRule} */
		this.CoefficientCombineRule = RAPIER.CoefficientCombineRule;
	}

	/**
	 * called in each `requestAnimationFrame`
	 */
	onFrameUpdate() {
		this.world.step();

		for (let i in this.rigid) {
			const t = this.rigid[i].translation();
			this.mesh[i].position.set(t.x, t.y, t.z);

			const r = this.rigid[i].rotation();
			this.mesh[i].setRotationFromQuaternion(
				new THREE.Quaternion(r.x, r.y, r.z, r.w)
			);
		}
	}

	/**
	 * Creates a new collider descriptor with a heightfield shape.
	 * @param {vec3} origin
	 * @param {number} terrain_size
	 * @param {Float32Array} heights - The heights of the heightfield along its local `y` axis,
	 *                  provided as a matrix stored in column-major order.
	 */
	createTerrain(origin, terrain_size, heights) {
		// @ts-ignore
		const rbDesc = this.RigidBodyDesc.fixed().setTranslation(
			origin.x + terrain_size * 0.5,
			origin.y,
			origin.z + terrain_size * 0.5
		);
		const terrainBody = this.world.createRigidBody(rbDesc);

		// @ts-ignore
		const clDesc = this.ColliderDesc.heightfield(
			terrain_size,
			terrain_size,
			heights,
			new THREE.Vector3(terrain_size, 1, terrain_size)
		)
			.setFriction(this.friction)
			.setRestitution(0);
		this.world.createCollider(clDesc, terrainBody);
	}

	/**
	 *
	 * @param {THREE.Mesh} mesh
	 * @param {vec3} position
	 * @param {vec3} velocity
	 */
	createProjectile(mesh, position, velocity) {
		// @ts-ignore
		const rbDesc = this.RigidBodyDesc.dynamic()
			.setTranslation(position.x, position.y, position.z)
			.setLinvel(velocity.x, velocity.y, velocity.z)
			.setLinearDamping(this.liner_damping)
			// .restrictRotations(false, true, false) // Y-axis only
			.setCcdEnabled(true);
		const sphereBody = this.world.createRigidBody(rbDesc);

		// @ts-ignore
		const clDesc = this.ColliderDesc.ball(0.1)
			.setFriction(this.friction) // @ts-ignore
			.setFrictionCombineRule(this.CoefficientCombineRule.Max)
			// .setTranslation(0, 0, 0)
			.setRestitution(this.restitution) // @ts-ignore
			.setRestitutionCombineRule(this.CoefficientCombineRule.Max);
		// .setCollisionGroups(CollisionMask.ActorMask | CollisionMask.TouchActor);
		this.world.createCollider(clDesc, sphereBody);

		this.rigid.push(sphereBody);
		this.mesh.push(mesh);
	}

	/**
	 *
	 * @param {THREE.Mesh} mesh
	 * @param {vec3} position
	 */
	createRandomSample(mesh, position) {
		// @ts-ignore
		const rbDesc = this.RigidBodyDesc.dynamic()
			.setTranslation(position.x, position.y, position.z)
			.setLinearDamping(this.liner_damping)
			.setCcdEnabled(true);
		const rigid = this.world.createRigidBody(rbDesc);

		// @ts-ignore
		const clDesc = this.ColliderDesc.cuboid(0.5, 0.4, 0.3)
			.setFriction(this.friction)
			.setRestitution(this.restitution);

		this.world.createCollider(clDesc, rigid);

		this.rigid.push(rigid);
		this.mesh.push(mesh);
	}

	/**
	 * @param {THREE.Mesh} mesh
	 */
	createCharacter(mesh) {
		// controller
		this.character_controller = this.world.createCharacterController(0.01);

		this.character_controller.setUp({ x: 0, y: 1, z: 0 });
		this.character_controller.enableSnapToGround(0.8);
		this.character_controller.enableAutostep(0.1, 0.1, false);

		// rigidbody
		// @ts-ignore
		const rbDesc = this.RigidBodyDesc.kinematicPositionBased()
			.setTranslation(0, -0.6, 0)
			.enabledRotations(true, true, true)
			.setLinearDamping(0);

		this.character_rigid = this.world.createRigidBody(rbDesc);

		// collider
		// @ts-ignore
		const clDesc = this.ColliderDesc.ball(0.4)
			.setFriction(this.friction)
			.setRestitution(this.restitution)
			.setMass(10);

		this.character_collider = this.world.createCollider(
			clDesc,
			this.character_rigid
		);

		this.rigid.push(this.character_rigid);
		this.mesh.push(mesh);
	}

	/**
	 *
	 * @param {vec3} target_translation
	 * @returns
	 */
	moveCharacter(target_translation) {
		this.character_controller.computeColliderMovement(
			this.character_collider, // The collider we would like to move.
			target_translation // The movement we would like to apply if there wasn’t any obstacle.
		);

		const correctedMovement = this.character_controller.computedMovement();

		this.character_rigid.setNextKinematicTranslation(correctedMovement);
	}

	destructor() {
		this.world.removeCharacterController(this.character_controller);
	}
}
