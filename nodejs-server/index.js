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

function edgeKey(x_float, y_float) {
	return ~~x_float + ":" + ~~y_float;
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
			north[edgeKey(vec.x, vec.y)] = pos_vec[i];
		}

		if (vec.x === 512) {
			east[edgeKey(vec.x, vec.y)] = pos_vec[i];
		}

		if (vec.y === -512) {
			south[edgeKey(vec.x, vec.y)] = pos_vec[i];
		}

		if (vec.x === -512) {
			west[edgeKey(vec.x, vec.y)] = pos_vec[i];
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
 * @param {string} edge_name1 indicate `terrain2` is at `direction1` side of `terrain1`
 */
function mergeTerrain(terrain1, terrain2, edge_name1) {
	let edge_name2;

	if (edge_name1 === "west") {
		edge_name2 = "east";
	} else if (edge_name1 === "north") {
		edge_name2 = "south";
	} else if (edge_name1 === "east") {
		edge_name2 = "west";
	} else if (edge_name1 === "south") {
		edge_name2 = "north";
	}

	const edge1 = getEdges(terrain1.position)[edge_name1];
	const edge2 = getEdges(terrain2.position)[edge_name2];

	// console.log(edge1, edge2);

	const positions1 = terrain1.position;
	const positions2 = terrain2.position;

	const spread = 8;
	const step = 1024 / 63;

	const edge = {};

	for (let k in edge1) {
		let z;

		if (edge_name1 === "west" || edge_name1 === "east") {
			z = (edge1[k].z + edge2[edgeKey(-edge1[k].x, edge1[k].y)].z) / 2;
		} else if (edge_name1 === "north" || edge_name1 === "south") {
			z = (edge1[k].z + edge2[edgeKey(edge1[k].x, -edge1[k].y)].z) / 2;
		}

		edge[k] = new THREE.Vector3(edge1[k].x, edge1[k].y, z);
	}

	for (let i = 0; i < positions1.length; i += 3) {
		for (let j = spread; j >= 0; j--) {
			let pos1_key;
			let pos2_key;

			if (edge_name1 === "west") {
				pos1_key = edgeKey(positions1[i] - step * j, positions1[i + 1]);

				pos2_key = edgeKey(
					-positions2[i] - step * j,
					positions2[i + 1]
				);
			} else if (edge_name1 === "north") {
				pos1_key = edgeKey(positions1[i], positions1[i + 1] + step * j);

				pos2_key = edgeKey(
					positions2[i],
					-positions2[i + 1] + step * j
				);
			} else if (edge_name1 === "east") {
				pos1_key = edgeKey(positions1[i] + step * j, positions1[i + 1]);

				pos2_key = edgeKey(
					-positions2[i] + step * j,
					positions2[i + 1]
				);
			} else if (edge_name1 === "south") {
				pos1_key = edgeKey(positions1[i], positions1[i + 1] - step * j);

				pos2_key = edgeKey(
					positions2[i],
					-positions2[i + 1] - step * j
				);
			}

			if (edge[pos1_key]) {
				positions1[i + 2] +=
					((edge[pos1_key].z - positions1[i + 2]) * (spread - j)) /
					spread;
			}

			if (edge[pos2_key]) {
				positions2[i + 2] +=
					((edge[pos2_key].z - positions2[i + 2]) * (spread - j)) /
					spread;
			}
		}
	}
}

app.get("/terrain", (req, res) => {
	const terrain1 = generateTerrain();

	const terrain2 = generateTerrain();

	// mergeTerrain(terrain1, terrain2, "west");
	// mergeTerrain(terrain1, terrain2, "north");
	// mergeTerrain(terrain1, terrain2, "east");
	mergeTerrain(terrain1, terrain2, "south");

	res.json([terrain1, terrain2]);
});

const port = process.env.PORT || 4096;
app.listen(port, () => {
	console.log(`API server listening on port ${port}`);
});

// nodemon --watch server --ext ts --exec ts-node --ignore '*.test.ts' --delay 3 server/server.ts
