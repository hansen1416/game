const TerrainFactory = require("./lib/TerrainFactory");

const express = require("express");
const cors = require("cors");

const app = express();

// var corsOptions = {
// 	origin: 'http://example.com',
// 	optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
//   }

app.use(cors());

app.get("/terrain", (req, res) => {
	const tf = new TerrainFactory();

	const data = tf.fetchTerrain(0, 0);

	res.json([data, data]);
});

const port = process.env.PORT || 4096;
app.listen(port, () => {
	console.log(`API server listening on port ${port}`);
});

// nodemon --watch server --ext ts --exec ts-node --ignore '*.test.ts' --delay 3 server/server.ts
