const express = require('express');
const http = require('http');
const socket = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, getUser, removeUser, getUsersInRoom } = require('./utils/users');

const port = process.env.PORT || 3000;
const www = process.env.WWW || './public/';
const app = express();
const server = http.createServer(app);
const io = socket(server);

app.use(express.static(www));
app.get('*', (req, res) => {
  res.sendFile(`index.html`, { root: www });
});

io.on('connection', (socket) => {
  socket.on('join', ({username, room}, callback) => {
    const { error, user } = addUser({
      id: socket.id,
      username,
      room
    });

    if(error) {
      return callback(error);
    }

    socket.join(user.room);
    socket.send(generateMessage({
      text: `Hello, ${user.username}! Welcome to the chat!`
    }));
    socket.broadcast.to(user.room).emit(
      'message',
      generateMessage({
        text: `${user.username} just joined to the chat.`
      })
    );
    io.to(user.room).emit('userJoinedRoom', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });
    callback();
  });

  socket.on('sendMessage', (data, callback) => {
    const user = getUser(socket.id);
    if (user) {
      const filter = new Filter();
      const msg = {
        user: user.username,
        text: filter.clean(data)
      };
      io.to(user.room).emit('message', generateMessage(msg));
      callback('Server said: I did it!');
    }
  });
  
  socket.on('shareLocation', (data, callback) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'locationMessage',
        generateMessage({
          user: user.username,
          text: `https://google.com/maps?q=${data.lat},${data.long}`
        })
      );
      callback('Location shared');
    }
  });
  
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        generateMessage({
          text: `User ${user.username} has been disconnected!`
        })
      );
      io.to(user.room).emit('userLeftRoom', {
        room: user.room,
        user: user
      });
    }
  });
});

server.listen(port, () => console.log(`listening on http://localhost:${port}`));
