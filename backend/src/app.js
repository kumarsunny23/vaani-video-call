import express from "express";
import { createServer } from "node:http";

import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";

import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import guestRoutes from "./routes/guest.routes.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);


app.set("port", (process.env.PORT || 8000))
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/guest", guestRoutes);

const start = async () => {
    app.set("mongo_user")

    try {
        const connectionDb = await mongoose.connect(
            "mongodb+srv://imdigitalashish:4UuvWi2genXonVku@cluster0.cujabk4.mongodb.net/",
            { serverSelectionTimeoutMS: 5000 }
        );
        console.log(`✅ MONGO Connected DB Host: ${connectionDb.connection.host}`);
    } catch (err) {
        console.warn("⚠️  MongoDB connection failed:", err.message);
        console.log("⏳ Starting Local Memory Database (mongodb-memory-server) instead...");
        try {
            const { MongoMemoryServer } = await import('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            const memoryUri = mongoServer.getUri();
            await mongoose.connect(memoryUri);
            console.log(`✅ Connected to Local Memory Database! (Test Data Only - Will erase on restart)`);
        } catch (memoryErr) {
            console.error("⚠️ Local Memory DB failed:", memoryErr.message);
            console.warn("⚠️ Server will still run — Guest Token & Socket features work without DB.");
        }
    }

    server.listen(app.get("port"), () => {
        console.log("🚀 LISTENING ON PORT 8000")
    });
}

start();
console.log("Starting backend app...");