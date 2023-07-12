const THREETerrain = require("./THREETerrain");
const THREE = require("three");
const puppeteer = require("puppeteer");

const segments = 127;
const size = 4096;

// const [terrain, hm] = THREETerrain({
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

puppeteer.launch({ headless: "new" }).then((browser) => {
	console.log(browser);


    browser.close();
});
