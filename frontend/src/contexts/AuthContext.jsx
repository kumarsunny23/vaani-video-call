import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: `${server}/api/v1/users`
})

const guestClient = axios.create({
    baseURL: `${server}/api/v1/guest`
})


export const AuthProvider = ({ children }) => {

    const authContext = useContext(AuthContext);


    const [userData, setUserData] = useState(authContext);


    const router = useNavigate();

    const handleRegister = async (name, username, password) => {
        try {
            let request = await client.post("/register", {
                name: name,
                username: username,
                password: password
            })


            if (request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (err) {
            throw err;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password
            });

            console.log(username, password)
            console.log(request.data)

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home")
            }
        } catch (err) {
            throw err;
        }
    }

    const handleGoogleAuth = async (name, username, uid) => {
        try {
            let request = await client.post("/google-login", {
                name: name,
                username: username,
                uid: uid
            });

            if (request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (err) {
            throw err;
        }
    }

    const getHistoryOfUser = async () => {
        try {
            let request = await client.get("/get_all_activity", {
                params: {
                    token: localStorage.getItem("token")
                }
            });
            return request.data
        } catch
         (err) {
            throw err;
        }
    }

    const addToUserHistory = async (meetingCode) => {
        try {
            let request = await client.post("/add_to_activity", {
                token: localStorage.getItem("token"),
                meeting_code: meetingCode
            });
            return request
        } catch (e) {
            throw e;
        }
    }

    /**
     * Generate a guest invite token for a specific room.
     * Returns { guestToken, expiresIn, roomId }
     */
    const generateGuestInvite = async (roomId) => {
        try {
            const userToken = localStorage.getItem("token");
            if (!userToken) {
                throw new Error("You must be logged in to generate guest invites");
            }
            const request = await guestClient.post("/generate", {
                roomId: roomId,
                token: userToken,
            });
            return request.data;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Validate a guest token for a specific room.
     * Returns { valid, message, roomId }
     */
    const validateGuestToken = async (guestToken, roomId) => {
        try {
            const request = await guestClient.post("/validate", {
                guestToken: guestToken,
                roomId: roomId,
            });
            return request.data;
        } catch (e) {
            // Return the error response data if available
            if (e.response && e.response.data) {
                return e.response.data;
            }
            throw e;
        }
    }


    const data = {
        userData, setUserData, addToUserHistory, getHistoryOfUser,
        handleRegister, handleLogin, handleGoogleAuth, generateGuestInvite, validateGuestToken
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}

