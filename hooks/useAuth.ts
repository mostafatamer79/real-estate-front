import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { needsProfileCompletion } from '@/lib/profile-completion';

interface AuthData {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  needsProfileCompletion: boolean;
}

export function useAuth() {
  const [authData, setAuthData] = useState<AuthData>({
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true,
    needsProfileCompletion: false,
  });

  useEffect(() => {
    let cancelled = false;
    let token: string | null = null;
    let refreshToken: string | null = null;
    let parsedUser: User | null = null;
    try {
      const user = localStorage.getItem('user');
      token = localStorage.getItem('token');
      refreshToken = localStorage.getItem('refreshToken');
      parsedUser = user ? JSON.parse(user) : null;
    } catch {
      // Treat unavailable or malformed stored auth as a visitor session.
      token = null;
      refreshToken = null;
      parsedUser = null;
    }

    // Check if user needs to complete profile
    const needsCompletion = needsProfileCompletion(parsedUser);

    queueMicrotask(() => {
      if (cancelled) return;
      setAuthData({
        user: parsedUser,
        token,
        refreshToken,
        isLoading: false,
        needsProfileCompletion: needsCompletion,
      });
    });
    return () => { cancelled = true; };
  }, []);

  const updateUser = (updatedUser: Partial<User>) => {
    const currentUser = authData.user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));

      setAuthData(prev => ({
        ...prev,
        user: newUser,
        needsProfileCompletion: needsProfileCompletion(newUser)
      }));
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setAuthData({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      needsProfileCompletion: false,
    });
    window.location.href = '/'; 
  };

  return {
    ...authData,
    updateUser,
    logout,
    isAuthenticated: !!authData.token,
  };
}
