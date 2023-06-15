import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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

		this.camera = new THREE.PerspectiveCamera(
			75,
			width / height,
			0.01,
			100
		)

		// this.camera.position.set(0, 10, -width);
		// this.camera.zoom = 160; // zoom in by 50%

		// // far angle for throw testing
		// this.camera.zoom = 30; // zoom in by 50%
		// this.camera.position.set(600, 600, -width);
		// // far angle for throw testing

		// this.camera.zoom = 60; // zoom in by 50%
		// this.camera.position.set(0, width * 0.1, -width * 1.2);

		// this.camera.zoom = 60; // zoom in by 50%
		this.camera.position.set(0, 2, -6);

		// for walk testing
		// this.camera.zoom = 195;
		// this.camera.position.set(-998.0815884477113, 0, 11);
		// for walk testing

		this.camera.updateProjectionMatrix(); // update the camera's projection matrix

		{
			// mimic the sun light
			const dlight = new THREE.SpotLight(0xffffff, 0.7);
			dlight.position.set(0, 30, 0);
			dlight.castShadow = true;
			this.scene.add(dlight);
			// env light
			this.scene.add(new THREE.AmbientLight(0xffffff, 0.3));
		}

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
		this.controls.update();

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
}
