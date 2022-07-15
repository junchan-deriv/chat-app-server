const express = require("express");
const socket = require("socket.io");
const session = require("express-session");
const fs = require("fs");
const { addMessage, getLastMessages } = require("./firebase_binder");
const { newToken, getAssociatedUser, nukeUser } = require("./tokens");
require("dotenv").config();

let users = {};

function reloadUsers() {
  let reloadedUsers = JSON.parse(
    fs.readFileSync("./users.json", { encoding: "utf-8" })
  );
  //compare the list
  Object.keys(reloadedUsers).forEach((u) => {
    if (users[u] !== reloadedUsers[u]) {
      //log it out
      nukeUser(u);
    }
  });
  console.log("Configuration loaded");
  users = reloadedUsers;
}

reloadUsers();

const app = express();

const port = 5000;

const server = app.listen(port, function () {
  console.log("Listening on port", port);
});

app.use(
  session({
    secret: "chicken everywhere",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(express.urlencoded());

const form = `<form method="POST">
<p>User Name: <input name="username" type="text" placeholder="User Name"/></p>
<p>Password: <input name="password" type="password" placeholder="Password"/></p>
<input type="submit" value="Login"/>
</form>`;

app.get("/", (req, res) => {
  if (req.session.user) {
    res.status(301).redirect("/chat.html");
    return;
  }
  res.status(200).type("html").end(`
  <html>
  <head>
  <title>Login</title>
  </head>
  <body>
${form}
  </body>
  </html>
  `);
});

app.post("/", (req, res) => {
  const { username, password } = req.body ?? {};
  if (users[username] === password) {
    req.session.user = username;
    req.session.token = newToken(username);
    res.status(301).redirect("/chat.html");
  } else {
    res.status(401).type("html").end(`
  <html>
  <head>
  <title>Login</title>
  </head>
  <body>
  <script>alert("Invalid credential")</script>
${form}
  </body>
  </html>
  `);
  }
});

app.use((req, res, next) => {
  if (!req.session.user) {
    res.status(401).type("html").end('Unauthorized <a href="/">Retry</a>');
    return;
  }
  next();
});

app.use(express.static("public"));

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.status(301).redirect("/");
});

function getIP(req) {
  let ip = req.connection.localAddress;
  if (ip.includes(":")) {
    return `[${ip}]`;
  } else {
    return ip;
  }
}

app.get("/auth_config.js", (req, res) => {
  res.set("Cache-Control", "no-store");
  return res
    .status(200)
    .end(
      `window.token="${req.session.token}";window.chat_server="http://${getIP(
        req
      )}:5000"`
    );
});

const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("error", () => {});

const onlineUsers = {};

function processSlashCommands(cmd, socket) {
  switch (cmd.trim()) {
    case "/help":
      socket.emit("chat", serverMessage(`/online show online users`));
      socket.emit("chat", serverMessage(`/me show name of logged in user`));
      socket.emit("chat", serverMessage(`/help show this help message`));
      return true;
    case "/online":
      socket.emit(
        "chat",
        serverMessage(
          `Users online:${Object.keys(onlineUsers)
            .filter((u) => onlineUsers[u])
            .join(", ")}`
        )
      );
      return true;
    case "/me":
      socket.emit("chat", serverMessage(`Your name is ${socket.user_name}`));
      return true;
  }
  if (cmd.trim().startsWith("/")) {
    socket.emit(
      "chat",
      serverMessage(`Invalid command. Type /help for all possible commands`)
    );
    return true;
  }
}

function enableNormalChat(socket) {
  onlineUsers[socket.user_name] = onlineUsers[socket.user_name]
    ? onlineUsers[socket.user_name] + 1
    : 1;
  socket.on("chat", (data) => {
    //check weather it is server command
    if (processSlashCommands(data.message, socket)) {
      return;
    }
    data.username = socket.user_name;
    io.sockets.emit("chat", data);
    if (Object.values(data)) {
      addMessage({
        time: Date.now(),
        username: socket.user_name,
        text: data.message ? data.message : "",
      });
    }
  });

  socket.on("typing", () => {
    socket.broadcast.emit("typing", socket.user_name);
  });

  socket.on("disconnect", function () {
    io.sockets.emit(
      "chat",
      serverMessage(`${socket.user_name} leaved the chat`)
    );
    onlineUsers[socket.user_name]--;
  });
}
function serverMessage(msg) {
  return {
    username: "SERVER",
    message: msg,
  };
}
io.on("connection", (socket) => {
  socket.on("auth", (params, callback) => {
    let user = getAssociatedUser(params.token);
    console.log(`Auth attempted using ${params.token}`);
    console.log(`Web Socket auth: user=${user}`);
    if (user) {
      socket.emit("chat", serverMessage(`Welcome ${user}`));
      socket.user_name = user;
      enableNormalChat(socket);
      io.sockets.emit("chat", serverMessage(`${user} joinned the chat`));
      callback(true);
    } else {
      socket.emit(
        "chat",
        serverMessage(`Cannot verify token, please refresh the page`)
      );
      callback(false);
    }
  });
  socket.on("history", (params, callback) => {
    getLastMessages(params.from, params.to, callback);
  });
});
setInterval(reloadUsers, 5000);
