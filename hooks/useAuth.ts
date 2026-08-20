import { useState, useEffect } from 'react';
import { User, Role } from '@/types/user';

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
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');

    const parsedUser = user ? JSON.parse(user) : null;

    // Check if user needs to complete profile
    let needsProfileCompletion = false;
    if (parsedUser) {
      if (parsedUser.role !== Role.ADMIN) {
        const isProfileComplete = !!parsedUser.firstName && parsedUser.role !== Role.VIEWER;

        const isAgentWithoutLicense =
          parsedUser.role === Role.AGENT &&
          !parsedUser.agentLicenseNumber;

        needsProfileCompletion = !isProfileComplete || isAgentWithoutLicense;
      }
    }

    setAuthData({
      user: parsedUser,
      token,
      refreshToken,
      isLoading: false,
      needsProfileCompletion,
    });
  }, []);

  const updateUser = (updatedUser: Partial<User>) => {
    const currentUser = authData.user;
    if (currentUser) {
      const newUser = { ...currentUser, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(newUser));

      let needsProfileCompletion = false;
      if (newUser.role !== Role.ADMIN) {
        const isProfileComplete = !!newUser.firstName && newUser.role !== Role.VIEWER;

        const isAgentWithoutLicense =
          newUser.role === Role.AGENT &&
          !newUser.agentLicenseNumber;

        needsProfileCompletion = !isProfileComplete || isAgentWithoutLicense;
      }

      setAuthData(prev => ({
        ...prev,
        user: newUser,
        needsProfileCompletion
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