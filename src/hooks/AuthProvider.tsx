// create auth provider
import { createContext, useContext, useState } from 'react';
import { User } from '@/types/user';
import { useNavigate } from 'react-router-dom';

type AuthContextType = {
  token: string | null;
  refreshToken: string | null;
  login: (user: User) => void;
  logout: () => void;
  register: (user: User) => void;
};

type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token') || '');
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem('refreshToken') || ''
  );
  const navigate = useNavigate();

  const register = async (user: User) => {
    try {
      const response = await fetch('http://localhost:8080/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });
      const res = (await response.json()) as AuthResponse;
      if (res) {
        setTokens(res);
        navigate('/dashboard');
        return;
      }
      throw new Error(res);
    } catch (err) {
      console.error(err);
    }
  };
  const login = async (user: User) => {
    try {
      const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user)
      });
      const res = (await response.json()) as AuthResponse;
      console.log(res);
      if (res) {
        setTokens(res);
        navigate('/dashboard');
        return;
      }
      throw new Error(res);
    } catch (err) {
      console.error(err);
    }
  };
  const logout = () => {
    setToken('');
  };

  const setTokens = (res: AuthResponse) => {
    setToken(res.accessToken);
    setRefreshToken(res.refreshToken);
    localStorage.setItem('token', res.accessToken);
    localStorage.setItem('refreshToken', res.refreshToken);
  };

  return (
    <AuthContext.Provider value={{ token, refreshToken, register, login, logout }}>
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
