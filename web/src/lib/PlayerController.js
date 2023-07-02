import * as THREE from "three";
import { BlazePoseKeypointsValues } from "../utils/ropes";
import ThreeScene, { SceneProperties } from "./ThreeScene";
import RapierWorld from "./RapierWorld";
import Player from "./Player";
import PlayerMain from "./PlayerMain";
import Pitcher from "./Pitcher";

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
	 * @type {THREE.Mesh[]}
	 */
	projectile_meshes = [];

	/**
	 * @type {import("./RapierWorld").RigidBody[]}
	 */
	projectile_rigid = [];

	/**
	 * @type {Array}
	 */
	animation_data;
	/**
	 * @type {number}
	 */
	animation_data_idx = 0;

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

	destructor() {
		// todo clear all players, from this class, threejs scene, cannon world

		console.log("PlayerController destructor");
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
	 * @param {Array[]} data
	 */
	setAnimationData(data) {
		this.animation_data = data;
	}

	/**
	 *
	 * @param {THREE.Mesh} model
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

			// prepare the controller and collider
			this.physics.createCharacter(model);

			this.pitcher = new Pitcher(player);

			this.pitcher.subscribe(this);
		} else {
			player = new Player(model, position, rotation);

			this.players.push(player);
			this.players_mapping[player.uuid] = this.players.length - 1;
		}

		this.renderer.scene.add(player.mesh);
	}

	/**
	 *
	 * @param {string} uuid
	 */
	removePlayer(uuid) {
		const player = this.players[this.players_mapping[uuid]];

		this.renderer.removePlayerObj(player.mesh);

		// if (player.body) {
		// 	this.physics.removePlayerBody(player.body);
		// }

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

		// captured pose only control upper body
		// we need to apply animation to lower body of player depends on player's `speed`
		this.applyLowerBodyAnimation2MainPlayer();

		this.pitcher.onFrameUpdate();

		// todo, update other players rigid and mesh

		for (let i in this.projectile_rigid) {
			const t = this.projectile_rigid[i].translation();
			this.projectile_meshes[i].position.set(t.x, t.y, t.z);

			const r = this.projectile_rigid[i].rotation();
			this.projectile_meshes[i].setRotationFromQuaternion(
				new THREE.Quaternion(r.x, r.y, r.z, r.w)
			);
		}

		if (import.meta.env.DEV) {
			if (!this.lines) {
				let material = new THREE.LineBasicMaterial({
					color: 0xffffff, // @ts-ignore
					vertexColors: THREE.VertexColors,
				});
				let geometry = new THREE.BufferGeometry();
				this.lines = new THREE.LineSegments(geometry, material);
				this.renderer.scene.add(this.lines);
			}

			let buffers = this.physics.world.debugRender();
			this.lines.geometry.setAttribute(
				"position",
				new THREE.BufferAttribute(buffers.vertices, 3)
			);
			this.lines.geometry.setAttribute(
				"color",
				new THREE.BufferAttribute(buffers.colors, 4)
			);
		}
	}

	applyLowerBodyAnimation2MainPlayer() {
		if (!this.animation_data) {
			return;
		}

		// console.log(this.animation_data);

		//how to do?
		this.main_player.applyAnimation2Bone(
			this.animation_data[this.animation_data_idx]
		);

		this.animation_data_idx++;

		if (this.animation_data_idx >= this.animation_data.length) {
			this.animation_data_idx = 0;
		}
	}

	/**
	 *
	 * @param {THREE.Vector3} position
	 * @param {boolean} left
	 */
	addProjectileToHand(position, left = false) {
		// console.log(position, this);

		const mesh = this.renderer.createProjectile();

		mesh.position.copy(position);

		this.setProjectile(mesh, left);
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
	 *
	 * @param {THREE.Vector3} shoulder_vector
	 */
	rotateMainPlayer(shoulder_vector) {
		const quaternion = this.main_player.rotate(shoulder_vector);

		this.physics.rotateCharacter(quaternion);
	}

	moveMainPlayer() {
		const translation = this.physics.moveCharacter(this.main_player.speed);

		this.main_player.move(translation);
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

		// this must happend before apply pose to bones,
		// cause we need to apply rotation to the captured pose position
		// rotate main player's mesh and rigid
		this.rotateMainPlayer(shoulder_vector);

		// this.main_player.pose2totation.applyPose2Bone(pose3Dvec, lower_body);
		this.main_player.applyPose2Bone(pose3D, lower_body);

		// the shoulder mesh rotation control the camera direction and speed direction
		this.main_player.updateShoulderVectorMesh();

		// `speed` is just a vector that add to player `position` in each frame
		this.main_player.calculateSpeed();

		// move main player's mesh and rigid
		this.moveMainPlayer();

		this.pitcher.trackHandsPos();

		// update hands track, for pitching
		this.pitcher.onPoseApplied();

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
	 * 	The value of linearDamping can be set to any non-negative number, 
		with higher values resulting in faster loss of velocity. 
		A value of 0 means there is no damping effect, 
		and the body will continue moving at a constant velocity forever.

	 * @param {THREE.Vector3} velocity
	 * @param {boolean} left
	 */
	shoot(velocity, left = false) {
		const mesh = this.getProjectile(left);

		const body = this.physics.createProjectile(mesh.position, velocity);

		this.projectile_meshes.push(mesh);
		this.projectile_rigid.push(body);
	}
}
