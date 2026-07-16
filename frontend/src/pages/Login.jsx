import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      if (isRegister) {
        // 1. Create User in Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        
        // 2. Dispatch Verification Email
        await sendEmailVerification(userCredential.user);

        // 3. Sync with your Backend to initialize Firestore user doc
        await fetch(`https://kiwi-list-api.onrender.com/api/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName }),
        });
        
        alert("Account initialized successfully! Verification email dispatched. Please verify before signing in.");
        setIsRegister(false); // Force switch to login view
      } else {
        // Sign in via Firebase Client SDK
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          alert("Please verify your email address before accessing the dashboard.");
          return;
        }
        
        navigate('/');
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert(error.message || "Authentication failed.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-2 h-6 bg-blue-500 rounded-full" />
          <h2 className="text-3xl font-black text-white tracking-tight">KIWI-list</h2>
        </div>
        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider text-center mb-8">
          {isRegister ? 'Create your platform account' : 'Welcome back, sign in'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <input 
              type="text" placeholder="Full Name" required
              value={displayName}
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 outline-none text-sm transition"
              onChange={(e) => setDisplayName(e.target.value)}
            />
          )}
          <input 
            type="email" placeholder="Email Address" required
            value={email}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 outline-none text-sm transition"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            value={password}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-white focus:border-blue-500 outline-none text-sm transition"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            disabled={isAuthenticating}
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm tracking-wide"
          >
            {isAuthenticating ? 'Authenticating...' : isRegister ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400 font-medium">
          {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
          <button 
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setEmail('');
              setPassword('');
              setDisplayName('');
            }} 
            className="ml-1 text-blue-500 font-bold hover:underline"
          >
            {isRegister ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;