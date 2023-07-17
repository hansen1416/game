/**
 * @typedef {{width: number, height: number, widthSegments: number, heightSegments: number, position: number[]}} TerrainStruct
 */

const THREE = require("three");
const THREETerrain = require("./THREETerrain");
const fs = require("fs");
const path = require("path");

class TerrainFactory {
	#terrain_path = path.join(__dirname, "../terrain/");

	constructor() {}

	/**
	 * pad number with leading zeros, to length 8
	 */
	#pad = (num) => {
		return ("00000000" + num).slice(-8);
	};

	/**
	 * check if two float are close enough
	 */
	#isCloseEnough = (a, b) => {
		return Math.abs(a - b) < 0.0001;
	};

	/**
	 *
	 * @param {Array[]} edge1
	 * @param {Array[]} edge2
	 * @returns
	 */
	#areEdgesMerged(edge1, edge2, edge_name1) {
		let merged = true;

		for (let k in edge1) {
			if (edge_name1 === "west" || edge_name1 === "east") {
				if (
					this.#isCloseEnough(
						edge1[k].z,
						edge2[this.#edgeKey(-edge1[k].x, edge1[k].y)].z
					)
				) {
					merged = false;
					break;
				}
			} else if (edge_name1 === "north" || edge_name1 === "south") {
				if (
					this.#isCloseEnough(
						edge1[k].z,
						edge2[this.#edgeKey(edge1[k].x, -edge1[k].y)].z
					)
				) {
					merged = false;
					break;
				}
			}
		}

		return merged;
	}

	#getTerrainNameByIndices(x, y) {
		return this.#pad(x) + "-" + this.#pad(y) + ".json";
	}

	#edgeKey(x_float, y_float) {
		return ~~x_float + ":" + ~~y_float;
	}

	#getEdges(positions) {
		const pos_vec = [];

		for (let i = 0; i < positions.length; i += 3) {
			// 1d array to vectors
			pos_vec.push(
				new THREE.Vector3(
					positions[i],
					positions[i + 1],
					positions[i + 2]
				)
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
				north[this.#edgeKey(vec.x, vec.y)] = pos_vec[i];
			}

			if (vec.x === 512) {
				east[this.#edgeKey(vec.x, vec.y)] = pos_vec[i];
			}

			if (vec.y === -512) {
				south[this.#edgeKey(vec.x, vec.y)] = pos_vec[i];
			}

			if (vec.x === -512) {
				west[this.#edgeKey(vec.x, vec.y)] = pos_vec[i];
			}
		}

		return {
			north,
			east,
			south,
			west,
		};
	}

	generateTerrain() {
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
			position: Array.from(
				terrain.geometry.getAttribute("position").array
			),
			uv: Array.from(terrain.geometry.getAttribute("uv").array),
		};

		return json_data;
	}

	/**
	 *
	 * @param {*} terrain1
	 * @param {*} terrain2
	 * @param {string} edge_name1 indicate `terrain2` is at `direction1` side of `terrain1`
	 */
	mergeTerrain(terrain1, terrain2, edge_name1) {
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

		const edge1 = this.#getEdges(terrain1.position)[edge_name1];
		const edge2 = this.#getEdges(terrain2.position)[edge_name2];

		if (this.#areEdgesMerged(edge1, edge2)) {
			// console.log("edges are not merged");
			return;
		}

		// console.log(edge1, edge2);

		const positions1 = terrain1.position;
		const positions2 = terrain2.position;

		const spread = 8;
		const step = 1024 / 63;

		const edge = {};

		for (let k in edge1) {
			let z;

			if (edge_name1 === "west" || edge_name1 === "east") {
				z =
					(edge1[k].z +
						edge2[this.#edgeKey(-edge1[k].x, edge1[k].y)].z) /
					2;
			} else if (edge_name1 === "north" || edge_name1 === "south") {
				z =
					(edge1[k].z +
						edge2[this.#edgeKey(edge1[k].x, -edge1[k].y)].z) /
					2;
			}

			edge[k] = new THREE.Vector3(edge1[k].x, edge1[k].y, z);
		}

		for (let i = 0; i < positions1.length; i += 3) {
			for (let j = spread; j >= 0; j--) {
				let pos1_key;
				let pos2_key;

				if (edge_name1 === "west") {
					pos1_key = this.#edgeKey(
						positions1[i] - step * j,
						positions1[i + 1]
					);

					pos2_key = this.#edgeKey(
						-positions2[i] - step * j,
						positions2[i + 1]
					);
				} else if (edge_name1 === "north") {
					pos1_key = this.#edgeKey(
						positions1[i],
						positions1[i + 1] + step * j
					);

					pos2_key = this.#edgeKey(
						positions2[i],
						-positions2[i + 1] + step * j
					);
				} else if (edge_name1 === "east") {
					pos1_key = this.#edgeKey(
						positions1[i] + step * j,
						positions1[i + 1]
					);

					pos2_key = this.#edgeKey(
						-positions2[i] + step * j,
						positions2[i + 1]
					);
				} else if (edge_name1 === "south") {
					pos1_key = this.#edgeKey(
						positions1[i],
						positions1[i + 1] - step * j
					);

					pos2_key = this.#edgeKey(
						positions2[i],
						-positions2[i + 1] - step * j
					);
				}

				if (edge[pos1_key]) {
					positions1[i + 2] +=
						((edge[pos1_key].z - positions1[i + 2]) *
							(spread - j)) /
						spread;
				}

				if (edge[pos2_key]) {
					positions2[i + 2] +=
						((edge[pos2_key].z - positions2[i + 2]) *
							(spread - j)) /
						spread;
				}
			}
		}
	}

	/**
	 * check if a terrain file exists
	 *
	 * @param {number} x
	 * @param {number} z
	 */
	#terrainExists(x, z) {
		const terrain_name = this.#getTerrainNameByIndices(x, z);

		return fs.existsSync(this.#terrain_path + terrain_name);
	}

	/**
	 * read a terrain file
	 *
	 * @param {number} x
	 * @param {number} z
	 * @returns {object}
	 */
	#readTerrain(x, z) {
		const terrain_name = this.#getTerrainNameByIndices(x, z);

		if (this.#terrainExists(x, z)) {
			return JSON.parse(
				fs.readFileSync(this.#terrain_path + terrain_name)
			);
		}
	}

	/**
	 * save a terrain file
	 *
	 * @param {number} x
	 * @param {number} z
	 * @param {TerrainStruct} terrain
	 */
	#saveTerrain(x, z, terrain) {
		const terrain_name = this.#getTerrainNameByIndices(x, z);

		fs.writeFileSync(
			this.#terrain_path + terrain_name,
			JSON.stringify(terrain)
		);
	}

	/**
	 * check the surrronding terrains, and merge them if they exist
	 */
	mergeSurroundingTerrains(x, z) {
		const terrain = this.#readTerrain(x, z);

		const west_terrain = this.#readTerrain(x - 1, z);
		const north_terrain = this.#readTerrain(x, z - 1);
		const east_terrain = this.#readTerrain(x + 1, z);
		const south_terrain = this.#readTerrain(x, z + 1);

		if (west_terrain) {
			this.mergeTerrain(terrain, west_terrain, "west");
			this.#saveTerrain(x - 1, z, west_terrain);
		}

		if (north_terrain) {
			this.mergeTerrain(terrain, north_terrain, "north");
			this.#saveTerrain(x, z - 1, north_terrain);
		}

		if (east_terrain) {
			this.mergeTerrain(terrain, east_terrain, "east");
			this.#saveTerrain(x + 1, z, east_terrain);
		}

		if (south_terrain) {
			this.mergeTerrain(terrain, south_terrain, "south");
			this.#saveTerrain(x, z + 1, south_terrain);
		}

		this.#saveTerrain(x, z, terrain);
	}

	// stitchTerrain() {
	// 	let student = {
	// 		name: "Mike",
	// 		age: 23,
	// 		gender: "Male",
	// 		department: "English",
	// 		car: "Honda",
	// 	};

	// 	let data = JSON.stringify(student);
	// 	fs.writeFileSync("student-2.json", data);
	// }

	/**
	 * going from the center, in a spiral manner, going out to a given radius
	 */
	iterateTerrain(radius) {
		let x = 0;
		let y = 0;

		let dx = 0;
		let dy = -1;

		for (let i = 0; i < radius ** 2; i++) {
			if (
				-radius / 2 <= x &&
				x <= radius / 2 &&
				-radius / 2 <= y &&
				y <= radius / 2
			) {
				const terrain = this.generateTerrain();
				this.#saveTerrain(x, y, terrain);

				this.mergeSurroundingTerrains(x, y);
			}

			if (x === y || (x < 0 && x === -y) || (x > 0 && x === 1 - y)) {
				[dx, dy] = [-dy, dx];
			}

			[x, y] = [x + dx, y + dy];
		}
	}

	fetchTerrain(x, z) {
		const terrain_name = this.#getTerrainNameByIndices(x, z);

		return JSON.parse(fs.readFileSync(this.#terrain_path + terrain_name));
	}
}


module.exports = TerrainFactory
