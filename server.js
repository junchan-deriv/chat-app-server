const express = require("express");
const admin = require("firebase-admin");
const socket = require("socket.io");
require('dotenv').config()

const app = express();

var serviceAccount = require("./sdk_secret.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_URL
});

const port = process.env.PORT || 5000;

const server = app.listen(port, function () {
    console.log("Listening on port", port);
});

// app.use(express.static("public"));

const message_db = admin.database().ref("/messages");

const io = socket(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
});

io.on("error", () => {
    
})

io.on("connection", socket => {
    socket.on("chat", data => {
        io.sockets.emit("chat", data);
        if (Object.values(data)) {
            message_db.push({
                time: Date.now(),
                username: data.username ? data.username : "",
                text: data.message? data.message : ""
            })
        }
    });

    socket.on("typing", data => {
        socket.broadcast.emit("typing", data)
    });

    socket.on("history", (params, callback) => {
        if (params.from && params.to) {
            message_db.orderByChild("time").startAt(params.from).endAt(params.to).on("value", function(snapshot) {
                const hist = Object.values(snapshot.val());
                callback(hist);
            })
        } else if (params.from) {
            message_db.orderByChild("time").startAt(params.from).on("value", function(snapshot) {
                const hist = Object.values(snapshot.val());
                callback(hist);
            })
        } else if (params.to) {
            message_db.orderByChild("time").endAt(params.to).on("value", function(snapshot) {
                const hist = Object.values(snapshot.val());
                callback(hist);
            })
        } else {
            message_db.on("value", function(snapshot) {
                const hist = Object.values(snapshot.val());
                callback(hist);
            })
        }
    })
});
