import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {

        socket.on("join-call", (path, name) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push({ id: socket.id, username: name || "Anonymous" });

            timeOnline[socket.id] = new Date();

            for (let a = 0; a < connections[path].length; a++) {
                io.to(connections[path][a].id).emit("user-joined", socket.id, connections[path], name);
            }

            // FIX 4: condition was inverted (=== undefined instead of !== undefined)
            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; ++a) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[path][a]["data"],
                        messages[path][a]["sender"],
                        messages[path][a]["socket-id-sender"]
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections).reduce(
                ([room, isFound], [roomKey, roomValue]) => {
                    const exists = roomValue.find(p => p.id === socket.id);
                    if (!isFound && exists) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                },
                ["", false]
            );

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({
                    sender: sender,
                    data: data,
                    "socket-id-sender": socket.id,
                });

                // FIX 5: console.log used undefined `key` variable → matchingRoom
                console.log("message", matchingRoom, ":", sender, data);

                // FIX 6: io.to(emit(...)) → io.to(elem).emit(...)
                connections[matchingRoom].forEach((p) => {
                    io.to(p.id).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("disconnect", () => {
            var diffTime = Math.abs(timeOnline[socket.id] - new Date());
            var key;

            Object.entries(connections).forEach(([roomKey, participants]) => {
                const index = participants.findIndex(p => p.id === socket.id);
                if (index !== -1) {
                    key = roomKey;
                    participants.splice(index, 1);
                    
                    participants.forEach(p => {
                        io.to(p.id).emit("user-left", socket.id);
                    });

                    if (participants.length === 0) {
                        delete connections[key];
                    }
                }
            });
        });
    });

    return io;
};