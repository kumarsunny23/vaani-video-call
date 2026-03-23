import React, { useEffect, useRef, useState, useCallback } from 'react'
import io from "socket.io-client";
import { useParams } from 'react-router-dom';
import { Badge, IconButton, TextField, Tooltip } from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import PanToolIcon from '@mui/icons-material/PanTool';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopIcon from '@mui/icons-material/Stop';
import DownloadIcon from '@mui/icons-material/Download';
import server from '../environment';

const server_url = server;

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

const REACTIONS = ['👍', '❤️', '😂', '😮', '👏', '🔥'];

const silence = () => {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
};

const black = ({ width = 640, height = 480 } = {}) => {
    const canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    return Object.assign(canvas.captureStream().getVideoTracks()[0], { enabled: false });
};

const blackSilence = () => new MediaStream([black(), silence()]);

export default function VideoMeetComponent() {
    const socketRef      = useRef(null);
    const socketIdRef    = useRef("");
    const localVideoRef  = useRef(null);
    const videoRef       = useRef([]);
    const connectionsRef = useRef({});
    const permissionsInitialized = useRef(false);

    // ── Recording refs ─────────────────────────
    const mediaRecorderRef  = useRef(null);
    const recordedChunksRef = useRef([]);

    const { url: encodedUrl } = useParams();
    const roomKeyRef = useRef("");
    try { roomKeyRef.current = atob(encodedUrl); }
    catch { roomKeyRef.current = encodedUrl; }

    // ── Media state ────────────────────────────
    const [videoAvailable, setVideoAvailable]   = useState(false);
    const [audioAvailable, setAudioAvailable]   = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [video, setVideo]   = useState(false);
    const [audio, setAudio]   = useState(false);
    const [screen, setScreen] = useState(false);

    // ── UI state ───────────────────────────────
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername]             = useState("");
    const [videos, setVideos]                 = useState([]);
    const [showChat, setShowChat]             = useState(true);

    // ── Chat state ─────────────────────────────
    const [messages, setMessages]       = useState([]);
    const [message, setMessage]         = useState("");
    const [newMessages, setNewMessages] = useState(0);

    // ── Feature state ──────────────────────────
    const [handRaised, setHandRaised]           = useState(false);
    const [raisedHands, setRaisedHands]         = useState({});
    const [showReactions, setShowReactions]     = useState(false);
    const [activeReactions, setActiveReactions] = useState([]);
    const [videoLabels, setVideoLabels]         = useState({});

    // ── Recording state ────────────────────────
    const [isRecording, setIsRecording]     = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [recordedBlob, setRecordedBlob]   = useState(null);
    const recordingTimerRef = useRef(null);

    const chatBottomRef = useRef(null);

    // ── Permissions ────────────────────────────
    useEffect(() => {
        if (permissionsInitialized.current) return;
        permissionsInitialized.current = true;

        const getPermissions = async () => {
            try {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);
                const hasVideo = !!videoStream;
                if (videoStream) videoStream.getTracks().forEach(t => t.stop());
                setVideoAvailable(hasVideo);

                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
                const hasAudio = !!audioStream;
                if (audioStream) audioStream.getTracks().forEach(t => t.stop());
                setAudioAvailable(hasAudio);

                setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

                if (hasVideo || hasAudio) {
                    const stream = await navigator.mediaDevices.getUserMedia({ video: hasVideo, audio: hasAudio });
                    window.localStream = stream;
                    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.warn("Permission error:", err);
            }
        };
        getPermissions();
    }, []);

    // ── Auto-scroll chat ───────────────────────
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── Cleanup recording timer on unmount ─────
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        };
    }, []);

    // ══════════════════════════════════════════
    // RECORDING LOGIC
    // ══════════════════════════════════════════

    const startRecording = useCallback(() => {
        const streams = [];
        if (window.localStream) streams.push(window.localStream);
        videoRef.current.forEach(v => { if (v.stream) streams.push(v.stream); });

        let combinedStream;
        try {
            const audioCtx    = new AudioContext();
            const destination = audioCtx.createMediaStreamDestination();

            streams.forEach(s => {
                s.getAudioTracks().forEach(() => {
                    const src = audioCtx.createMediaStreamSource(s);
                    src.connect(destination);
                });
            });

            const videoTracks = window.localStream?.getVideoTracks() ?? [];
            combinedStream = videoTracks.length > 0
                ? new MediaStream([...videoTracks, ...destination.stream.getAudioTracks()])
                : destination.stream;
        } catch {
            combinedStream = window.localStream ?? new MediaStream();
        }

        const mimeType = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4',
        ].find(m => MediaRecorder.isTypeSupported(m)) || '';

        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(combinedStream, mimeType ? { mimeType } : {});

        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: mimeType || 'video/webm' });
            setRecordedBlob(blob);
        };

        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        setRecordingTime(0);
        setRecordedBlob(null);

        recordingTimerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const downloadRecording = useCallback(() => {
        if (!recordedBlob) return;
        const url  = URL.createObjectURL(recordedBlob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `meeting-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    }, [recordedBlob]);

    // ── Format recording time mm:ss ───────────
    const formatRecTime = (secs) => {
        const m = String(Math.floor(secs / 60)).padStart(2, '0');
        const s = String(secs % 60).padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── Media track management ─────────────────
    const getUserMediaSuccess = useCallback((stream) => {
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch {}
        window.localStream = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        Object.entries(connectionsRef.current).forEach(([id, conn]) => {
            if (id === socketIdRef.current) return;
            conn.addStream(window.localStream);
            conn.createOffer()
                .then(desc => conn.setLocalDescription(desc))
                .then(() => socketRef.current?.emit('signal', id,
                    JSON.stringify({ sdp: connectionsRef.current[id].localDescription })))
                .catch(console.warn);
        });

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setVideo(false);
                setAudio(false);
                try { localVideoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch {}
                window.localStream = blackSilence();
                if (localVideoRef.current) localVideoRef.current.srcObject = window.localStream;
                Object.entries(connectionsRef.current).forEach(([id, conn]) => {
                    conn.addStream(window.localStream);
                    conn.createOffer()
                        .then(desc => conn.setLocalDescription(desc))
                        .then(() => socketRef.current?.emit('signal', id,
                            JSON.stringify({ sdp: connectionsRef.current[id].localDescription })))
                        .catch(console.warn);
                });
            };
        });
    }, []);

    const getUserMedia = useCallback(() => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video, audio })
                .then(getUserMediaSuccess)
                .catch(console.warn);
        } else {
            try { localVideoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch {}
        }
    }, [video, audio, videoAvailable, audioAvailable, getUserMediaSuccess]);

    useEffect(() => {
        if (video !== false || audio !== false) getUserMedia();
    }, [video, audio, getUserMedia]);

    // ── Screen share ───────────────────────────
    const getDisplayMediaSuccess = useCallback((stream) => {
        try { window.localStream?.getTracks().forEach(t => t.stop()); } catch {}
        window.localStream = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        Object.entries(connectionsRef.current).forEach(([id, conn]) => {
            if (id === socketIdRef.current) return;
            conn.addStream(window.localStream);
            conn.createOffer()
                .then(desc => conn.setLocalDescription(desc))
                .then(() => socketRef.current?.emit('signal', id,
                    JSON.stringify({ sdp: connectionsRef.current[id].localDescription })))
                .catch(console.warn);
        });

        stream.getTracks().forEach(track => {
            track.onended = () => {
                setScreen(false);
                try { localVideoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch {}
                window.localStream = blackSilence();
                if (localVideoRef.current) localVideoRef.current.srcObject = window.localStream;
                getUserMedia();
            };
        });
    }, [getUserMedia]);

    useEffect(() => {
        if (screen === true) {
            navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                .then(getDisplayMediaSuccess)
                .catch(e => { console.warn(e); setScreen(false); });
        }
    }, [screen, getDisplayMediaSuccess]);

    // ── Socket & WebRTC ────────────────────────
    const gotMessageFromServer = useCallback((fromId, message) => {
        const signal = JSON.parse(message);
        if (fromId === socketIdRef.current) return;
        const conn = connectionsRef.current[fromId];
        if (!conn) return;

        if (signal.sdp) {
            conn.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                .then(() => {
                    if (signal.sdp.type === 'offer') {
                        conn.createAnswer()
                            .then(desc => conn.setLocalDescription(desc))
                            .then(() => socketRef.current?.emit('signal', fromId,
                                JSON.stringify({ sdp: conn.localDescription })))
                            .catch(console.warn);
                    }
                }).catch(console.warn);
        }
        if (signal.ice) {
            conn.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(console.warn);
        }
    }, []);

    const addMessage = useCallback((data, sender, socketIdSender) => {
        setMessages(prev => [...prev, { sender, data, time: new Date() }]);
        if (socketIdSender !== socketIdRef.current) setNewMessages(prev => prev + 1);
    }, []);

    const connectToSocketServer = useCallback(() => {
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', roomKeyRef.current);
            socketIdRef.current = socketRef.current.id;

            socketRef.current.on('chat-message', addMessage);

            socketRef.current.on('hand-raised', (socketId, uname) => {
                setRaisedHands(prev => ({ ...prev, [socketId]: uname }));
                setTimeout(() => setRaisedHands(prev => {
                    const n = { ...prev }; delete n[socketId]; return n;
                }), 5000);
            });

            socketRef.current.on('reaction', (emoji, socketId) => {
                const id = `${socketId}-${Date.now()}`;
                const x  = 20 + Math.random() * 60;
                setActiveReactions(prev => [...prev, { id, emoji, x }]);
                setTimeout(() => setActiveReactions(prev => prev.filter(r => r.id !== id)), 2200);
            });

            socketRef.current.on('user-label', (socketId, uname) => {
                setVideoLabels(prev => ({ ...prev, [socketId]: uname }));
            });

            socketRef.current.on('user-left', (id) => {
                setVideos(prev => prev.filter(v => v.socketId !== id));
                setVideoLabels(prev => { const n = { ...prev }; delete n[id]; return n; });
                setRaisedHands(prev => { const n = { ...prev }; delete n[id]; return n; });
            });

            socketRef.current.on('user-joined', (id, clients) => {
                clients.forEach(socketListId => {
                    const conn = new RTCPeerConnection(peerConfigConnections);
                    connectionsRef.current[socketListId] = conn;

                    conn.onicecandidate = (event) => {
                        if (event.candidate) {
                            socketRef.current.emit('signal', socketListId,
                                JSON.stringify({ ice: event.candidate }));
                        }
                    };

                    conn.onaddstream = (event) => {
                        const exists = videoRef.current.find(v => v.socketId === socketListId);
                        if (exists) {
                            setVideos(prev => {
                                const updated = prev.map(v =>
                                    v.socketId === socketListId ? { ...v, stream: event.stream } : v
                                );
                                videoRef.current = updated;
                                return updated;
                            });
                        } else {
                            const newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };
                            setVideos(prev => {
                                const updated = [...prev, newVideo];
                                videoRef.current = updated;
                                return updated;
                            });
                        }
                    };

                    const localStream = window.localStream ?? blackSilence();
                    if (!window.localStream) window.localStream = localStream;
                    conn.addStream(localStream);
                });

                if (id === socketIdRef.current) {
                    Object.entries(connectionsRef.current).forEach(([id2, conn]) => {
                        if (id2 === socketIdRef.current) return;
                        try { conn.addStream(window.localStream); } catch {}
                        conn.createOffer()
                            .then(desc => conn.setLocalDescription(desc))
                            .then(() => socketRef.current?.emit('signal', id2,
                                JSON.stringify({ sdp: connectionsRef.current[id2].localDescription })))
                            .catch(console.warn);
                    });
                    socketRef.current.emit('user-label', socketIdRef.current, username);
                }
            });
        });
    }, [gotMessageFromServer, addMessage, username]);

    // ── Handlers ──────────────────────────────
    const handleVideo  = () => setVideo(v => !v);
    const handleAudio  = () => setAudio(a => !a);
    const handleScreen = () => setScreen(s => !s);

    const handleEndCall = () => {
        if (isRecording) stopRecording();
        try { localVideoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); } catch {}
        socketRef.current?.disconnect();
        window.location.href = "/";
    };

    const toggleChat = () => {
        setShowChat(prev => { if (!prev) setNewMessages(0); return !prev; });
    };

    const handleRaiseHand = () => {
        const next = !handRaised;
        setHandRaised(next);
        if (next) socketRef.current?.emit('hand-raised', socketIdRef.current, username);
    };

    const sendReaction = (emoji) => {
        socketRef.current?.emit('reaction', emoji, socketIdRef.current);
        const id = `local-${Date.now()}`;
        const x  = 20 + Math.random() * 60;
        setActiveReactions(prev => [...prev, { id, emoji, x }]);
        setTimeout(() => setActiveReactions(prev => prev.filter(r => r.id !== id)), 2200);
        setShowReactions(false);
    };

    const connect = () => {
        setAskForUsername(false);
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    };

    const handleMessageKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    };

    const sendMessage = () => {
        if (!message.trim()) return;
        socketRef.current?.emit('chat-message', message.trim(), username);
        setMessage("");
    };

    const formatTime = (date) =>
        date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    // ══════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════
    return (
        <div>

            {/* ── LOBBY ── */}
            {askForUsername ? (
                <div className={styles.lobbyContainer}>
                    <div className={styles.lobbyPreview}>
                        <video ref={localVideoRef} autoPlay muted />
                        <div className={styles.lobbyPreviewBadge}>Camera preview</div>
                    </div>
                    <div className={styles.lobbyForm}>
                        <div className={styles.lobbyFormHeader}>
                            <h2>Ready to join?</h2>
                            <p>Enter your name to join the meeting</p>
                        </div>
                        <div className={styles.lobbyFormFields}>
                            <TextField
                                label="Your name"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && username.trim() && connect()}
                                variant="outlined"
                                fullWidth
                                autoFocus
                            />
                        </div>
                        <Button variant="contained" onClick={connect} disabled={!username.trim()}>
                            Join Now
                        </Button>
                        <div className={styles.lobbyFormDivider}><span>devices</span></div>
                        <div className={styles.lobbyDeviceToggles}>
                            <button className={`${styles.lobbyDeviceBtn} ${videoAvailable ? styles.active : ''}`}>
                                {videoAvailable ? '📷' : '🚫'} Camera
                            </button>
                            <button className={`${styles.lobbyDeviceBtn} ${audioAvailable ? styles.active : ''}`}>
                                {audioAvailable ? '🎙️' : '🚫'} Mic
                            </button>
                        </div>
                    </div>
                </div>
            ) : (

                /* ── MEETING ── */
                <div className={styles.meetVideoContainer}>

                    {/* Floating reactions */}
                    <div className={styles.reactionsOverlay}>
                        {activeReactions.map(r => (
                            <span key={r.id} className={styles.floatingReaction} style={{ left: `${r.x}%` }}>
                                {r.emoji}
                            </span>
                        ))}
                    </div>

                    {/* Raised hand toasts */}
                    <div className={styles.raisedHandsContainer}>
                        {Object.entries(raisedHands).map(([sid, uname]) => (
                            <div key={sid} className={styles.raisedHandToast}>
                                ✋ <strong>{uname || 'Someone'}</strong> raised their hand
                            </div>
                        ))}
                    </div>

                    {/* ── Recording indicator (top-right) ── */}
                    {isRecording && (
                        <div style={{
                            position: 'fixed',
                            top: '16px',
                            right: '20px',
                            zIndex: 999,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(255,60,60,0.4)',
                            borderRadius: '99px',
                            padding: '6px 14px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                            boxShadow: '0 0 12px rgba(255,40,40,0.35)',
                        }}>
                            <span style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: '#ff3c3c',
                                animation: 'recPulse 1.1s ease-in-out infinite',
                                flexShrink: 0,
                            }} />
                            <style>{`@keyframes recPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.75)}}`}</style>
                            REC {formatRecTime(recordingTime)}
                        </div>
                    )}

                    {/* ── Download banner ── */}
                    {!isRecording && recordedBlob && (
                        <div style={{
                            position: 'fixed',
                            top: '16px',
                            right: '20px',
                            zIndex: 999,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(20,30,20,0.92)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(20,200,100,0.35)',
                            borderRadius: '12px',
                            padding: '10px 16px',
                            color: '#fff',
                            fontSize: '0.85rem',
                            boxShadow: '0 0 20px rgba(20,200,100,0.2)',
                        }}>
                            <span>🎬 Recording ready</span>
                            <Button
                                size="small"
                                variant="contained"
                                startIcon={<DownloadIcon />}
                                onClick={downloadRecording}
                                style={{
                                    background: 'linear-gradient(135deg,#14c864,#0a9048)',
                                    color: '#fff',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    borderRadius: '8px',
                                }}
                            >
                                Download
                            </Button>
                            <IconButton
                                size="small"
                                onClick={() => setRecordedBlob(null)}
                                style={{ color: 'rgba(255,255,255,0.4)' }}
                            >
                                ✕
                            </IconButton>
                        </div>
                    )}

                    {/* ── Chat panel ── */}
                    {showChat && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>
                                    Chat
                                    <IconButton
                                        size="small"
                                        onClick={toggleChat}
                                        style={{ color: 'rgba(238,238,244,0.5)', marginLeft: 'auto', float: 'right' }}
                                    >
                                        ✕
                                    </IconButton>
                                </h1>
                                <div className={styles.chattingDisplay}>
                                    {messages.length === 0
                                        ? <p>No messages yet</p>
                                        : messages.map((item, i) => (
                                            <div key={i}>
                                                <p>{item.sender}</p>
                                                <p>{item.data}</p>
                                                <span className={styles.msgTime}>{formatTime(item.time)}</span>
                                            </div>
                                        ))
                                    }
                                    <div ref={chatBottomRef} />
                                </div>
                                <div className={styles.chattingArea}>
                                    <TextField
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        onKeyDown={handleMessageKeyDown}
                                        label="Message"
                                        variant="outlined"
                                        size="small"
                                        multiline
                                        maxRows={3}
                                    />
                                    <Button
                                        variant='contained'
                                        onClick={sendMessage}
                                        disabled={!message.trim()}
                                    >
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Control bar ── */}
                    <div className={styles.buttonContainers}>

                        {/* Camera toggle */}
                        <Tooltip title={video ? "Turn off camera" : "Turn on camera"} placement="top">
                            <IconButton onClick={handleVideo} style={{ color: "white" }}>
                                {video ? <VideocamIcon /> : <VideocamOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {/* End call */}
                        <Tooltip title="End call" placement="top">
                            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
                                <CallEndIcon />
                            </IconButton>
                        </Tooltip>

                        {/* Mic toggle */}
                        <Tooltip title={audio ? "Mute" : "Unmute"} placement="top">
                            <IconButton onClick={handleAudio} style={{ color: "white" }}>
                                {audio ? <MicIcon /> : <MicOffIcon />}
                            </IconButton>
                        </Tooltip>

                        {/* Screen share — FIXED: icons ab sahi hain */}
                        {screenAvailable && (
                            <Tooltip title={screen ? "Stop sharing" : "Share screen"} placement="top">
                                <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                    {screen
                                        ? <StopScreenShareIcon />   // sharing chal rahi hai → cross wala icon
                                        : <ScreenShareIcon />       // sharing nahi → normal share icon
                                    }
                                </IconButton>
                            </Tooltip>
                        )}

                        {/* Raise hand */}
                        <Tooltip title={handRaised ? "Lower hand" : "Raise hand"} placement="top">
                            <IconButton
                                onClick={handleRaiseHand}
                                style={{ color: handRaised ? "#FF9839" : "white" }}
                            >
                                <PanToolIcon />
                            </IconButton>
                        </Tooltip>

                        {/* Reactions */}
                        <div style={{ position: 'relative' }}>
                            {showReactions && (
                                <div className={styles.reactionPicker}>
                                    {REACTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            className={styles.reactionBtn}
                                            onClick={() => sendReaction(emoji)}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <Tooltip title="Reactions" placement="top">
                                <IconButton
                                    onClick={() => setShowReactions(v => !v)}
                                    style={{ color: "white", fontSize: '1.3rem' }}
                                >
                                    😊
                                </IconButton>
                            </Tooltip>
                        </div>

                        {/* ── Record button — FIXED ── */}
                        <Tooltip
                            title={isRecording
                                ? `Stop recording (${formatRecTime(recordingTime)})`
                                : "Start recording"
                            }
                            placement="top"
                        >
                            <IconButton
                                onClick={isRecording ? stopRecording : startRecording}
                                style={{
                                    color: '#E24B4A',   // hamesha red — dono states mein
                                    position: 'relative',
                                }}
                            >
                                {/* 
                                    isRecording = true  → StopIcon (■) dikhao — click karne se recording band
                                    isRecording = false → FiberManualRecordIcon (●) dikhao — click karne se shuru
                                */}
                                {isRecording
                                    ? <StopIcon />
                                    : <FiberManualRecordIcon />
                                }

                                {/* Pulsing ring — sirf tab jab recording chal rahi ho */}
                                {isRecording && (
                                    <span style={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: '50%',
                                        border: '2px solid #E24B4A',
                                        animation: 'recRing 1.1s ease-in-out infinite',
                                        pointerEvents: 'none',
                                    }} />
                                )}
                                <style>{`@keyframes recRing{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0;transform:scale(1.5)}}`}</style>
                            </IconButton>
                        </Tooltip>

                        {/* Chat toggle */}
                        <Tooltip title="Chat" placement="top">
                            <Badge badgeContent={newMessages} max={99} color="warning">
                                <IconButton onClick={toggleChat} style={{ color: "white" }}>
                                    <ChatIcon />
                                </IconButton>
                            </Badge>
                        </Tooltip>

                    </div>

                    {/* ── Self video ── */}
                    <div className={styles.selfVideoWrapper}>
                        <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted />
                        {username && (
                            <span className={styles.videoLabel}>
                                {handRaised && '✋ '}{username} (You)
                            </span>
                        )}
                    </div>

                    {/* ── Remote videos ── */}
                    <div className={styles.conferenceView}>
                        {videos.map((vid) => (
                            <div key={vid.socketId} className={styles.videoTile}>
                                <video
                                    data-socket={vid.socketId}
                                    ref={ref => { if (ref && vid.stream) ref.srcObject = vid.stream; }}
                                    autoPlay
                                    playsInline
                                />
                                <span className={styles.videoLabel}>
                                    {raisedHands[vid.socketId] ? '✋ ' : ''}
                                    {videoLabels[vid.socketId] || 'Guest'}
                                </span>
                            </div>
                        ))}
                    </div>

                </div>
            )}
        </div>
    );
}