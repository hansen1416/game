/**
 * @typedef {{x: number, y: number, z: number}} vec3
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module.js";

let stats;

if (import.meta.env.DEV) {
	stats = new Stats();

	stats.showPanel(1);

	document.body.appendChild(stats.dom);
}

export const SceneProperties = {
	camera_height: 1,
	camera_far_z: 4,
};

Object.freeze(SceneProperties);

let instance;

export default class ThreeScene {
	/**
	 *
	 * @param {HTMLCanvasElement} canvas
	 * @param {number} width
	 * @param {number} height
	 * @returns
	 */
	constructor(canvas, width, height) {
		// make it a singleton, so we only have 1 threejs scene
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.scene = new THREE.Scene();

		this.scene.add(new THREE.AxesHelper(1));

		// this.camera = new THREE.OrthographicCamera(
		// 	width / -2, // left
		// 	width / 2, // right
		// 	height / 2, // top
		// 	height / -2, // bottom
		// 	0.1, // near
		// 	width * 2 // far
		// );

		// this.camera.zoom = 60; // zoom in by 50%
		// this.camera.position.set(0, 0.1, -4);

		this.camera = new THREE.PerspectiveCamera(
			75,
			width / height,
			0.01,
			100
		);

		this.camera.position.set(
			0,
			SceneProperties.camera_height,
			-SceneProperties.camera_far_z
		);

		this.camera.updateProjectionMatrix(); // update the camera's projection matrix

		// env light
		this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

		// mimic the sun light. maybe update light position later
		this.light = new THREE.PointLight(0xffffff, 0.5);
		this.light.position.set(0, 30, 0);
		this.light.castShadow = true;
		this.scene.add(this.light);

		this.renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: true,
			antialias: true,
		});

		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.BasicShadowMap; //THREE.PCFSoftShadowMap;
		this.renderer.toneMappingExposure = 0.5;

		this.controls = new OrbitControls(this.camera, canvas);

		this.renderer.setSize(width, height);
	}

	onFrameUpdate() {
		// this.controls.update();

		this.renderer.render(this.scene, this.camera);

		if (stats) {
			stats.update();
		}
	}

	/**
	 *
	 * @returns {THREE.Mesh}
	 */
	createProjectile() {
		const mesh = new THREE.Mesh(
			new THREE.SphereGeometry(0.1), // @ts-ignore
			new THREE.MeshNormalMaterial()
		);
		mesh.castShadow = true;

		this.scene.add(mesh);

		return mesh;
	}

	/**
	 *
	 * @param {vec3} pos
	 */
	createRandomSample(pos) {
		const mesh = new THREE.Mesh(
			new THREE.BoxGeometry(0.8, 1.6, 0.6),
			new THREE.MeshBasicMaterial({ color: 0xff0099 })
		);

		mesh.position.set(pos.x, pos.y, pos.z);

		mesh.castShadow = true;

		this.scene.add(mesh);

		return mesh;
	}

	/**
	 *
	 * @param {THREE.Object3D} player_obj
	 */
	removePlayerObj(player_obj) {
		console.info("todo remove", player_obj);
	}

	resetControl() {
		this.controls.reset();
	}
}
