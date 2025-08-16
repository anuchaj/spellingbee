# spellingbee

Some major adjustments for multi-player mode.
1. Change the server.js to include Socket.io http server
2. Replaced app.listen with http.createServer(app) → required for Socket.IO.
3. Initialized io = new Server(server, {...}).
4. Added some basic example events (submit-answer, answer-result, disconnect).
