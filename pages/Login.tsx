import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Loader2 } from 'lucide-react';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('admin'); // Default for easy testing
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username);
      navigate('/');
    } catch (err) {
      setError('Invalid credentials or user not found');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-center mb-6">
           <div className="bg-slate-900 p-3 rounded-lg">
              <CheckSquare className="h-10 w-10 text-blue-500" />
           </div>
        </div>
        <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-center text-gray-500 mb-8">Sign in to ProManage AI</p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username (Select Role)</label>
            <select 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
            >
              <option value="admin">Admin (Alice)</option>
              <option value="pm">Project Manager (Peter)</option>
              <option value="lead">Team Lead (Larry)</option>
              <option value="dev">Developer (Dave)</option>
              <option value="tester">Tester (Tina)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Simulating role-based login</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value="password"
              disabled
              className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm focus:outline-none sm:text-sm text-gray-500"
            />
             <p className="mt-1 text-xs text-gray-500">Any password works for this demo</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 transition-colors"
          >
            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};