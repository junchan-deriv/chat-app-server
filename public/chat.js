//Create  connection
var socket = io.connect(window.chat_server); // io.connect("http://192.168.100.195:5000");

//Query DOM
var message = $("#message");
var btn = $("#send");
var output = $("#output");
var feedback = $("#feedback");

//get the history
socket.emit("history", {}, function (response) {
  response.forEach((el) => {
    output.append(
      "<p><strong>" + el.username + ":</strong>" + el.text + "</p>"
    );
  });
});

//authenticate with the system
socket.emit("auth", { token: window.token }, function (result) {
  if (!result) {
    alert("Cannot authenticate");
    document.location.reload();
  }
});

//Emit event
btn.on("click", function () {
  socket.emit("chat", {
    message: message.val(),
  });
  message.val("");
});

message.keypress(function () {
  socket.emit("typing");
});

//Listen event
socket.on("chat", function (data) {
  output.append(
    "<p><strong>" + data.username + ":</strong>" + data.message + "</p>"
  );
  feedback.html("");
  document.getElementById("chat-window").scrollTop = output[0].scrollHeight;
});

const list = [];
function updateUI() {
  if (list.length === 0) {
    feedback.html("");
    return;
  } else {
    if (list.length > 5) {
      feedback.html("<p><em>Multiple peoples is typing........</em></p>");
    } else {
      feedback.html(
        `<p><em>${list.reduce(
          (b, v, i, a) =>
            b +
            (i === a.length && a.length !== 1 ? " and " : i == 0 ? "" : ", ") +
            v
        )} is typing........</em></p>`
      );
    }
  }
}
socket.on("typing", function (data) {
  // console.log(data);
  // feedback.append("<p> <em>" + data + " is typing... </em> </p>");

  // setTimeout(function() {
  //     feedback.innerHTML = "";
  // }, 300)
  if (!list.includes(data)) list.push(data);
  updateUI();
  setTimeout(function () {
    if (list.includes(data)) {
      list.splice(list.indexOf(data), 1);
    }
    updateUI();
  }, 300);
});
