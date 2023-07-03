import * as THREE from "three";
import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";
import { TerrainShape } from "./TerrainShape";
import { GROUND_LEVEL } from "../utils/constants";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
// import THREETerrain from "./THREE.Terrain";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";

let instance;

export default class TerrainBuilder {
	/**
	 * @type {TerrainShape[]}
	 */
	pool = [];

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

	terrain() {
		// Define the vertices and faces of the surface
		const worldWidth = 256;
		const worldDepth = 256;
		// const data = generateHeight(worldWidth, worldDepth);

		// const geometry = new THREE.PlaneGeometry(
		// 	500,
		// 	500,
		// 	worldWidth - 1,
		// 	worldDepth - 1
		// );
		// geometry.rotateX(-Math.PI / 2);

		// const vertices = geometry.attributes.position.array;

		// for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
		// 	vertices[j + 1] = data[i];
		// }

		const geometry = new THREE.PlaneGeometry(
			500,
			500,
			worldWidth - 1,
			worldDepth - 1
		);
		geometry.rotateX(-Math.PI / 2);

		// const position = geometry.attributes.position;
		// // position.usage = THREE.DynamicDrawUsage;

		// for (let i = 0; i < position.count; i++) {
		// 	const y = 2 * Math.sin(i / 2);
		// 	position.setY(i, y);
		// }

		const mesh = new THREE.Mesh(
			geometry,
			new THREE.MeshStandardMaterial({
				color: 0x0b549d,
				side: THREE.DoubleSide,
			})
		);

		mesh.receiveShadow = true;
		mesh.castShadow = true;

		// this.renderer.camera.position.set(100, 800, -800);
		// this.renderer.camera.lookAt(-100, 810, -800);

		const origin = new THREE.Vector3(0, 0, 0);

		mesh.position.copy(origin);

		const heightMap = new Float32Array(17 ** 2);

		for (let i = 0; i < heightMap.length; i++) {
			heightMap[i] = 0;
		}

		this.physics.createTerrain(origin, 16, heightMap);

		this.renderer.scene.add(mesh);
	}

	terrain_3() {
		const terrain_range = 64;

		for (let y = -terrain_range; y < terrain_range; y += 16) {
			for (let x = -terrain_range; x < terrain_range; x += 16) {
				// const terrain = new TerrainShape(new Vector3(x, 0, y));
				// terrain.addToScene(this.scene);
				// this.terrain.push(terrain);
				// this.pool.add(terrain);
				const terrain = new TerrainShape(
					this.renderer,
					this.physics,
					new THREE.Vector3(x, GROUND_LEVEL, y)
				);

				this.pool.push(terrain);
			}
		}

		return this;
	}

	terrain_2() {
		const N = 100;

		const geometry = new ParametricGeometry(rampFunction, N, 5);
		geometry.computeVertexNormals();

		console.log(geometry);

		const ramp = new THREE.Mesh(
			geometry,
			new THREE.MeshLambertMaterial({
				color: "Aquamarine",
				side: THREE.DoubleSide,
			})
		);
		this.renderer.scene.add(ramp);
	}

	terrain_1() {
		// console.log(THREETerrain);

		// var xS = 63,
		// 	yS = 63;
		// const terrainScene = THREETerrain({
		// 	easing: THREETerrain.EaseOut,
		// 	frequency: 2.5,
		// 	heightmap: THREETerrain.DiamondSquare,
		// 	material: new THREE.MeshBasicMaterial({ color: 0x5566aa }),
		// 	maxHeight: 100,
		// 	minHeight: -100,
		// 	steps: 1,
		// 	xSegments: xS,
		// 	xSize: 1024,
		// 	ySegments: yS,
		// 	ySize: 1024,
		// });
		// // Assuming you already have your global scene, add the terrain to it
		// this.renderer.scene.add(terrainScene);
	}
}

function generateHeight(width, height) {
	let seed = Math.PI / 4;
	window.Math.random = function () {
		const x = Math.sin(seed++) * 10000;
		return x - Math.floor(x);
	};

	const size = width * height,
		data = new Uint8Array(size);
	const perlin = new ImprovedNoise(),
		z = Math.random() * 100;

	let quality = 1;

	for (let j = 0; j < 4; j++) {
		for (let i = 0; i < size; i++) {
			const x = i % width,
				y = ~~(i / width);
			data[i] += Math.abs(
				perlin.noise(x / quality, y / quality, z) * quality * 1.75
			);
		}

		quality *= 5;
	}

	return data;
}

function rampFunction(u, v, pos) {
	const alpha = 2 * Math.PI * u,
		r = v < 0.5 ? 2 : 3;

	if (v < 0.1 || v > 0.9) pos.y = 0;
	else
		pos.y =
			0.5 +
			0.3 * Math.sin(2 * alpha) +
			0.1 * Math.cos(3 * alpha) +
			0.1 * Math.cos(9 * alpha);

	pos.x = r * Math.cos(alpha);
	pos.z = r * Math.sin(alpha);
}

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
