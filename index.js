const http = require("http");
const path = require("path");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.static(path.resolve("./public")));

const users = {}; // Store usernames

io.on("connection", (socket) => {
  let username;

  // When a user joins
  socket.on("join-chat", (userData) => {
    const { username: uname, chatId } = userData;
    username = uname;
    // Add user to users object with the chat ID as key
    if (!users[chatId]) {
      users[chatId] = {};
    }
    users[chatId][socket.id] = username;
    io.emit("users-count", Object.keys(users[chatId]).length); // Send user count to all clients
  });

  // When a user sends a message
  socket.on("user-msg", (message) => {
    console.log(`${username} sent a message: ${message}`);
    io.emit("message", `${username}: ${message}`);
  });

  // When a user disconnects
  socket.on("disconnect", () => {
    const chatIds = Object.keys(users);
    chatIds.forEach((chatId) => {
      if (users[chatId][socket.id]) {
        delete users[chatId][socket.id];
        io.emit("users-count", Object.keys(users[chatId]).length); // Send updated user count to all clients
      }
    });
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
