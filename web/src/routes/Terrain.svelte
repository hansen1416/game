<script>
	import * as THREE from "three";
	import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
	import { onDestroy, onMount } from "svelte";
	import THREETerrain from "../lib/THREETerrain";

	let scene, camera, light, renderer, controls, canvas;

	let animationPointer;

	onMount(() => {
		initScene();

		const xS = 63,
			yS = 63;

		const terrain = THREETerrain({
			easing: THREETerrain.Linear,
			frequency: 2.5,
			heightmap: THREETerrain.DiamondSquare,
			material: new THREE.MeshBasicMaterial({ color: 0x5566aa }),
			maxHeight: 100,
			minHeight: -100,
			steps: 1,
			xSegments: xS,
			xSize: 1024,
			ySegments: yS,
			ySize: 1024,
		});

		scene.add(terrain);

		console.log(scene);

		animate();
	});

	onDestroy(() => {
		cancelAnimationFrame(animationPointer);
	});

	function initScene() {
		const sceneWidth = document.documentElement.clientWidth;
		const sceneHeight = document.documentElement.clientHeight;

		scene = new THREE.Scene();

		scene.add(new THREE.AxesHelper(5));

		camera = new THREE.PerspectiveCamera(
			75,
			sceneWidth / sceneHeight,
			0.01,
			2000
		);

		camera.position.set(0, 1000, 1000);

		camera.updateProjectionMatrix(); // update the camera's projection matrix

		// env light
		scene.add(new THREE.AmbientLight(0xffffff, 0.5));

		// mimic the sun light. maybe update light position later
		light = new THREE.PointLight(0xffffff, 0.5);
		light.position.set(0, 10, -5);
		light.castShadow = true;
		// light.shadow.mapSize.width = 2048;
		// light.shadow.mapSize.height = 2048;
		scene.add(light);

		renderer = new THREE.WebGLRenderer({
			canvas: canvas,
			alpha: true,
			antialias: true,
		});

		renderer.shadowMap.enabled = true;
		renderer.shadowMap.type = THREE.BasicShadowMap; //THREE.PCFSoftShadowMap;
		renderer.toneMappingExposure = 0.5;

		controls = new OrbitControls(camera, canvas);

		renderer.setSize(sceneWidth, sceneHeight);
	}

	function animate() {
		controls.update();
		renderer.render(scene, camera);

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
