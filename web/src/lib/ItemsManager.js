import * as THREE from "three";
import ThreeScene from "./ThreeScene";
import RapierWorld from "./RapierWorld";

let instance;

export default class ItemsManager {
	/**
	 * @type {THREE.Mesh[]}
	 */
	item_meshes = [];

	/**
	 * @type {import("./RapierWorld").RigidBody[]}
	 */
	item_rigid = [];

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

	onFrameUpdate() {
		for (let i in this.item_rigid) {
			const t = this.item_rigid[i].translation();
			this.item_meshes[i].position.set(t.x, t.y, t.z);

			const r = this.item_rigid[i].rotation();
			this.item_meshes[i].setRotationFromQuaternion(
				new THREE.Quaternion(r.x, r.y, r.z, r.w)
			);
		}

		if (import.meta.env.DEV && false) {
			if (!this.lines) {
				let material = new THREE.LineBasicMaterial({
					color: 0xffffff,
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

	/**
	 *
	 * @param {import("./RapierWorld").vec3} pos
	 */
	addItem(pos) {
		const mesh = this.renderer.createRandomSample(pos);

		const rigid = this.physics.createRandomSample(mesh, pos);

		this.item_rigid.push(rigid);
		this.item_meshes.push(mesh);
	}

	spreadItems() {
		// const points = poissonDiskSampling(GROUND_WIDTH/10, GROUND_HEIGHT/10, 20, 30);

		this.addItem({ x: 2, y: 0.8, z: 8 });
	}
}
