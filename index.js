const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
require('dotenv').config();
const { generateRoomId } = require('./utils/generateRoomId')
const { deleteFromCloudinary } = require('./utils/cloudinary');

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
    //? Leave Room
    socket.on('leave-room', ({ roomId }) => {
        if (!rooms[roomId]) return socket.emit('error:leave-room', "Room doesn't exist!");
        if (!rooms[roomId].members.includes(socket.id)) return socket.emit('error:leave-room', "User doesn't exist in room!");

        // Make user leave from the room (socket level)
        socket.leave(socket.id);

        // Remove user from room
        rooms[roomId].members = rooms[roomId].members.filter(user => user != socket.id);

        console.log("Rooms details:", rooms);

        socket.emit("success:leave-room", { roomId });
        socket.to(roomId).emit("user-left", socket.id);

        console.log("Rooms details:", rooms);

        if (rooms[roomId].members.length === 0) {
            delete rooms[roomId];
        }
    });

    //? Add Songs to queue
    socket.on('add-song', ({ songs, roomId }) => {
        // Check if room exists
        if (!rooms[roomId]) {
            return socket.emit("error:join-room", "Room doesn't exist!");
        }

        // Ensure socket is joined to the room (handles reconnections)
        socket.join(roomId);
        if (rooms[roomId].members && !rooms[roomId].members.includes(socket.id)) {
            rooms[roomId].members.push(socket.id);
        }

        // Check if songs is provided or not
        if (!songs) {
            return socket.emit("error:add-song", "No songs provided or invalid format");
        }

        // Check if songs is an array 
        let songArray = Array.isArray(songs) ? songs : [songs];
        if (!songArray.length) {
            return socket.emit("error:add-song", "No songs provided or invalid format");
        }

        // Initialize queue if not exists
        if (!rooms[roomId].songsQueue) {
            rooms[roomId].songsQueue = [];
        }

        // Filter out songs that are already in the queue to prevent duplicates
        const newSongs = songArray.filter(newSong =>
            !rooms[roomId].songsQueue.some(existingSong => existingSong.id === newSong.id)
        );

        if (newSongs.length === 0) {
            return socket.emit("error:add-song", "Songs already exist in queue!");
        }

        // Push new songs to the song queue
        rooms[roomId].songsQueue.push(...newSongs);
        console.log(`Added ${newSongs.length} songs to room ${roomId}`);

        // Notify everyone in the room
        io.to(roomId).emit("queue-updated", {
            queue: rooms[roomId].songsQueue
        });
    });
    //? Remove song from queue
    socket.on('remove-song', async ({ song, roomId }) => {
        //? Basic validation
        if (!rooms[roomId]) return socket.emit("error:remove-song", "Room doesn't exist!");
        if (!rooms[roomId].songsQueue) return socket.emit("error:remove-song", "Queue is empty!");

        //? Authorization validation: Only admin can remove songs
        if (rooms[roomId].admin !== socket.id) {
            return socket.emit("error:remove-song", "Only the room creator can remove songs!");
        }

        //? Filter out the requested song
        const initialLength = rooms[roomId].songsQueue.length;
        rooms[roomId].songsQueue = rooms[roomId].songsQueue.filter(s => s.id !== song.id);

        if (rooms[roomId].songsQueue.length === initialLength) {
            return socket.emit("error:remove-song", "Song not found in queue!");
        }

        //? Destroy the file on Cloudinary
        if (song.id) {
            await deleteFromCloudinary(song.id);
        }

        //? Notify everyone in the room
        io.to(roomId).emit("queue-updated", {
            queue: rooms[roomId].songsQueue
        });
    });

    //? Play song in sync + 8d effect
    
})

//! Routes
const musicRoutes = require('./routes/musicRoutes');
app.use('/api/v1/music', musicRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
