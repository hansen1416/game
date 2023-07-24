/**
 * @typedef {{width: number, height: number, widthSegments: number, heightSegments: number, position: number[], trees: object[]}} TerrainStruct
 */

import * as THREE from "three";
import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";
import { ImprovedNoise } from "three/addons/math/ImprovedNoise.js";

let instance;

export default class TerrainBuilder {
	/**
	 * @type {{[key: string]: THREE.InstancedMesh}}
	 */
	treesPool = {};

	/**
	 * @type {{[key: string]: {quaternion: THREE.Quaternion, scale: THREE.Vector3}}}
	 */
	treesTransform = {};

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

	/**
	 * add tree instance to `treesPool`, and keep their roation and scale in `treesTransform`
	 * @param {object} treesGLB
	 */
	async loadTrees(treesGLB) {
		// throw trees out of the scene
		const dummy = new THREE.Object3D();
		dummy.position.set(0, -10000, 0);
		dummy.updateMatrix();

		const instance_size = 1000;
		let idx = 0;

		treesGLB.scene.children[0].traverse((node) => {
			if (node.isMesh) {
				this.treesPool[idx] = new THREE.InstancedMesh(
					node.geometry,
					node.material,
					instance_size
				);

				this.treesTransform[idx] = {
					quaternion: node.parent.quaternion.clone(),
					scale: node.parent.scale.clone().multiplyScalar(0.1),
				};

				for (let i = 0; i < instance_size; i++) {
					this.treesPool[idx].setMatrixAt(i, dummy.matrix);
				}

				this.renderer.scene.add(this.treesPool[idx]);

				idx += 1;
			}
		});

		return true;
	}

	/**
	 *
	 * @param {number[]} positions
	 * @returns
	 */
	heightmapFromPosition(positions) {
		const heights = [];
		const pos_vec = [];

		for (let i = 0; i < positions.length; i += 3) {
			// 1d array to vectors
			pos_vec.push(
				new THREE.Vector3(
					positions[i],
					positions[i + 1],
					positions[i + 2]
				)
			);
		}
		// the first point is at top left corner for Rapier heightfiled, and colmun major
		pos_vec.sort((a, b) => {
			return a.x - b.x || b.y - a.y;
		});

		for (let i = 0; i < pos_vec.length; i++) {
			heights.push(pos_vec[i].z);
		}

		return heights;
	}

	/**
	 *
	 * @param {TerrainStruct} data
	 * @param {[number, number]} indices
	 */
	terrain(data, indices) {
		const origin = new THREE.Vector3(
			indices[0] * 1024,
			0,
			indices[1] * 1024
		);

		// Define the vertices and faces of the surface
		const geometry = new THREE.PlaneGeometry(
			data.width,
			data.height,
			data.widthSegments,
			data.heightSegments
		);

		// geometry.setAttribute(
		// 	"normal",
		// 	new THREE.BufferAttribute(new Float32Array(data.normal), 3)
		// );
		geometry.setAttribute(
			"position",
			new THREE.BufferAttribute(new Float32Array(data.position), 3)
		);
		// geometry.setAttribute(
		// 	"uv",
		// 	new THREE.BufferAttribute(new Float32Array(data.uv), 2)
		// );

		const mesh = new THREE.Mesh(
			geometry,
			new THREE.MeshStandardMaterial({
				color: 0x0b549d,
				side: THREE.DoubleSide,
			})
		);

		mesh.geometry.computeBoundingSphere();
		mesh.geometry.computeVertexNormals();

		mesh.receiveShadow = true;
		mesh.castShadow = true;

		mesh.rotation.x = -Math.PI / 2;
		mesh.position.copy(origin);

		this.renderer.scene.add(mesh);

		// add trees

		const tree_idx = Array(13).fill(0);

		const dummy = new THREE.Object3D();
		const depth_adjustment = 1;

		// scatter trees on the land
		if (data.trees) {
			for (let i = 0; i < data.trees.length; i++) {
				const tree = data.trees[i];

				dummy.position.set(
					origin.x + tree.pos.x,
					origin.y + tree.pos.z - depth_adjustment,
					origin.z - tree.pos.y
				);
				dummy.setRotationFromQuaternion(
					this.treesTransform[tree.type].quaternion
				);
				dummy.scale.copy(this.treesTransform[tree.type].scale);
				dummy.updateMatrix();

				this.treesPool[tree.type].setMatrixAt(
					tree_idx[tree.type],
					dummy.matrix
				);

				tree_idx[tree.type] += 1;
			}
		}

		const heightMap = new Float32Array(
			this.heightmapFromPosition(data.position)
		);

		this.physics.createTerrain(
			origin,
			data.width,
			data.widthSegments,
			heightMap
		);

		return this;
	}

	/**
	 *	@param {TerrainStruct[]} terrain_arr
	 *	@param {[number, number][]} index_arr
	 */
	terrainSeires(terrain_arr, index_arr) {
		for (let i = 0; i < terrain_arr.length; i++) {
			this.terrain(terrain_arr[i], index_arr[i]);
		}
		return this;
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
