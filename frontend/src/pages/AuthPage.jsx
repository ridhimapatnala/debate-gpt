import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthForm = ({ setUser, setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // error message state
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // clear previous errors
    const endpoint = isLogin ? '/api/login' : '/api/register';

    try {
      const payload = isLogin
        ? { email, password }
        : { name, email, password };
      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);

      setUser(res.data.user);
      localStorage.setItem('token', res.data.token);
      setIsAuthenticated(true);
      navigate('/debate');
    } catch (err) {
      const msg = err.response?.data?.error || 'Something went wrong. Try again.';
      setError(msg); // display error in UI
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isLogin ? 'Login' : 'Register'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <input
            type="text"
            className="w-full border px-4 py-2 rounded"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          className="w-full border px-4 py-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          className="w-full border px-4 py-2 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-red-500 text-sm">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue text-white py-2 rounded hover:bg-blue-700"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <div className="text-center mt-4">
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="text-darkRed hover:underline"
        >
          {isLogin
            ? "Don't have an account? Register"
            : 'Already have an account? Login'}
        </button>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={() => navigate('/debate')}
          className="text-sm text-gray-500 underline hover:text-gray-600"
        >
          Continue without login
        </button>
      </div>
    </div>
  );
};

export default AuthForm;
