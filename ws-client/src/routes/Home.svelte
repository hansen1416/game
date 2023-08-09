<script>
	import { onDestroy, onMount } from "svelte";

	let socket;
	let imgUrl;
	let animationPointer;
	let counter = 0;
	let runAnimation = true;

	onMount(() => {
		// create a new WebSocket object
		socket = new WebSocket(
			"ws://" + import.meta.env.VITE_SERVER_HOST + ":5174"
		);

		// handle the open event
		socket.addEventListener("open", function (event) {
			console.log("WebSocket connection established");
			animate();
		});

		// handle the message event
		socket.addEventListener("message", function (event) {
			imgUrl = "data:image/png;base64," + event.data;
		});

		// handle the close event
		socket.addEventListener("close", function (event) {
			console.log("WebSocket connection closed");
		});

		// handle the error event
		socket.addEventListener("error", function (event) {
			console.error("WebSocket error:", event);
		});
	});

	onDestroy(() => {
		cancelAnimationFrame(animationPointer);

		if (socket) {
			socket.close();
		}
	});

	function animate() {
		// update other players except main player
		if (runAnimation) {
			if (counter % 60 === 0) {
				socket.send("render");
			}

			counter += 1;
		}
		animationPointer = requestAnimationFrame(animate);
	}

	// send a message to the server
	function sendmsg() {
		socket.send("render");
	}
</script>

<div class="bg">
	<img src={imgUrl} alt="name" />
	<div class="control">
		<button
			on:click={() => {
				runAnimation = !runAnimation;
			}}>{runAnimation ? "Stop" : "Run"}</button
		>
	</div>
</div>

<style>
	.bg {
		height: 100vh;
		background-color: #000;
	}

	img {
		width: 640px;
		height: 400px;
	}

	.control {
		position: absolute;
		top: 30%;
		right: 0;
	}
</style>
