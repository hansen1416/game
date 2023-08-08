const { WebSocketServer } = require("ws");

const wss = new WebSocketServer({ port: 5463 });

// wss.on("connection", function connection(ws) {
// 	wss.on("open", function open() {
// 		console.log("connected");
// 		wss.send(Date.now());
// 	});

// 	ws.on("error", console.error);

// 	wss.on("close", function close() {
// 		console.log("disconnected");
// 	});

// 	wss.on("message", function message(data) {
// 		console.log(`Round-trip time: ${Date.now() - data} ms`);

// 		setTimeout(function timeout() {
// 			wss.send(Date.now());
// 		}, 500);
// 	});
// });


wss.on('connection', function connection(ws) {
    console.log('Client connected');
  
    ws.on('message', function incoming(message) {
      console.log('Received message:', message);
      // Handle the received message here
    });
  
    ws.on('close', function close() {
      console.log('Client disconnected');
      // Handle the client disconnection here
    });
  
    ws.send('Hello, client!');
  });