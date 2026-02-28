"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const db_1 = __importDefault(require("./config/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const generateRoomId_1 = require("./utils/generateRoomId");
const cloudinary_1 = require("./utils/cloudinary");
const rooms_1 = require("./data/rooms");
const musicRoutes_1 = __importDefault(require("./routes/musicRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
// Make io accessible to our routes
app.set('socketio', io);
// Connect to Database
(0, db_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
//! Socket
io.on("connection", (socket) => {
    // We already moved 'rooms' to a shared file
    console.log("User connected with id:", socket.id);
    //? Create Room
    socket.on('create-room', () => {
        let roomId = (0, generateRoomId_1.generateRoomId)();
        if (rooms_1.rooms[roomId]) {
            return socket.emit('error:create-room', "Room already exists!");
        }
        // This signify that user join the room
        rooms_1.rooms[roomId] = {
            admin: socket.id,
            members: [socket.id]
        };
        // This logic actually join the socket to the room
        socket.join(roomId);
        socket.emit("success:create-room", {
            roomId,
            admin: socket.id
        });
        console.log("Rooms datails:", rooms_1.rooms);
    });
    //? Join Room
    socket.on('join-room', ({ roomId }) => {
        if (!rooms_1.rooms[roomId]) {
            return socket.emit("error:join-room", "Room doesn't exist!");
        }
        if (rooms_1.rooms[roomId].members.includes(socket.id)) {
            return socket.emit("error:member-exist", "Member already exists!");
        }
        socket.join(roomId);
        rooms_1.rooms[roomId].members.push(socket.id);
        console.log(rooms_1.rooms[roomId].members);
        socket.emit("success:join-room", { roomId });
        socket.to(roomId).emit("user-joined", socket.id);
        console.log("Rooms details:", rooms_1.rooms);
    });
    //? Leave Room
    socket.on('leave-room', ({ roomId }) => {
        if (!rooms_1.rooms[roomId])
            return socket.emit('error:leave-room', "Room doesn't exist!");
        if (!rooms_1.rooms[roomId].members.includes(socket.id))
            return socket.emit('error:leave-room', "User doesn't exist in room!");
        // Make user leave from the room (socket level)
        socket.leave(socket.id);
        // Remove user from room
        rooms_1.rooms[roomId].members = rooms_1.rooms[roomId].members.filter((user) => user != socket.id);
        console.log("Rooms details:", rooms_1.rooms);
        socket.emit("success:leave-room", { roomId });
        socket.to(roomId).emit("user-left", socket.id);
        console.log("Rooms details:", rooms_1.rooms);
        if (rooms_1.rooms[roomId].members.length === 0) {
            delete rooms_1.rooms[roomId];
        }
    });
    //? Add Songs to queue
    socket.on('add-song', ({ songs, roomId }) => {
        // Check if room exists
        if (!rooms_1.rooms[roomId]) {
            return socket.emit("error:join-room", "Room doesn't exist!");
        }
        // Ensure socket is joined to the room (handles reconnections)
        socket.join(roomId);
        if (rooms_1.rooms[roomId].members && !rooms_1.rooms[roomId].members.includes(socket.id)) {
            rooms_1.rooms[roomId].members.push(socket.id);
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
        if (!rooms_1.rooms[roomId].songsQueue) {
            rooms_1.rooms[roomId].songsQueue = [];
        }
        // Filter out songs that are already in the queue to prevent duplicates
        const newSongs = songArray.filter((newSong) => !rooms_1.rooms[roomId].songsQueue.some((existingSong) => existingSong.id === newSong.id));
        if (newSongs.length === 0) {
            return socket.emit("error:add-song", "Songs already exist in queue!");
        }
        // Push new songs to the song queue
        rooms_1.rooms[roomId].songsQueue.push(...newSongs);
        console.log(`Added ${newSongs.length} songs to room ${roomId}`);
        // Notify everyone in the room
        io.to(roomId).emit("queue-updated", {
            queue: rooms_1.rooms[roomId].songsQueue
        });
    });
    //? Remove song from queue
    socket.on('remove-song', async ({ song, roomId }) => {
        //? Basic validation
        if (!rooms_1.rooms[roomId])
            return socket.emit("error:remove-song", "Room doesn't exist!");
        if (!rooms_1.rooms[roomId].songsQueue)
            return socket.emit("error:remove-song", "Queue is empty!");
        //? Authorization validation: Only admin can remove songs
        if (rooms_1.rooms[roomId].admin !== socket.id) {
            return socket.emit("error:remove-song", "Only the room creator can remove songs!");
        }
        //? Filter out the requested song
        const initialLength = rooms_1.rooms[roomId].songsQueue.length;
        rooms_1.rooms[roomId].songsQueue = rooms_1.rooms[roomId].songsQueue.filter((s) => s.id !== song.id);
        if (rooms_1.rooms[roomId].songsQueue.length === initialLength) {
            return socket.emit("error:remove-song", "Song not found in queue!");
        }
        //? Destroy the file on Cloudinary
        if (song.id) {
            await (0, cloudinary_1.deleteFromCloudinary)(song.id);
        }
        //? Notify everyone in the room
        io.to(roomId).emit("queue-updated", {
            queue: rooms_1.rooms[roomId].songsQueue
        });
    });
    //? Play song in sync + 8d effect
});
//! Routes
app.use('/api/v1/music', musicRoutes_1.default);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
