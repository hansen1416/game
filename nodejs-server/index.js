const THREETerrain = require("./THREETerrain");
const THREE = require("three");
const express = require("express");
const { aaa } = require("./lib/a");

const app = express();

const segments = 127;
const size = 4096;

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

app.get("/", (req, res) => {
	const posts = aaa();
	res.json(posts);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
	console.log(`API server listening on port ${port}`);
});

// nodemon --watch server --ext ts --exec ts-node --ignore '*.test.ts' --delay 3 server/server.ts
