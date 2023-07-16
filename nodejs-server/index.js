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
