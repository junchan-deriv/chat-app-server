const express = require("express");
const socket = require("socket.io");
const session = require("express-session");
const { addMessage, getLastMessages } = require("./firebase_binder");
const { newToken, getAssociatedUser } = require("./tokens");
require("dotenv").config();

const users = {
  junchan: "123",
  jiajet: "123",
  afiq: "afiq",
  vernyi: "vern",
  derrick: "123",
  yuuchin: "shontzu",
};

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
    res.redirect("/chat.html").end();
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
    res
      .status(401)
      .type("html")
      .end('Fuck off, you are an unauthorized shit; <a href="/">Retry</a>');
    return;
  }
  next();
});

app.use(express.static("public"));

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

function enableNormalChat(socket) {
  socket.on("chat", (data) => {
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
