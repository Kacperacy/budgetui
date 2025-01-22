import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home.tsx';
import { AuthProvider } from '@/hooks/AuthProvider.tsx';
import PrivateRoute from '@/pages/PrivateRoute.tsx';
import Dashboard from '@/pages/Dashboard.tsx';
import Details from '@/pages/Details.tsx';
import { Toaster } from '@/components/ui/toaster';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <div className="w-full h-full min-h-screen flex bg-gradient justify-center text-primary-foreground">
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<PrivateRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/details/:id" element={<Details />} />
            </Route>
          </Routes>
          <Toaster />
        </AuthProvider>
      </div>
    </Router>
  </StrictMode>
);
