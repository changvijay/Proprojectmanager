
import { LoginResponse, User } from '../types';
import { dbService } from './dbService';

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    // Verify credentials against the database
    const user = await dbService.verifyUser(username, password);
    
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

  getUserFromToken: async (token: string): Promise<User | null> => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (Date.now() > payload.exp) return null; // Expired
      
      const user = await dbService.getUserById(payload.id);
      return user || null;
    } catch (e) {
      return null;
    }
  }
};
