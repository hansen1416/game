import * as THREE from "three";
import { BlazePoseKeypointsValues } from "../utils/ropes";
import ThreeScene, { SceneProperties } from "./ThreeScene";
import Boxer from "./Boxer";

let instance;

export default class BoxerController {
	/**
	 * @type {Boxer}
	 */
	boxer;

	/**
	 *
	 * @param {ThreeScene} renderer

	 */
	constructor(renderer) {
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.renderer = renderer;
	}

	destructor() {
		// todo clear all players, from this class, threejs scene, cannon world

		console.log("PlayerController destructor");
	}

	/**
	 *
	 * @param {THREE.Mesh} mesh

	 */
	addPlayer(mesh) {
		this.boxer = new Boxer(mesh);

		this.renderer.scene.add(this.boxer.mesh);

		console.log("BoxerController addPlayer", this.boxer);
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
	onPoseCallback(pose3D, pose2D, lower_body = false) {
		if (!this.boxer) {
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
		const shoulder_vector_pose = new THREE.Vector3(
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
		this.rotateMainPlayer(shoulder_vector_pose);

		// this.main_player.pose2totation.applyPose2Bone(pose3Dvec, lower_body);
		const shoulder_vector_mesh = this.boxer.applyPose2Bone(
			pose3D,
			lower_body
		);
	}

	/**
	 *
	 * @param {THREE.Vector3} shoulder_vector right_shoulder_position - left_shoulder_position
	 */
	rotateMainPlayer(shoulder_vector) {
		const quaternion = this.boxer.rotate(shoulder_vector);
	}
}
