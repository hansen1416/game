import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
// import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

// function rampFunction(u, v, pos) {
// 	const alpha = 2 * Math.PI * u,
// 		r = v < 0.5 ? 2 : 3;

// 	if (v < 0.1 || v > 0.9) pos.y = 0;
// 	else
// 		pos.y =
// 			0.5 +
// 			0.3 * Math.sin(2 * alpha) +
// 			0.1 * Math.cos(3 * alpha) +
// 			0.1 * Math.cos(9 * alpha);

// 	pos.x = r * Math.cos(alpha);
// 	pos.z = r * Math.sin(alpha);
// }

// function generateTerrain() {
// 	// control how smooth is the geometry
// 	const N = 100;

// 	const geometry = new ParametricGeometry(rampFunction, N, 5);
// 	geometry.computeVertexNormals();

// 	const ramp = new THREE.Mesh(
// 		geometry,
// 		new THREE.MeshLambertMaterial({
// 			color: "Aquamarine",
// 			side: THREE.DoubleSide,
// 		})
// 	);
// 	this.scene.add(ramp);
// }
let instance;

export default class ThreeScene {
	constructor(canvas, width, height) {
		// make it a singleton, so we only have 1 threejs scene
		if (instance) {
			return instance;
		} else {
			instance = this;
		}

		this.scene = new THREE.Scene();

		this.scene.add(new THREE.AxesHelper(1));

		this.camera = new THREE.OrthographicCamera(
			width / -2, // left
			width / 2, // right
			height / 2, // top
			height / -2, // bottom
			0.1, // near
			width * 2 // far
		);

		// this.camera.position.set(0, 10, -width);
		// this.camera.zoom = 160; // zoom in by 50%

		// // far angle for throw testing
		// this.camera.zoom = 30; // zoom in by 50%
		// this.camera.position.set(600, 600, -width);
		// // far angle for throw testing

		this.camera.zoom = 60; // zoom in by 50%
		this.camera.position.set(0, width * 0.1, -width * 1.2);

		// console.log(width);

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
}
