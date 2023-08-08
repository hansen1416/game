<script>
	import { onDestroy, onMount } from "svelte";

	let socket;
	let imgUrl;

	onMount(() => {
		// create a new WebSocket object
		socket = new WebSocket("ws://47.245.125.244:5174");

		// handle the open event
		socket.addEventListener("open", function (event) {
			console.log("WebSocket connection established");
			// send a message to the server
			socket.send("Hello, server!");
		});

		// handle the message event
		socket.addEventListener("message", function (event) {
			// console.log("Message from server:", event.data);

            imgUrl = "data:image/png;base64," + event.data;
            console.log(imgUrl);
// console.log(event.data)
			// const imgData = atob(event.data);
			// const imgArray = new Uint8Array(imgData.length);
			// for (let i = 0; i < imgData.length; i++) {
			// 	imgArray[i] = imgData.charCodeAt(i);
			// }

			// // Create a Blob object from the byte array
			// const imgBlob = new Blob([imgArray], { type: "image/png" });

			// // Create a URL for the Blob object
			// imgUrl = URL.createObjectURL(imgBlob);

			// // Create an img element and set its src attribute to the URL
			// const imgElement = document.createElement("img");
			// imgElement.src = imgUrl;
			// console.log(imgElement);
			// // Add the img element to the document
			// document.body.appendChild(imgElement);
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
		if (socket) {
			socket.close();
		}
	});

	// send a message to the server
	function sendmsg() {
		socket.send("render");
	}
</script>

<div class="bg">
	<img src={imgUrl} alt="name" />
	<div class="control">
		<button on:click={sendmsg}>Send</button>
	</div>
</div>

<style>
	.bg {
		height: 100vh;
        background-color: #000;
	}

    img {
        width: 320px;
        height: 200px;
    }

	.control {
		position: absolute;
		top: 30%;
		right: 0;
	}
</style>
