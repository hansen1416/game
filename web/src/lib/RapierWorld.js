/**
 * @typedef {import('../../node_modules/@dimforge/rapier3d/pipeline/world').World} World
 * @typedef {import('../../node_modules/@dimforge/rapier3d/geometry/collider').Collider} Collider
 * @typedef {import('../../node_modules/@dimforge/rapier3d/geometry/collider').ColliderDesc} ColliderDesc
 * @typedef {import('../../node_modules/@dimforge/rapier3d/dynamics/rigid_body').RigidBody} RigidBody
 * @typedef {import('../../node_modules/@dimforge/rapier3d/dynamics/rigid_body').RigidBodyDesc} RigidBodyDesc
 * @typedef {import('../../node_modules/@dimforge/rapier3d/dynamics/coefficient_combine_rule').CoefficientCombineRule} CoefficientCombineRule
 * @typedef {import('../../node_modules/@dimforge/rapier3d/control/character_controller').KinematicCharacterController} KinematicCharacterController
 * @typedef {import('../../node_modules/@dimforge/rapier3d/geometry/ray').Ray} Ray
 * @typedef {import('../../node_modules/@dimforge/rapier3d/pipeline/query_pipeline').QueryFilterFlags} QueryFilterFlags
 * @typedef {{x: number, y: number, z: number}} vec3
 */

import * as THREE from "three";

let instance;

export default class RapierWorld {
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
	 * @type {RigidBody}
	 */
	character_rigid;

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
		/** @type {Ray} */
		this.Ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
		/** @type {QueryFilterFlags} */
		this.QueryFilterFlags = RAPIER.QueryFilterFlags;
	}

	/**
	 * called in each `requestAnimationFrame`
	 */
	onFrameUpdate() {
		this.world.step();
	}

	/**
	 * Creates a new collider descriptor with a heightfield shape.
	 * @param {vec3} origin
	 * @param {number} size
	 * @param {number} segments
	 * @param {Float32Array} heights - The heights of the heightfield along its local `y` axis,
	 *                  provided as a matrix stored in column-major order.
	 */
	createTerrain(origin, size, segments, heights) {
		// @ts-ignore
		const rbDesc = this.RigidBodyDesc.fixed().setTranslation(
			origin.x,
			origin.y,
			origin.z
		);
		const terrainBody = this.world.createRigidBody(rbDesc);

		// @ts-ignore
		const clDesc = this.ColliderDesc.heightfield(
			segments,
			segments,
			heights,
			new THREE.Vector3(size, 1, size)
		)
			.setFriction(1)
			.setRestitution(0);
		this.world.createCollider(clDesc, terrainBody);
	}

	removeTerrain() {
		// todo
		// this.world.removeRigidBody
	}

	/**
	 *
	 */
	createCharacter() {
		// rigidbody
		// @ts-ignore
		const rbDesc = this.RigidBodyDesc.kinematicPositionBased()
			.setTranslation(0, 0, 0)
			.enabledRotations(true, true, true)
			.setLinearDamping(0);

		this.character_rigid = this.world.createRigidBody(rbDesc);

		// collider, todo calculate this size by gltf model box
		// @ts-ignore
		const clDesc = this.ColliderDesc.cuboid(0.3, 0.9, 0.2)
			.setTranslation(0, 0.9, 0)
			.setFriction(this.friction)
			.setRestitution(this.restitution)
			.setMass(1);

		this.world.createCollider(clDesc, this.character_rigid);
	}

	removeCharacter() {
		// todo
		// this.world.removeRigidBody
	}

	/**
	 *
	 * @param {vec3} position
	 * @param {vec3} velocity
	 */
	createProjectile(position, velocity) {
		// @ts-ignore
		const rbDesc = this.RigidBodyDesc.dynamic()
			.setTranslation(position.x, position.y, position.z)
			.setLinvel(velocity.x, velocity.y, velocity.z)
			.setLinearDamping(this.liner_damping)
			// .restrictRotations(false, true, false) // Y-axis only
			.setCcdEnabled(true);
		const rigid = this.world.createRigidBody(rbDesc);

		// @ts-ignore
		const clDesc = this.ColliderDesc.ball(0.1)
			.setFriction(this.friction) // @ts-ignore
			.setFrictionCombineRule(this.CoefficientCombineRule.Max)
			// .setTranslation(0, 0, 0)
			.setRestitution(this.restitution) // @ts-ignore
			.setRestitutionCombineRule(this.CoefficientCombineRule.Max);
		// .setCollisionGroups(CollisionMask.ActorMask | CollisionMask.TouchActor);
		this.world.createCollider(clDesc, rigid);

		return rigid;
	}

	removeProjectile() {
		// todo
		// this.world.removeRigidBody
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
		const clDesc = this.ColliderDesc.cuboid(0.4, 0.8, 0.3)
			.setFriction(this.friction)
			.setRestitution(this.restitution);

		this.world.createCollider(clDesc, rigid);

		return rigid;
	}

	removeRandomSample() {
		// todo
		// this.world.removeRigidBody
	}

	/**
	 *
	 * @param {THREE.Quaternion} quaternion
	 */
	rotateCharacter(quaternion) {
		this.character_rigid.setRotation(quaternion, true);
	}

	/**
	 *
	 * @param {vec3} translation
	 */
	moveCharacter(translation) {
		this.character_rigid.setTranslation(translation, true);
	}

	/**
	 *
	 *
	 * @param {{x: number, z: number}} xz_pos
	 * @returns {vec3}
	 */
	raycastingTerrain(xz_pos) {
		this.Ray.origin.x = xz_pos.x;
		this.Ray.origin.y = -100;
		this.Ray.origin.z = xz_pos.z;

		// `max_toi` limits the ray-cast to the segment: [ray.origin, ray.origin + ray.dir * max_toi]
		// our terrain max/min height limited to 100/-100, and the origin is at {x, 200, z},
		// so 301 is enough to find the position on the terrain
		const maxToi = 301.0;
		const solid = true;

		const hit = this.world.castRay(
			this.Ray,
			maxToi,
			solid, // @ts-ignore
			this.QueryFilterFlags.EXCLUDE_DYNAMIC
		);
		if (hit != null) {
			// Handle the hit.
			return this.Ray.pointAt(hit.toi);
		}

		console.info(
			"raycasting didn't find position on terrain to locate player"
		);

		return;
	}

	destructor() {
		this.world.free();
	}
}
