import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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
		this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));

		// mimic the sun light. maybe update light position later
		this.light = new THREE.PointLight(0xffffff, 0.2);
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
	}

	/**
	 *
	 * @param {THREE.Mesh} mesh
	 */
	addStaticMesh(mesh) {
		mesh.receiveShadow = true;

		this.scene.add(mesh);
	}

	/**
	 *
	 * @param {THREE.Mesh} mesh
	 */
	addItemMesh(mesh) {
		mesh.castShadow = true;

		this.scene.add(mesh);
	}
	/**
	 *
	 * @param {THREE.Object3D} player_obj
	 */
	addPlayerObj(player_obj) {
		this.scene.add(player_obj);
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
