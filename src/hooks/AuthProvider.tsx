import { createContext, ReactNode, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:8080';

type AuthContextType = {
  token: string | null;
  refreshToken: string | null;
  login: (user: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  register: (user: { email: string; password: string }) => Promise<boolean>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
};

type TokenResponse = {
  tokenType: string;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem('refreshToken')
  );
  const navigate = useNavigate();

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          refreshToken
        })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data: TokenResponse = await response.json();
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      logout();
      navigate('/');
      throw error;
    }
  }, [token, refreshToken, navigate]);

  const register = async (user: { email: string; password: string }): Promise<boolean> => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return true;
  };

  const login = async (user: { email: string; password: string }) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(user)
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data: TokenResponse = await response.json();
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    navigate('/dashboard');
  };

  const forgotPassword = async (email: string) => {
    const response = await fetch(`${API_URL}/forgotPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    if (!response.ok) {
      throw new Error('Failed to process forgot password request');
    }
  };

  const resetPassword = async (email: string, token: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/resetPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, token, newPassword })
    });

    if (!response.ok) {
      throw new Error('Failed to reset password');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setToken(null);
    setRefreshToken(null);
    navigate('/');
  };

  const api = useCallback(
    async (url: string, options: RequestInit = {}) => {
      let currentToken = token;

      if (currentToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${currentToken}`
        };
      }

      let response = await fetch(url, options);

      if (response.status === 401 && refreshToken) {
        try {
          currentToken = await refreshAccessToken();
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${currentToken}`
          };
          response = await fetch(url, options);
        } catch (error) {
          console.error('Error refreshing token:', error);
          throw error;
        }
      }

      if (!response.ok) {
        throw new Error('Request failed');
      }

      return response;
    },
    [token, refreshToken, refreshAccessToken]
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshToken,
        register,
        login,
        logout,
        resetPassword,
        forgotPassword
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
