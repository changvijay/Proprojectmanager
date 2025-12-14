import { LoginResponse, User } from '../types';
import { mockDb } from './mockDb';

export const authService = {
  login: async (username: string): Promise<LoginResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const user = mockDb.getUserByUsername(username);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Generate a fake JWT
    // Structure: header.payload.signature
    const payload = btoa(JSON.stringify({
      id: user.id,
      role: user.role,
      exp: Date.now() + 3600000 // 1 hour
    }));
    const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${payload}.fakeSignature123456`;

    return { user, token };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getUserFromToken: (token: string): User | null => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const users = mockDb.getUsers();
      return users.find(u => u.id === payload.id) || null;
    } catch (e) {
      return null;
    }
  }
};