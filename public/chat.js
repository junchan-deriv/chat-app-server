//Create  connection
var socket = io.connect("http://localhost:5000"); // io.connect("http://192.168.100.195:5000");

//Query DOM
var message = $("#message");
var username = $("#username");
var btn = $("#send");
var output  = $("#output");
var feedback  = $("#feedback");

socket.emit("history", {}, function (response){
    response.forEach(el => {
        output.append("<p><strong>" + el.username +":</strong>" + el.text + "</p>");
    })
})

//Emit event
btn.on("click", function () {
    socket.emit("chat", {
        username: username.val(),
        message: message.val()
    });
});

message.keypress(function () {
    socket.emit("typing", username.val());
});

//Listen event
socket.on("chat", function (data) {
    output.append("<p><strong>" + data.username +":</strong>" + data.message + "</p>");
    feedback.html("");
    document.getElementById("chat-window").scrollTop = output[0].scrollHeight;
});

socket.on("typing", function (data) {
    // console.log(data);
    // feedback.append("<p> <em>" + data + " is typing... </em> </p>");

    // setTimeout(function() {
    //     feedback.innerHTML = "";
    // }, 300)

});

