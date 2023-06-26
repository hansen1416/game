import * as THREE from "three";
import * as CANNON from "cannon-es";
import { BlazePoseKeypointsValues } from "../utils/ropes";
import ThreeScene, { SceneProperties } from "./ThreeScene";
import CannonWorld from "./CannonWorld";
import Player from "./Player";
import PlayerMain from "./PlayerMain";
import Pitcher from "./Picther";

let instance;

export default class PlayerController {
	/**
	 * @type {Player[]}
	 */
	players = [];
	/**
	 * @type {{[key: string]: number}}
	 */
	players_mapping = {};

	/**
	 * @type {PlayerMain}
	 */
	main_player;

	/**
	 * @type {Pitcher}
	 */
	pitcher;

	// [0, 1] how sensitive the camera respond to player's rotation, higher is more sensitive
	camera_sensitivity = 0.1;

	/**
	 * @type {THREE.Mesh}
	 */
	left_projectile;
	/**
	 * @type {THREE.Mesh}
	 */
	right_projectile;

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

	destructor() {
		// todo clear all players, from this class, threejs scene, cannon world

		console.log("PlayerController destructor");
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

			this.pitcher = new Pitcher(player);
		} else {
			player = new Player(model, position, rotation);

			this.players.push(player);
			this.players_mapping[player.uuid] = this.players.length - 1;
		}

		this.renderer.addPlayerObj(player.mesh);

