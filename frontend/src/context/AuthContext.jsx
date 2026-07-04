import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await authAPI.getMe();
          setUser(res.user);
          setProfile(res.profile);
          setStreak(res.streak);
        } catch (err) {
          console.error('Failed to load user:', err);
          logout();
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.login({ email, password });
      localStorage.setItem('token', res.token);
      
      // Load user profile detail immediately after token is stored
      const profileRes = await authAPI.getMe();
      setUser(profileRes.user);
      setProfile(profileRes.profile);
      setStreak(profileRes.streak);
      setLoading(false);
      return profileRes.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  const googleLogin = async (credential) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.googleLogin(credential);
      localStorage.setItem('token', res.token);

      // Load user profile detail immediately after token is stored
      const profileRes = await authAPI.getMe();
      setUser(profileRes.user);
      setProfile(profileRes.profile);
      setStreak(profileRes.streak);
      setLoading(false);
      return profileRes.user;
    } catch (err) {
      setError(err.message || 'Google login failed');
      setLoading(false);
      throw err;
    }
  };

  const register = async (signUpData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authAPI.register(signUpData);
      localStorage.setItem('token', res.token);

      // Load user profile details immediately
      const profileRes = await authAPI.getMe();
      setUser(profileRes.user);
      setProfile(profileRes.profile);
      setStreak(profileRes.streak);
      setLoading(false);
      return profileRes.user;
    } catch (err) {
      setError(err.message || 'Registration failed');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setProfile(null);
    setStreak(null);
    setError(null);
  };

  const updateProfileStats = (newCoins, newXp, newLevel, newBadges = null) => {
    if (profile) {
      const updatedProfile = {
        ...profile,
        coins: newCoins,
        xp: newXp,
        level: newLevel
      };
      if (newBadges) {
        updatedProfile.badges = newBadges;
      }
      setProfile(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        streak,
        loading,
        error,
        login,
        googleLogin,
        register,
        logout,
        updateProfileStats,
        setProfile,
        setStreak
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
