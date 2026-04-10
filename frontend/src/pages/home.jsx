import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { Button, IconButton, TextField, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import RestoreIcon from '@mui/icons-material/Restore';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {

    let navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");

    // Guest invite state
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

    const { addToUserHistory, generateGuestInvite } = useContext(AuthContext);

    let handleJoinVideoCall = async () => {
        await addToUserHistory(meetingCode)
        // Encode the meeting code so the raw ID is not visible in the URL
        const encodedCode = btoa(meetingCode);
        navigate(`/${encodedCode}`)
    }

    const handleGenerateGuestLink = async () => {
        if (!meetingCode.trim()) {
            setSnackbar({ open: true, message: "Pehle Meeting Code enter karo!", severity: "warning" });
            return;
        }

        setInviteLoading(true);
        setGeneratedLink("");

        try {
            const result = await generateGuestInvite(meetingCode.trim());
            const encodedRoom = btoa(meetingCode.trim());
            const link = `${window.location.origin}/${encodedRoom}?guestToken=${result.guestToken}`;
            setGeneratedLink(link);
            setInviteDialogOpen(true);
        } catch (err) {
            console.error("Guest invite error:", err);
            setSnackbar({ open: true, message: "Guest link generate karne mein error aaya!", severity: "error" });
        } finally {
            setInviteLoading(false);
        }
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(generatedLink).then(() => {
            setSnackbar({ open: true, message: "Link copied! Ab guest ko share karo 🎉", severity: "success" });
        }).catch(() => {
            setSnackbar({ open: true, message: "Copy failed — manually select karke copy karo", severity: "warning" });
        });
    }

    return (
        <>
            <div className="navBar">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <h2>Vaani Video Call</h2>
                </div>

                <div style={{ display: "flex", alignItems: "center" }}>
                    <IconButton onClick={() => navigate("/history")}>
                        <RestoreIcon />
                    </IconButton>
                    <p>History</p>

                    <Button onClick={() => {
                        localStorage.removeItem("token")
                        navigate("/auth")
                    }}>
                        Logout
                    </Button>
                </div>
            </div>

            <div className="meetContainer">
                <div className="leftPanel">
                    <div>
                        <h2>Providing Quality Video Call Just Like Quality Education</h2>

                        <div style={{ display: 'flex', gap: "10px", flexWrap: 'wrap' }}>
                            <TextField
                                onChange={e => setMeetingCode(e.target.value)}
                                id="outlined-basic"
                                label="Meeting Code"
                                variant="outlined"
                            />
                            <Button onClick={handleJoinVideoCall} variant='contained'>Join</Button>
                            <Button
                                onClick={handleGenerateGuestLink}
                                variant='outlined'
                                startIcon={inviteLoading ? <CircularProgress size={18} /> : <PersonAddIcon />}
                                disabled={inviteLoading || !meetingCode.trim()}
                                sx={{
                                    borderColor: '#14c864',
                                    color: '#14c864',
                                    '&:hover': {
                                        borderColor: '#0a9048',
                                        background: 'rgba(20,200,100,0.08)',
                                    }
                                }}
                            >
                                Invite Guest
                            </Button>
                        </div>
                    </div>
                </div>
                <div className='rightPanel'>
                    <img srcSet='/logo3.png' alt="" />
                </div>
            </div>

            {/* ── Guest Invite Link Dialog ── */}
            <Dialog
                open={inviteDialogOpen}
                onClose={() => setInviteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        background: 'linear-gradient(145deg, #0a1628, #0d1f3c)',
                        color: '#fff',
                        borderRadius: '16px',
                        border: '1px solid rgba(20,200,100,0.2)',
                    }
                }}
            >
                <DialogTitle sx={{ color: '#14c864', fontWeight: 700 }}>
                    🔗 Guest Invite Link Generated!
                </DialogTitle>
                <DialogContent>
                    <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '12px', fontSize: '0.9rem' }}>
                        Yeh link sirf <strong style={{ color: '#ff9839' }}>1 baar</strong> use ho sakta hai aur <strong style={{ color: '#ff9839' }}>30 minute</strong> mein expire ho jayega.
                        Sirf usi ko share karo jisko meeting mein add karna hai.
                    </p>
                    <div style={{
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(20,200,100,0.15)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        wordBreak: 'break-all',
                        fontSize: '0.82rem',
                        color: 'rgba(255,255,255,0.85)',
                        fontFamily: 'monospace',
                        maxHeight: '120px',
                        overflow: 'auto',
                    }}>
                        {generatedLink}
                    </div>
                </DialogContent>
                <DialogActions sx={{ padding: '12px 24px 20px' }}>
                    <Button
                        onClick={() => setInviteDialogOpen(false)}
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                    >
                        Close
                    </Button>
                    <Button
                        onClick={handleCopyLink}
                        variant="contained"
                        startIcon={<ContentCopyIcon />}
                        sx={{
                            background: 'linear-gradient(135deg, #14c864, #0a9048)',
                            fontWeight: 700,
                            borderRadius: '10px',
                            textTransform: 'none',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #0a9048, #14c864)',
                            }
                        }}
                    >
                        Copy Link
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Snackbar notifications ── */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ width: '100%', borderRadius: '10px' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    )
}

export default withAuth(HomeComponent)