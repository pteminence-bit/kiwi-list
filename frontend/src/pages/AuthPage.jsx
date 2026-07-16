import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AuthPage = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Firebase handles Login
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Firebase handles Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        
        // POST to backend to trigger Firestore document creation
        const response = await fetch(`https://kiwi-list-api.onrender.com/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName }),
        });

        if (!response.ok) throw new Error("Account created, but database sync failed.");
        
        alert("Verification email sent! Please check your inbox and refresh after verifying.");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-white">
        <h1 className="text-3xl font-extrabold text-center text-blue-400 mb-8">KIWI-list</h1>
        {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <input type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl" />
          )}
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl" />
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl" />
          <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-sm text-blue-400">{isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}</button>
      </div>
    </div>
  );
};

export default AuthPage;