<script>
	import { onDestroy, onMount } from "svelte";
	// @ts-ignore
	import { cloneDeep } from "lodash";
	import {
		createPoseLandmarker,
		loadGLTF,
		invokeCamera,
	} from "../utils/ropes";
	import ThreeScene from "../lib/ThreeScene";
	import BoxerController from "../lib/BoxerController";

	/** @type {ThreeScene} */
	let threeScene;

	let video, canvas;

	let cameraReady = false,
		assetReady = false;

	let boxerController;

	let poseDetector, poseDetectorAvailable;

	let runAnimation = false,
		showVideo = false,
		animationPointer;

	const sceneWidth = document.documentElement.clientWidth;
	const sceneHeight = document.documentElement.clientHeight;

	onMount(() => {
		if (true) {
			invokeCamera(video, () => {
				cameraReady = true;
			});

			createPoseLandmarker().then((pose) => {
				poseDetector = pose;

				poseDetectorAvailable = true;
			});
		} else {
			cameraReady = true;
		}

		threeScene = new ThreeScene(canvas, sceneWidth, sceneHeight);
		/** @ts-ignore */
		// threeScene.camera.position.set(0, 2000, 2000);

		Promise.all([loadGLTF("/glb/dors.glb")]).then(([dors]) => {
			boxerController = new BoxerController(threeScene);

			boxerController.addPlayer(dors.scene.children[0]);

			assetReady = true;
		});
	});

	onDestroy(() => {
		cancelAnimationFrame(animationPointer);
	});

	// when mannequin, model and camera are erady, start animation loop
	$: if (cameraReady && assetReady) {
		animate();
		// set player pos, camera pos, control target
		// we need the animation to update at least once to let raycasting work
		// playerController.initPLayerPos({ x: 0, z: 0 });
	}

	function animate() {
		// update  threejs renderer

		threeScene.onFrameUpdate();

		// ========= captured pose logic
		if (
			runAnimation &&
			video &&
			video.readyState >= 2 &&
			poseDetectorAvailable &&
			poseDetector
		) {
			poseDetectorAvailable = false;
			poseDetector.detectForVideo(
				video,
				performance.now(),
				onPoseCallback
			);
		}

		animationPointer = requestAnimationFrame(animate);
	}

	function onPoseCallback(result) {
		if (!result || !result.worldLandmarks || !result.worldLandmarks[0]) {
			poseDetectorAvailable = true;
			return;
		}

		const pose3D = cloneDeep(result.worldLandmarks[0]);
		const pose2D = cloneDeep(result.landmarks[0]);

		boxerController.onPoseCallback(pose3D, pose2D, false);

		poseDetectorAvailable = true;
	}
</script>

<div class="bg">
	<video
		bind:this={video}
		autoPlay={true}
		width={480 / 2}
		height={360 / 2}
		style="position: absolute; top:0; left: 0; display: {showVideo
			? 'block'
			: 'none'}"
	>
		<track label="English" kind="captions" default />
	</video>

	<canvas bind:this={canvas} />

	<div class="controls">
		<div>
			<button
				on:click={() => {
					threeScene.resetControl();
				}}>Reset Control</button
			>

			{#if showVideo}
				<button
					on:click={() => {
						showVideo = !showVideo;
					}}>hide video</button
				>
			{:else}
				<button
					on:click={() => {
						showVideo = !showVideo;
					}}>show video</button
				>
			{/if}

			{#if runAnimation}
				<button
					on:click={() => {
						runAnimation = !runAnimation;

						// console.log(big_obj);
					}}>Pause</button
				>
			{:else}
				<button
					on:click={() => {
						runAnimation = !runAnimation;
					}}>Run</button
				>
			{/if}
		</div>
	</div>
</div>

<style>
	.bg {
		background-color: #005c97;
	}

	.controls {
		position: absolute;
		bottom: 10px;
		right: 10px;
	}

	.controls button {
		padding: 2px 4px;
		font-size: 18px;
		text-transform: capitalize;
	}
</style>
