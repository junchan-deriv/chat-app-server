# BeSquare Chatrooom Server

A simple server for a chatroom that is limited to the following functionality:

1. Sending and recieving chat messages
2. Sending and receiving `Typing...` status
3. Retrieving chat history


## How to use:

1. Install socket.io
    - Using `npm` (perfect if you are using React):
        ```console
        npm install socket.io-client
        ```
    - From a CDN (perfect if you are using static html)
    Paste the following in the head tag of your `html` root file:
        ```
        <script src="https://cdn.socket.io/3.1.3/socket.io.min.js" integrity="sha384-cPwlPLvBTa3sKAgddT6krw0cJat7egBga3DJepJyrLl4Q9/5WLra3rrnMcyTyOnh" crossorigin="anonymous"></script>
        ```
2. Connect to the server:

```js
const socket = io.connect("http://besquare-chatroom.herokuapp.com");
```

or if you're using node and/or react:

```js
import socketIOClient from "socket.io-client";

const socket = socketIOClient("http://besquare-chatroom.herokuapp.com");
```

Now you can send and receive:

### Send a message

```javascript
socket.emit("chat", {
    username: "Jonnyboi",
    message: "Hello, world!"
});
```

### Recieve messages

```javascript
socket.on("chat", function (data) {
    console.log("username:", data.username, "message:", data.message )
});
```

#### Send "Typing..." event

```javascript
socket.emit("typing", "Jonnyboi");
```

#### Receive "Typing..." event

```javascript
socket.on("chat", function (data) {
    console.log(data.username, "is typing..." )
});
```

#### Get chat history

```javascript
socket.emit("history", { from: "", to: "" }, function (response){
    console.log(response);
})
```
