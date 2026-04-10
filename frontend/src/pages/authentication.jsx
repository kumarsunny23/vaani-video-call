import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../config/firebase';

const defaultTheme = createTheme();

const SIGNIN_BG = 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200';
const SIGNUP_BG = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

export default function Authentication() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin, handleGoogleAuth } = React.useContext(AuthContext);

  const handleAuth = async () => {
    try {
      if (formState === 0) {
        await handleLogin(username, password);
      } else {
        let result = await handleRegister(name, username, password);
        setUsername(''); setPassword(''); setName('');
        setMessage(result);
        setOpen(true);
        setError('');
        setFormState(0);
      }
    } catch (err) {
      console.error("Auth Error: ", err);
      setError(err.response?.data?.message || err.message || 'Something went wrong');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await handleGoogleAuth(result.user.displayName, result.user.email, result.user.uid);
    } catch (err) {
      console.error("Google Auth Error: ", err);
      // It is important to know if firebase failed or our backend failed
      setError(err.response?.data?.message || err.message || 'Google sign-in failed. Please try again.');
    }
  };

  const isSignIn = formState === 0;
  const bgImage = isSignIn ? SIGNIN_BG : SIGNUP_BG;
  const overlayColor = isSignIn ? 'rgba(10, 20, 60, 0.65)' : 'rgba(60, 10, 80, 0.60)';

  return (
    <ThemeProvider theme={defaultTheme}>
      <Grid container component="main" sx={{ height: '100vh' }}>
        <CssBaseline />

        <Grid
          item xs={false} sm={4} md={7}
          sx={{
            position: 'relative',
            backgroundImage: `url(${bgImage})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: 'background-image 0.6s ease',
          }}
        >
          <Box sx={{
            position: 'absolute', inset: 0,
            backgroundColor: overlayColor,
            transition: 'background-color 0.6s ease',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'white', textAlign: 'center', px: 4,
          }}>
            {isSignIn ? (
              <>
                <Typography variant="h3" fontWeight={600} mb={1}>Welcome Back 👋</Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.82 }}>
                  Sign in to continue your conversations on Video Vaani
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h3" fontWeight={600} mb={1}>Get Started 🚀</Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.82 }}>
                  Join thousands already connecting on Video Vaani
                </Typography>
              </>
            )}
          </Box>
        </Grid>

        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <Box sx={{ my: 8, mx: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
              <LockOutlinedIcon />
            </Avatar>

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button variant={isSignIn ? 'contained' : 'outlined'} onClick={() => setFormState(0)}>Sign In</Button>
              <Button variant={!isSignIn ? 'contained' : 'outlined'} onClick={() => setFormState(1)}>Sign Up</Button>
            </Box>

            <Box sx={{ width: '100%' }}>
              {!isSignIn && (
                <TextField margin="normal" required fullWidth autoFocus
                  label="Full Name" value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
              <TextField margin="normal" required fullWidth
                label="Email / Username" value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <TextField margin="normal" required fullWidth
                label="Password" type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {isSignIn && (
                <Box sx={{ textAlign: 'right' }}>
                  <Link href="#" variant="body2">Forgot password?</Link>
                </Box>
              )}

              {error && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>{error}</Typography>
              )}

              <Button fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} onClick={handleAuth}>
                {isSignIn ? 'Sign In' : 'Create Account'}
              </Button>

              <Divider sx={{ my: 1 }}>or</Divider>

              <Button fullWidth variant="outlined"
                startIcon={<GoogleIcon />}
                sx={{ textTransform: 'none', borderColor: '#ddd', color: 'text.primary' }}
                onClick={handleGoogleLogin}
              >
                Continue with Google
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar open={open} autoHideDuration={4000} message={message} onClose={() => setOpen(false)} />
    </ThemeProvider>
  );
}