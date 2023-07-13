const THREETerrain = require("./lib/THREETerrain");
const THREE = require("three");

const express = require("express");
const cors = require('cors')


const app = express();

// var corsOptions = {
// 	origin: 'http://example.com',
// 	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
//   }

app.use(cors())


app.get("/terrain", (req, res) => {

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

	res.json(json_data);
});

const port = process.env.PORT || 4096;
app.listen(port, () => {
	console.log(`API server listening on port ${port}`);
});

// nodemon --watch server --ext ts --exec ts-node --ignore '*.test.ts' --delay 3 server/server.ts
