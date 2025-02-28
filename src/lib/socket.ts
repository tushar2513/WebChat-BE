import { Server } from "socket.io";
import http from "http";
import express from "express";
import authRoutes from "../routes/auth.route"

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173']
    }
});

app.use("/auth", authRoutes)

export const  getReceiverSocketId = (userId: string) => {
    return userSocketMap[userId];
}

//use to store online user
const userSocketMap: Record<string, string> = {}; //{ userId: socketId}

io.on("connection", (socket) => {
    console.log("User connected",socket.id);

    const userId = socket.handshake.query.userId as string;
    if(userId) userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log('User disconnected',socket.id);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap));
    })
})



export { io, server, app };