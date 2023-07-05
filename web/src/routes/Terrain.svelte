<script>
	import * as THREE from "three"; //@ts-ignore
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
	import { onDestroy, onMount } from "svelte";
	import THREETerrain from "../lib/THREETerrain";

	let scene, camera, light, renderer, controls, canvas;
	let world, lines;

	let animationPointer;

	let heights = [];

	onMount(() => {
		initScene();

		const xS = 31,
			yS = 31;

		const terrain = THREETerrain({
			easing: THREETerrain.Linear,
			frequency: 2.5,
			heightmap: THREETerrain.Perlin,
			material: new THREE.MeshBasicMaterial({ color: 0xe39923 }),
			maxHeight: 100,
			minHeight: -100,
			steps: 1,
			xSegments: xS,
			xSize: 1024,
			ySegments: yS,
			ySize: 1024,
		});

		const positions = terrain.geometry.attributes.position.array;

		for (let i = 2; i < positions.length; i += 3) {
			heights.push(positions[i]);
		}

		console.log(heights);

		scene.add(terrain);

		Promise.all([import("@dimforge/rapier3d")]).then(([RAPIER]) => {
			const gravity = { x: 0.0, y: -9.81, z: 0.0 };

			world = new RAPIER.World(gravity);

			const origin = new THREE.Vector3(0, 0, 0);

			const terrain_size = 63;
			// @ts-ignore
			const rbDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(
				origin.x ,
				origin.y,
				origin.z 
			);
			const terrainBody = world.createRigidBody(rbDesc);

			const hm_size = 10

			const h = new Float32Array(Array((hm_size + 1)**2).fill(0))

			// console.log(h)

			// @ts-ignore
			const clDesc = RAPIER.ColliderDesc.heightfield(
				hm_size,
				hm_size,
				h,
				new THREE.Vector3(1000, 1, 1000)
			)
				.setFriction(1)
				.setRestitution(0);
			world.createCollider(clDesc, terrainBody);
		});

		animate();
	});

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
		camera.position.set(0, 100, 100);

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
</div>

<style>
	.bg {
		background-color: #0f2027;
	}
</style>
