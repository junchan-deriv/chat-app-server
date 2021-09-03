const express = require("express");
const admin = require("firebase-admin");
const socket = require("socket.io");

const app = express();

var serviceAccount = require("./sdk_secret.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://besquare-chatroom-default-rtdb.firebaseio.com"
});

const port = 5000; // process.env.PORT || 5000;

const server = app.listen(port, function () {
    console.log("Listening on port", port);
});

// app.use(express.static("public"));

const message_db = admin.database().ref("/messages");

const io = socket(server);

io.on("connection", socket => {
    socket.on("chat", data => {
        io.sockets.emit("chat", data);
        message_db.push({
            time: Date.now(),
            username: data.username,
            text: data.message
        })
    });

    socket.on("typing", data => {
        socket.broadcast.emit("typing...", data)
    });

    socket.on("history", (params, callback) => {
        message_db.on("value", function(snapshot) {
            const hist = Object.values(snapshot.val());
            callback(hist);
        })
    })
});