		if (player.body) {
			this.physics.addPlayerBody(player.body, player.mesh);
		}
	}

	/**
	 *
	 * @param {string} uuid
	 */
	removePlayer(uuid) {
		const player = this.players[this.players_mapping[uuid]];

		this.renderer.removePlayerObj(player.mesh);

		if (player.body) {
			this.physics.removePlayerBody(player.body);
		}

		// how to effctively remove the player from array
		const idx = this.players_mapping[uuid];

		// remove Player instance from `this.players`, also update
		if (idx >= 0) {
			this.players.splice(idx, 1);

			for (let i = idx; i < this.players.length; i++) {
				this.players_mapping[this.players[i].uuid] = i;
			}
		}

		delete this.players_mapping[uuid];
	}

	/**
	 * call this in each animaiton frame
	 * it controls the other players movement
	 */
	onFrameUpdate() {
		for (let i = 0; i < this.players.length; i++) {
			if (this.players[i].speed) {
				this.players[i].mesh.position.add(this.players[i].speed);
			}
		}

		this.pitcher.onFrameUpdate(this.addMeshToHand);
	}

	/**
	 *
	 * @param {boolean} left
	 * @returns {THREE.Mesh}
	 */
	getProjectile(left = false) {
		return left ? this.left_projectile : this.right_projectile;
	}
	/**
	 *
	 * @param {THREE.Mesh} mesh
	 * @param {boolean} left
	 */
	setProjectile(mesh, left = false) {
		if (left) {
			this.left_projectile = mesh;
		} else {
			this.right_projectile = mesh;
		}
	}

	/**
	 *
	 * @param {THREE.Vector3} position
	 * @param {boolean} left
	 */
	addMeshToHand(position, left = false) {
		const mesh = new THREE.Mesh(
			new THREE.SphereGeometry(0.1), // @ts-ignore
			new THREE.MeshNormalMaterial()
		);
		mesh.castShadow = true;

		mesh.position.copy(position);

		this.setProjectile(mesh, left);

		this.renderer.scene.add(mesh);
	}

	/**
	 *	this function is called in the `onPoseCallback`,
	 *  so it's a bit (a few ms) slower than `requestAnimationFrame`
	 *
	 * @param {{x:number, y:number, z:number}[]} pose3D
	 * @param {{x:number, y:number, z:number}[]} pose2D
	 * @param {boolean} lower_body
	 * @returns
	 */
	applyPose2MainPlayer(pose3D, pose2D, lower_body = false) {
		if (!this.main_player) {
			return;
		}

		const width_ratio = 30;
		const height_ratio = (width_ratio * 480) / 640;

		// multiply x,y by width/height factor
		for (let i = 0; i < pose3D.length; i++) {
			pose3D[i].x *= width_ratio;
			pose3D[i].y *= -height_ratio;
			pose3D[i].z *= -width_ratio;
		}

		// the shoulder pose rotation control the rotation of mesh
		const shoulder_vector = new THREE.Vector3(
			pose3D[BlazePoseKeypointsValues["RIGHT_SHOULDER"]].x -
				pose3D[BlazePoseKeypointsValues["LEFT_SHOULDER"]].x,
			pose3D[BlazePoseKeypointsValues["RIGHT_SHOULDER"]].y -
				pose3D[BlazePoseKeypointsValues["LEFT_SHOULDER"]].y,
			pose3D[BlazePoseKeypointsValues["RIGHT_SHOULDER"]].z -
				pose3D[BlazePoseKeypointsValues["LEFT_SHOULDER"]].z
		).normalize();

		// this must happend before apply pose to bones, cause we need to apply rotation to the captured pose position
		this.main_player.rotate(shoulder_vector);

		// this.main_player.pose2totation.applyPoseToBone(pose3Dvec, lower_body);
		this.main_player.applyPoseToBone(pose3D, lower_body);

		// the shoulder mesh rotation control the camera direction and speed direction
		this.main_player.updateShoulderVectorMesh();

		this.main_player.move();

		this.pitcher.trackHandsPos();

		// update hands track, for pitching
		this.pitcher.onPoseApplied(this.project, this.updateProjectilePos);

		this.cameraFollow();
	}

	/**
		given two shoulder positions, calculate the middle orthogonal vector

		const direction = new THREE.Vector2().subVectors(point2, point1).normalize();
		const orthogonal1 = new THREE.Vector2(-direction.y, direction.x).normalize();
		const orthogonal2 = new THREE.Vector2(direction.y, -direction.x).normalize();

		note that for main player, the +x is to the left hand side, +z is toward the screen.
		so the vector towards the player's back is (-z, y, x)

		and multiply a scalar to the vector which towards back,
		and add to the players position
		we should have the camera position, which is always at the back of player

		slerp by `camera_sensitivity` each step, so the camera is smooth
	 */
	cameraFollow() {
		const camera_dir = this.main_player
			.getCameraDirection()
			.multiplyScalar(SceneProperties.camera_far_z);

		// the height of camera is constant
		// its direction is controlled by mesh shoulder
		const camera_target_pos = new THREE.Vector3(
			this.main_player.mesh.position.x + camera_dir.x,
			this.renderer.camera.position.y,
			this.main_player.mesh.position.z + camera_dir.z
		);

		this.renderer.camera.position.lerp(
			camera_target_pos,
			this.camera_sensitivity
		);
		this.renderer.camera.lookAt(this.main_player.mesh.position);
	}

	/**
	 *
	 * @param {THREE.Vector3} position
	 * @param {boolean} left
	 */
	updateProjectilePos(position, left = false) {
		this.getProjectile(left).position.copy(position);
	}

	/**
	 * 	The value of linearDamping can be set to any non-negative number, 
		with higher values resulting in faster loss of velocity. 
		A value of 0 means there is no damping effect, 
		and the body will continue moving at a constant velocity forever.

	 * @param {THREE.Vector3} velocity
	 * @param {boolean} left
	 */
	project(velocity, left = false) {
		const projectile = this.getProjectile(left);

		const projectileBody = new CANNON.Body({
			mass: 5, // kg
			// @ts-ignore
			shape: new CANNON.Sphere(projectile.geometry.parameters.radius),
		});
		projectileBody.position.set(
			projectile.position.x,
			projectile.position.y,
			projectile.position.z
		); // m

		projectileBody.velocity.set(velocity.x, velocity.y, velocity.z);

		const dimping = 0.3;

		projectileBody.linearDamping = dimping;

		this.physics.world.addBody(projectileBody);

		this.physics.addItemBody(projectileBody, projectile);
	}
}
