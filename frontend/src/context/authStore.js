import { create } from 'zustand';
import { authAPI, usersAPI } from '../api';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isLoading: false,
  isInitializing: !!localStorage.getItem('token'),
  error: null,

  fetchUser: async () => {
    set({ isInitializing: true });
    try {
      const response = await usersAPI.getProfile();
      set({ user: response.data.user || response.data, isInitializing: false });
    } catch {
      localStorage.removeItem('token');
      set({ user: null, token: null, isInitializing: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      localStorage.setItem('token', response.data.token);
      set({
        user: response.data.user,
        token: response.data.token,
        isLoading: false,
      });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      localStorage.setItem('token', response.data.token);
      set({
        user: response.data.user,
        token: response.data.token,
        isLoading: false,
      });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  clearError: () => set({ error: null }),
}));
