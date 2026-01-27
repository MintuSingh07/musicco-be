const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();
const { generateRoomId } = require('./utils/generateRoomId')

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
})

// Make io accessible to our routes
app.set('socketio', io);

// Connect to Database
connectDB();

const { rooms } = require('./data/rooms');

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//! Socket
io.on("connection", (socket) => {
    // We already moved 'rooms' to a shared file
    console.log("User connected with id:", socket.id);

    //? Create Room
    socket.on('create-room', () => {
        let roomId = generateRoomId()

        if (rooms[roomId]) {
            return socket.emit('error:create-room', "Room already exists!")
        }

        // This signify that user join the room
        rooms[roomId] = {
            admin: socket.id,
            members: [socket.id]
        }

        // This logic actually join the socket to the room
        socket.join(roomId)

        socket.emit("success:create-room", {
            roomId,
            admin: socket.id
        })

        console.log("Rooms datails:", rooms);
    })
    //? Join Room
    socket.on('join-room', ({ roomId }) => {

        if (!rooms[roomId]) {
            return socket.emit("error:join-room", "Room doesn't exist!");
        }

        if (rooms[roomId].members.includes(socket.id)) {
            return socket.emit("error:member-exist", "Member already exists!");
        }

        socket.join(roomId);
        rooms[roomId].members.push(socket.id);
        console.log(rooms[roomId].members);

        socket.emit("success:join-room", { roomId });
        socket.to(roomId).emit("user-joined", socket.id);

        console.log("Rooms details:", rooms);
    });
    //? Add Songs to queue
    socket.on("add-song", ({ songs, roomId }) => {
        if (!rooms[roomId]) {
            return socket.emit("error:join-room", "Room doesn't exist!");
        }
        if (!songs || !Array.isArray(songs)) {
            return socket.emit("error:add-song", "No songs provided or invalid format");
        }

        //? Initialize queue if not exists
        if (!rooms[roomId].songsQueue) {
            rooms[roomId].songsQueue = [];
        }

        //? Filter out songs that are already in the queue to prevent duplicates
        const newSongs = songs.filter(newSong =>
            !rooms[roomId].songsQueue.some(existingSong => existingSong.id === newSong.id)
        );

        if (newSongs.length === 0) {
            return socket.emit("error:add-song", "Songs already exist in queue!");
        }

        //? Push new songs to the song queue
        rooms[roomId].songsQueue.push(...newSongs);

        //? Notify room
        io.to(roomId).emit("queue-updated", {
            queue: rooms[roomId].songsQueue
        });
    });
    //? Remove song from queue
    socket.on("remove-song", ({ song, roomId }) => {
        if (!rooms[roomId]) return socket.emit("error:join-room", "Room doesn't exist!");
        if (!rooms[roomId].songsQueue) return socket.emit("error:remove-song", "No song available in song queue!");

        //? Filter out the requested song
        rooms[roomId].songsQueue = rooms[roomId].songsQueue.filter(s => s.id !== song.id);

        //? Notify room
        io.to(roomId).emit("queue-updated", {
            queue: rooms[roomId].songsQueue
        });
    });

})

//! Routes
const musicRoutes = require('./routes/musicRoutes');
app.use('/api/v1/music', musicRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
