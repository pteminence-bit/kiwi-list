import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    
    // Choose the target endpoint based on state
    const endpoint = isRegister ? '/auth/signup' : '/auth/login';
    const backendUrl = `https://kiwi-list-api.onrender.com${endpoint}`;

    try {
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (isRegister) {
        // Sign-up successful. Prompt user to log in or handle confirmation message
        alert("Account initialized successfully! Please switch to Sign In to authenticate.");
        setIsRegister(false);
      } else {
        // Login successful. Use the custom generated token from your backend to sign in locally
        await signInWithCustomToken(auth, data.token);
        navigate('/');
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">KIWI-list</h2>
        <p className="text-slate-500 text-center mb-8">
          {isRegister ? 'Create your account' : 'Welcome back, sign in'}
        </p>

        <form onSubmit={handleAuth} className="space-y-4">
          <input 
            type="email" placeholder="Email Address" required
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Password" required
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
            {isRegister ? 'Register' : 'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button onClick={() => setIsRegister(!isRegister)} className="ml-1 text-blue-600 font-bold">
            {isRegister ? 'Login' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;