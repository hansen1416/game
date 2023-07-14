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

function getEdges(positions) {
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

/**
 *
 * @param {*} terrain1
 * @param {*} terrain2
 * @param {string} direction1 indicate `terrain2` is at `direction1` side of `terrain1`
 * @param {string} direction2 indicate `terrain1` is at `direction1` side of `terrain2`
 */
function mergeTerrain(terrain1, terrain2, direction1, direction2) {
	const edge1 = getEdges(terrain1.position)[direction1];
	const edge2 = getEdges(terrain2.position)[direction2];

	// console.log(edge1, edge2);

	const positions1 = terrain1.position;
	const positions2 = terrain2.position;

	const depth = 8;

	if (direction1 === "west") {
		const edge = {};

		for (let k in edge1) {
			edge[k] = new THREE.Vector3(
				edge1[k].x,
				edge1[k].y,
				(edge1[k].z + edge2[~~-edge1[k].x + ":" + ~~edge1[k].y].z) / 2
			);
		}

		for (let i = 0; i < positions1.length; i += 3) {
			for (let j = depth; j >= 0; j--) {
				const key =
					~~(positions1[i] - (1024 / 63) * j) +
					":" +
					~~positions1[i + 1];

				if (edge[key]) {
					positions1[i + 2] +=
						((edge[key].z - positions1[i + 2]) * (depth - j)) /
						depth;

					break;
				}
			}
		}

		for (let i = 0; i < positions2.length; i += 3) {
			for (let j = depth; j >= 0; j--) {
				const key =
					~~(-positions2[i] - (1024 / 63) * j) +
					":" +
					~~positions2[i + 1];

				if (edge[key]) {
					positions2[i + 2] +=
						((edge[key].z - positions2[i + 2]) * (depth - j)) /
						depth;

					break;
				}
			}
		}
	}
}

app.get("/terrain", (req, res) => {
	const terrain1 = generateTerrain();

	const terrain2 = generateTerrain();

	mergeTerrain(terrain1, terrain2, "west", "east");

	res.json([terrain1, terrain2]);
});

const port = process.env.PORT || 4096;
app.listen(port, () => {
	console.log(`API server listening on port ${port}`);
});

// nodemon --watch server --ext ts --exec ts-node --ignore '*.test.ts' --delay 3 server/server.ts
