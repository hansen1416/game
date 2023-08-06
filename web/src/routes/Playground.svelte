<script>
	import { onDestroy, onMount } from "svelte";

	let socket;

	onMount(() => {
		socket = new WebSocket("ws://localhost:7890/");

		socket.addEventListener("open", function (event) {
			console.log("Connection opened");
			socket.send("Hello, server! I'm from browser!");
		});

		socket.addEventListener("message", function (event) {
			console.log("Received message:", event.data);
		});

		socket.addEventListener("close", function (event) {
			console.log("Connection closed");
		});
	});

	onDestroy(() => {
		socket.close();
	});
</script>

<div class="bg" />

<style>
	.bg {
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		background-color: #000000;
	}
</style>
