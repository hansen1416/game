<script>
	import { onDestroy, onMount } from "svelte";
	import * as THREE from "three"; // @ts-ignore
	import { cloneDeep } from "lodash";
	import { GROUND_LEVEL, FLOOR_WIDTH, PLAYER_Z } from "../utils/constants";
	import {
		ballMesh,
		createPoseLandmarker,
		loadGLTF,
		invokeCamera,
	} from "../utils/ropes";
	import ThreeScene from "../lib/ThreeScene";
	import CannonWorld from "../lib/CannonWorld";
	import StageBuilder from "../lib/StageBuilder";
	import ItemsManager from "../lib/ItemsManager";
	import PlayerController from "../lib/PlayerController";
	import Toss from "../lib/Toss";

	import CannonDebugger from "cannon-es-debugger";

	/**
	 * what do I need?
	 *
	 * class to build the scene, add objects
	 * 		this class will need ThreeScene and CannonWorld
	 * 		how does it handle moving object?
	 *
	 * class to map the joints to character rotations, only uppder body
	 * 		this class take model bones and pose3d as parameter
	 *
	 * class to record and watch a series of joints positions, only hands for now
	 * 		this class take pose3d as pamameter
	 * 		it determine toss and running
	 * 		how to pass the result to character and world?
	 *
	 * class to watch the pose, do running, defend and toss
	 * 		this class take model bones and pose3d as parameter
	 * 		how does it pass result to world?
	 *
	 *
	 * Factory Pattern:
	 * Use the factory pattern to create instances of game objects, such as items and characters.
	 * This will allow you to easily create new instances with different configurations without having to modify the constructor functions.
	 *
	 * Singleton Pattern:
	 * If you have any components that should only have a single instance throughout the game,
	 * such as a game manager or a resource manager,
	 * use the singleton pattern to ensure that only one instance is created.
	 *
	 * Observer Pattern:
	 * Use the observer pattern to handle user pose events and interactions between the player's model and the objects in the 3D scene.
	 * This pattern allows you to decouple the event source (user pose) from the event listeners (player's model and game objects),
	 * making it easier to add, remove,
	 * or modify event listeners without affecting the event source.
	 *
	 * use Observer for Architect
	 */

	let debug;

	/** @type {ThreeScene} */
	let threeScene;
	/** @type {CannonWorld} */
	let cannonWorld;
	/** @type {ItemsManager} */
	let itemsManager;
	/** @type {PlayerController} */
	let playerController;

	let video, canvas;

	let cameraReady = false,
		mannequinReady = false,
		modelReady = false;

	let poseDetector, poseDetectorAvailable;

	let runAnimation = true,
		showVideo = false,
		animationPointer;

	let handsWaitingLeft = false,
		handsAvailableLeft = false;
	let handsWaitingRight = false,
		handsAvailableRight = false;

	const sceneWidth = document.documentElement.clientWidth;
	const sceneHeight = document.documentElement.clientHeight;

	onMount(() => {
		threeScene = new ThreeScene(canvas, sceneWidth, sceneHeight);

		cannonWorld = new CannonWorld();

		new StageBuilder(threeScene, cannonWorld).addGround().build();

		itemsManager = new ItemsManager(threeScene, cannonWorld);

		itemsManager.spreadItems();

		playerController = new PlayerController(threeScene, cannonWorld);

		if (import.meta.env.DEV) {
			debug = CannonDebugger(threeScene.scene, cannonWorld.world);
		}

		if (true) {
			invokeCamera(video, () => {
				cameraReady = true;
			});

			createPoseLandmarker().then((pose) => {
				poseDetector = pose;

				poseDetectorAvailable = true;
			});
		}

		Promise.all([
			loadGLTF("/glb/dors.glb"),
			loadGLTF("/glb/daneel.glb"),
			// loadGLTF(process.env.PUBLIC_URL + "/glb/monster.glb"),
		]).then(([dors, daneel]) => {
			// player1
			playerController.addPlayer(
				dors.scene.children[0],
				{
					x: 0,
					y: GROUND_LEVEL,
					z: 0,
				},
				{ x: 0, y: 0, z: 0 },
				true
			);

			// player2
			playerController.addPlayer(
				daneel.scene.children[0],
				{
					x: 0,
					y: GROUND_LEVEL,
					z: -PLAYER_Z,
				},
				{
					x: 0,
					y: -Math.PI,
					z: 0,
				}
			);

			// assign speed to another player
			// playerController.players[0].speed = new THREE.Vector3(0.01, 0, -0.1)

			// all models ready
			cameraReady = true;
			mannequinReady = true;
			modelReady = true;
			// hand is ready for ball mesh
			handsWaitingLeft = true;
			handsAvailableLeft = true;
			handsWaitingRight = true;
			handsAvailableRight = true;
		});
	});

	onDestroy(() => {
		cancelAnimationFrame(animationPointer);

		playerController.destructor();
	});

	// when mannequin, model and camera are erady, start animation loop
	$: if (cameraReady && mannequinReady && modelReady) {
		animate();
	}

	function animate() {
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

		threeScene.onFrameUpdate();

		cannonWorld.onFrameUpdate();

		playerController.onFrameUpdate();

		if (debug) {
			debug.update();
		}
		/**
		if (handsWaitingLeft) {
			if (handsEmptyCounterLeft < handsWaitingThreshold) {
				handsEmptyCounterLeft += 1;
			} else {
				handsAvailableLeft = true;
				handsEmptyCounterLeft = 0;
			}
		}

		if (handsWaitingRight) {
			if (handsEmptyCounterRight < handsWaitingThreshold) {
				handsEmptyCounterRight += 1;
			} else {
				handsAvailableRight = true;
				handsEmptyCounterRight = 0;
			}
		}

		if (handsAvailableLeft) {
			// todo add ball to hand

			handBallMeshLeft = ballMesh();

			// console.log("add ball", handBallMeshLeft, player1Bones);

			const tmpvec = new THREE.Vector3();

			player1Bones.LeftHand.getWorldPosition(tmpvec);

			// @ts-ignore
			handBallMeshLeft.position.copy(tmpvec);

			threeScene.scene.add(handBallMeshLeft);

			handsAvailableLeft = false;
			handsWaitingLeft = false;
		}

		if (handsAvailableRight) {
			// todo add ball to hand

			handBallMeshRight = ballMesh();

			const tmpvec = new THREE.Vector3();

			player1Bones.RightHand.getWorldPosition(tmpvec);

			// @ts-ignore
			handBallMeshRight.position.copy(tmpvec);

			threeScene.scene.add(handBallMeshRight);

			handsAvailableRight = false;
			handsWaitingRight = false;
		}
*/
		animationPointer = requestAnimationFrame(animate);
	}

	function onPoseCallback(result) {
		if (!result || !result.worldLandmarks || !result.worldLandmarks[0]) {
			poseDetectorAvailable = true;
			return;
		}

		const pose3D = cloneDeep(result.worldLandmarks[0]);
		const pose2D = cloneDeep(result.landmarks[0]);

		// data_recorder.addBack({ data: pose3D, t: performance.now() });

		// if (data_recorder.size() > 30) {
		// 	data_recorder.removeFront();
		// }

		// if (data_recorder.size() === 30) {
		// 	big_obj.push(data_recorder.toArray());
		// }

		// const width_ratio = 30;
		// const height_ratio = (width_ratio * 480) / 640;

		// // multiply x,y by differnt factor
		// for (let v of pose3D) {
		// 	v["x"] *= width_ratio;
		// 	v["y"] *= -height_ratio;
		// 	v["z"] *= -width_ratio;
		// }

		// todo set speed
		// change player state based on the pose
		// do toss based on the player's pose
		// where to store the mainplayer's pose cache?
		// and how to send the toss to items manager? probably through gamemedia
		// maybe also need callback on the items when collide

		playerController.playerMainPose2Bone(pose3D, pose2D, false);

		/**
			poseToRotation.applyPoseToBone(pose3D, true);

			// move the position of model
			const pose2D = cloneDeep(result.landmarks[0]);

			const to_pos = poseToRotation.applyPosition(pose2D, FLOOR_WIDTH);

			if (to_pos) {
				player1.position.set(to_pos.x, GROUND_LEVEL, PLAYER_Z);
			}

			toss.getHandsPos(player1Bones);

			if (handsWaitingLeft === false && handBallMeshLeft) {
				const velocity = toss.calculateAngularVelocity(
					player1Bones,
					true,
					speed_threshold
				);
				// console.log("velocity", velocity);
				if (velocity) {
					// making ball move

					// cannonWorld.project(handBallMeshLeft, velocity);

					handsWaitingLeft = true;
					handBallMeshLeft = null;
				} else {
					// let the ball move with hand

					const tmpvec = new THREE.Vector3();

					player1Bones.LeftHand.getWorldPosition(tmpvec);

					handBallMeshLeft.position.copy(tmpvec);
				}
			}

			if (handsWaitingRight === false && handBallMeshRight) {
				const velocity = toss.calculateAngularVelocity(
					player1Bones,
					false,
					speed_threshold
				);
				// console.log("velocity", velocity);
				if (velocity) {
					// making ball move

					// cannonWorld.project(handBallMeshRight, velocity);

					handsWaitingRight = true;
					handBallMeshRight = null;
				} else {
					// let the ball move with hand

					const tmpvec = new THREE.Vector3();

					player1Bones.RightHand.getWorldPosition(tmpvec);

					handBallMeshRight.position.copy(tmpvec);
				}
			}
*/

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
		background-color: #0f2027;
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
