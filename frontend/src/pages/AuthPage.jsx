import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { LogIn, UserPlus } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        // Authenticate existing user
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Register new user profile account
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      // Format common Firebase error messages nicely
      const cleanError = err.message.replace('Firebase: ', '').replace(/auth\/|-/g, ' ');
      setError(cleanError.charAt(0).toUpperCase() + cleanError.slice(1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-blue-400">KIWI-list</h1>
          <p className="text-sm text-slate-400 mt-2">
            {isLogin ? 'Welcome back! Log into your account' : 'Create your marketplace developer profile'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-200 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 text-sm text-slate-200 transition"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/10"
          >
            {loading ? (
              <span>Processing...</span>
            ) : isLogin ? (
              <>
                <LogIn size={18} /> <span>Sign In</span>
              </>
            ) : (
              <>
                <UserPlus size={18} /> <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-800 pt-6">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-sm text-blue-400 hover:text-blue-300 transition font-medium"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
