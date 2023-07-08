<script>
	import * as THREE from "three"; //@ts-ignore
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
	import { onDestroy, onMount } from "svelte";
	import THREETerrain from "../lib/THREETerrain";

	let scene, camera, light, renderer, controls, canvas;
	let world, lines;

	let animationPointer;

	// let multiplier = 0;

	onMount(() => {
		initScene();

		const segments = 15;
		const size = 1024;

		// const [terrain, hm] = THREETerrain({
		const terrain = THREETerrain({
			easing: THREETerrain.Linear,
			frequency: 2.5,
			heightmap: THREETerrain.Perlin,
			material: new THREE.MeshPhongMaterial({
				color: 0xe39923,
				opacity: 0.5,
				transparent: true,
			}),
			maxHeight: 100,
			minHeight: -100,
			steps: 1,
			xSegments: segments,
			xSize: size,
			ySegments: segments,
			ySize: size,
		});

		const json_data = {
			// @ts-ignore
			width: terrain.geometry.parameters.width,
			// @ts-ignore
			height: terrain.geometry.parameters.height,
			// @ts-ignore
			widthSegments: terrain.geometry.parameters.widthSegments,
			// @ts-ignore
			heightSegments: terrain.geometry.parameters.heightSegments,
			normal: Array.from(terrain.geometry.getAttribute("normal").array),
			position: Array.from(
				terrain.geometry.getAttribute("position").array
			),
			uv: Array.from(terrain.geometry.getAttribute("uv").array),
		};

		console.log(json_data);

		const positions = terrain.geometry.attributes.position.array;

		// console.log(terrain.geometry)

		const heights = [];
		const pos_vec = [];

		for (let i = 0; i < positions.length; i += 3) {
			// for (let i = positions.length - 1; i >= 0; i -= 3) {
			// get the z axis value from geometry positions
			// heights.push(positions[i]);

			pos_vec.push(
				new THREE.Vector3(
					positions[i],
					positions[i + 1],
					positions[i + 2]
				)
			);
		}

		pos_vec.sort((a, b) => {
			return a.x - b.x || b.y - a.y;
		});

		for (let i = 0; i < pos_vec.length; i++) {
			heights.push(pos_vec[i].z);
		}

		scene.add(terrain);

		Promise.all([import("@dimforge/rapier3d")]).then(([RAPIER]) => {
			const gravity = { x: 0.0, y: -9.81, z: 0.0 };

			world = new RAPIER.World(gravity);

			const origin = new THREE.Vector3(0, 0, 0);

			// @ts-ignore
			const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
				origin.x,
				origin.y,
				origin.z
			);
			const terrainBody = world.createRigidBody(rbDesc);

			const clDesc = RAPIER.ColliderDesc.heightfield(
				segments,
				segments,
				new Float32Array(heights),
				new THREE.Vector3(size, 1, size)
			)
				.setFriction(1)
				.setRestitution(0);

			world.createCollider(clDesc, terrainBody);
		});

		animate();
	});

	// $: if (multiplier) {
	// 	if (collider) {
	// 		const q = new THREE.Quaternion().setFromAxisAngle(
	// 			new THREE.Vector3(0, 0, 1),
	// 			(Math.PI / 32) * multiplier
	// 		);

	// 		collider.setRotation(q);
	// 	}
	// }

	onDestroy(() => {
		cancelAnimationFrame(animationPointer);
	});

	function initScene() {
		const sceneWidth = document.documentElement.clientWidth;
		const sceneHeight = document.documentElement.clientHeight;

		scene = new THREE.Scene();

		scene.add(new THREE.AxesHelper(100));

		camera = new THREE.PerspectiveCamera(
			75,
			sceneWidth / sceneHeight,
			0.01,
			2000
		);
		//@ts-ignore
		camera.position.set(0, 1000, 1000);

		camera.updateProjectionMatrix(); // update the camera's projection matrix

		// env light
		scene.add(new THREE.AmbientLight(0xffffff, 0.5));

		// mimic the sun light. maybe update light position later
		light = new THREE.PointLight(0xffffff, 0.5); //@ts-ignore
		light.position.set(0, 10, 500);
		light.castShadow = true;
		// light.shadow.mapSize.width = 2048;
		// light.shadow.mapSize.height = 2048;
		scene.add(light);

		renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: true,
			antialias: true,
		});
		//@ts-ignore
		renderer.shadowMap.enabled = true; //@ts-ignore
		renderer.shadowMap.type = THREE.BasicShadowMap; //THREE.PCFSoftShadowMap;
		renderer.toneMappingExposure = 0.5;

		controls = new OrbitControls(camera, canvas);

		renderer.setSize(sceneWidth, sceneHeight);
	}

	function animate() {
		controls.update();
		renderer.render(scene, camera);

		if ((import.meta.env.DEV && scene, world)) {
			if (!lines) {
				let material = new THREE.LineBasicMaterial({
					color: 0xffffff, // @ts-ignore
					// vertexColors: THREE.VertexColors,
				});
				let geometry = new THREE.BufferGeometry();
				lines = new THREE.LineSegments(geometry, material);
				scene.add(lines);
			}

			let buffers = world.debugRender();
			lines.geometry.setAttribute(
				"position",
				new THREE.BufferAttribute(buffers.vertices, 3)
			);
			lines.geometry.setAttribute(
				"color",
				new THREE.BufferAttribute(buffers.colors, 4)
			);
		}

		animationPointer = requestAnimationFrame(animate);
	}
</script>

<div class="bg">
	<canvas bind:this={canvas} />

	<!-- <input class="input" type="number" bind:value={multiplier} /> -->
</div>

<style>
	.bg {
		background-color: #0f2027;
	}

	.input {
		position: absolute;
		right: 0;
		bottom: 0;
	}
</style>
