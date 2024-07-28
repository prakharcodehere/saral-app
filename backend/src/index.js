'use strict';

const strapi = require('@strapi/strapi');
const http = require('http');
const socketIO = require('socket.io');

strapi().start().then((strapiInstance) => {
  const server = http.createServer(strapiInstance.app);
  const io = socketIO(server);

  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join', ({ username }) => {
      console.log(`${username} joined the chat`);
      socket.emit('welcome', {
        user: 'System',
        text: `Welcome ${username}!`,
      });

      // Broadcast when a user connects
      socket.broadcast.emit('message', {
        user: 'System',
        text: `${username} has joined the chat`,
      });
    });

    socket.on('sendMessage', ({ message, user }) => {
      io.emit('message', { user, text: message });
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
    });
  });

  server.listen(1337, () => {
    console.log('Strapi server with Socket.io is running on port 1337');
  });
});
