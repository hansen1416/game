/**
 * @typedef {{width: number, height: number, widthSegments: number, heightSegments: number, position: number[]}} TerrainStruct
 */

const THREE = require("three");
const THREETerrain = require("./THREETerrain");
const fs = require("fs");
const path = require("path");

class TerrainFactory {
	#terrain_path = path.join(__dirname, "../assets/terrain/");

	constructor() {}

	/**
	 * pad number with leading zeros, to length 8
	 */
	#pad = (num) => {
		return ("xxxxxxxx" + num).slice(-8);
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
					!this.#isCloseEnough(
						edge1[k].z,
						edge2[this.#edgeKey(-edge1[k].x, edge1[k].y)].z
					)
				) {
					merged = false;
					break;
				}
			} else if (edge_name1 === "north" || edge_name1 === "south") {
				if (
					!this.#isCloseEnough(
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
	 * @param {string} edge_name1 indicate `terrain2` is at `edge_name1` side of `terrain1`
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

		if (this.#areEdgesMerged(edge1, edge2, edge_name1)) {
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
				let pos1_x;
				let pos1_y;

				if (edge_name1 === "west") {
					pos1_x = positions1[i] - step * j;
					pos1_y = positions1[i + 1];
				} else if (edge_name1 === "north") {
					pos1_x = positions1[i];
					pos1_y = positions1[i + 1] + step * j;
				} else if (edge_name1 === "east") {
					pos1_x = positions1[i] + step * j;
					pos1_y = positions1[i + 1];
				} else if (edge_name1 === "south") {
					pos1_x = positions1[i];
					pos1_y = positions1[i + 1] - step * j;
				}

				const pos1_key = this.#edgeKey(pos1_x, pos1_y);

				if (edge[pos1_key]) {
					if (edge_name1 === "west" || edge_name1 === "east") {
						if (
							Math.abs(positions1[i]) <
								Math.abs(positions1[i + 1]) &&
							Math.abs(positions1[i + 1]) >= 512 - step * spread
						) {
							continue;
						}
					} else if (
						edge_name1 === "north" ||
						edge_name1 === "south"
					) {
						if (
							Math.abs(positions1[i]) >= 512 - step * spread &&
							Math.abs(positions1[i + 1]) <
								Math.abs(positions1[i])
						) {
							continue;
						}
					}

					positions1[i + 2] +=
						((edge[pos1_key].z - positions1[i + 2]) *
							(spread - j)) /
						spread;
				}
			}
		}

		for (let i = 0; i < positions2.length; i += 3) {
			for (let j = spread; j >= 0; j--) {
				let pos2_x;
				let pos2_y;

				if (edge_name1 === "west") {
					pos2_x = -positions2[i] - step * j;
					pos2_y = positions2[i + 1];
				} else if (edge_name1 === "north") {
					pos2_x = positions2[i];
					pos2_y = -positions2[i + 1] + step * j;
				} else if (edge_name1 === "east") {
					pos2_x = -positions2[i] + step * j;
					pos2_y = positions2[i + 1];
				} else if (edge_name1 === "south") {
					pos2_x = positions2[i];
					pos2_y = -positions2[i + 1] - step * j;
				}

				const pos2_key = this.#edgeKey(pos2_x, pos2_y);

				if (edge[pos2_key]) {
					if (edge_name1 === "west" || edge_name1 === "east") {
						if (
							Math.abs(positions1[i]) <
								Math.abs(positions1[i + 1]) &&
							Math.abs(positions1[i + 1]) >= 512 - step * spread
						) {
							continue;
						}
					} else if (
						edge_name1 === "north" ||
						edge_name1 === "south"
					) {
						if (
							Math.abs(positions1[i]) >= 512 - step * spread &&
							Math.abs(positions1[i + 1]) <
								Math.abs(positions1[i])
						) {
							continue;
						}
					}

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

	// saveTerrain(x, z, terrain) {
	// 	const terrain_name = this.#getTerrainNameByIndices(x, z);

	// 	fs.writeFileSync(
	// 		this.#terrain_path + terrain_name,
	// 		JSON.stringify(terrain)
	// 	);
	// }

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
				-radius / 2 < x &&
				x <= radius / 2 &&
				-radius / 2 < y &&
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

	scatterTerrain(geometry, options) {
		var defaultOptions = {
			spread: 0.025,
			smoothSpread: 0,
			sizeVariance: 0.1,
			randomness: Math.random,
			maxSlope: 0.6283185307179586, // 36deg or 36 / 180 * Math.PI, about the angle of repose of earth
			maxTilt: Infinity,
			w: 0,
			h: 0,
		};

		for (var opt in defaultOptions) {
			if (defaultOptions.hasOwnProperty(opt)) {
				options[opt] =
					typeof options[opt] === "undefined"
						? defaultOptions[opt]
						: options[opt];
			}
		}

		var spreadIsNumber = typeof options.spread === "number",
			randomHeightmap,
			randomness,
			spreadRange = 1 / options.smoothSpread,
			// doubleSizeVariance = options.sizeVariance * 2,
			vertex1 = new THREE.Vector3(),
			vertex2 = new THREE.Vector3(),
			vertex3 = new THREE.Vector3(),
			faceNormal = new THREE.Vector3();

		const up = new THREE.Vector3(0, 0, 1);
		// up = options.mesh.up
		// 	.clone()
		// 	.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5 * Math.PI);
		if (spreadIsNumber) {
			randomHeightmap = options.randomness();
			randomness =
				typeof randomHeightmap === "number"
					? Math.random
					: function (k) {
							return randomHeightmap[k];
					  };
		}

		geometry = geometry.toNonIndexed();
		var gArray = geometry.attributes.position.array;
		for (var i = 0; i < geometry.attributes.position.array.length; i += 9) {
			vertex1.set(gArray[i + 0], gArray[i + 1], gArray[i + 2]);
			vertex2.set(gArray[i + 3], gArray[i + 4], gArray[i + 5]);
			vertex3.set(gArray[i + 6], gArray[i + 7], gArray[i + 8]);
			THREE.Triangle.getNormal(vertex1, vertex2, vertex3, faceNormal);

			var place = false;
			if (spreadIsNumber) {
				var rv = randomness(i / 9);
				if (rv < options.spread) {
					place = true;
				} else if (rv < options.spread + options.smoothSpread) {
					// Interpolate rv between spread and spread + smoothSpread,
					// then multiply that "easing" value by the probability
					// that a mesh would get placed on a given face.
					place =
						THREETerrain.EaseInOut(
							(rv - options.spread) * spreadRange
						) *
							options.spread >
						Math.random();
				}
			} else {
				place = options.spread(vertex1, i / 9, faceNormal, i);
			}
			if (place) {

				// Don't place a mesh if the angle is too steep.
				if (faceNormal.angleTo(up) > options.maxSlope) {
					continue;
				}

				const tmppos = new THREE.Vector3()
					.addVectors(vertex1, vertex2)
					.add(vertex3)
					.divideScalar(3);

				console.log(tmppos);

				// do something
				// mesh.position
				// .addVectors(vertex1, vertex2)
				// .add(vertex3)
				// .divideScalar(3);
			}
		}
	}
}

module.exports = TerrainFactory;

// determine if currenct executed file is this file
if (require.main === module) {
	const terrain_factory = new TerrainFactory();

	// terrain_factory.iterateTerrain(3);

	// const terrain1 = terrain_factory.fetchTerrain(0, 0);
	// const terrain2 = terrain_factory.fetchTerrain(-1, 0);

	// terrain_factory.mergeTerrain(terrain1, terrain2, "west");

	// terrain_factory.saveTerrain(0, 0, terrain1);
	// terrain_factory.saveTerrain(-1, 0, terrain2);

	const data = terrain_factory.fetchTerrain(0, 0);

	// Define the vertices and faces of the surface
	const geometry = new THREE.PlaneGeometry(
		data.width,
		data.height,
		data.widthSegments,
		data.heightSegments
	);

	// geometry.setAttribute(
	// 	"normal",
	// 	new THREE.BufferAttribute(new Float32Array(data.normal), 3)
	// );
	geometry.setAttribute(
		"position",
		new THREE.BufferAttribute(new Float32Array(data.position), 3)
	);

	terrain_factory.scatterTerrain(geometry, {})
}
