const THREETerrain = require("./lib/THREETerrain");
const THREE = require("three");

const express = require("express");
const cors = require("cors");

const app = express();

// var corsOptions = {
// 	origin: 'http://example.com',
// 	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
//   }

app.use(cors());

function generateTerrain() {
	const segments = 63;
	const size = 1024;

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
		position: Array.from(terrain.geometry.getAttribute("position").array),
		uv: Array.from(terrain.geometry.getAttribute("uv").array),
	};

	return json_data;
}

function getEdgeHeight(positions) {
	const pos_vec = [];

	for (let i = 0; i < positions.length; i += 3) {
		// 1d array to vectors
		pos_vec.push(
			new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2])
		);
	}
	// the first point is at top left corner for Rapier heightfiled, and colmun major
	pos_vec.sort((a, b) => {
		return a.x - b.x || b.y - a.y;
	});

	const north = {};
	const east = {};
	const south = {};
	const west = {};

	for (let i = 0; i < pos_vec.length; i++) {
		const vec = pos_vec[i];

		if (vec.y === 512) {
			north[~~vec.x + ":" + ~~vec.y] = pos_vec[i];
		}

		if (vec.x === 512) {
			east[~~vec.x + ":" + ~~vec.y] = pos_vec[i];
		}

		if (vec.y === -512) {
			south[~~vec.x + ":" + ~~vec.y] = pos_vec[i];
		}

		if (vec.x === -512) {
			west[~~vec.x + ":" + ~~vec.y] = pos_vec[i];
		}
	}

	return {
		north,
		east,
		south,
		west,
	};
}

function isClose(a, b) {
	return a - b < 0.01;
}

/**
 *
 * @param {*} terrain_1
 * @param {*} terrain_2
 * @param {string} direction indicate `terrain_2` is at which direction of `terrain_1`
 */
function mergeTerrain(terrain_1, terrain_2, direction) {
	const edge = getEdgeHeight(terrain_1.position)[direction];

	const positions = terrain_2.position;

	if (direction === "west") {
		for (let i = 0; i < positions.length; i += 3) {
			const key = ~~-positions[i] + ":" + ~~positions[i + 1];

			if (edge[key]) {
				positions[i + 2] = edge[key].z;
			}
		}
	}
}

app.get("/terrain", (req, res) => {
	const terrain_1 = generateTerrain();

	const terrain_2 = generateTerrain();

	mergeTerrain(terrain_1, terrain_2, "west");

	res.json([terrain_1, terrain_2]);
});

const port = process.env.PORT || 4096;
app.listen(port, () => {
	console.log(`API server listening on port ${port}`);
});

// nodemon --watch server --ext ts --exec ts-node --ignore '*.test.ts' --delay 3 server/server.ts
