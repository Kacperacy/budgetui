import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from '@/pages/Home.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <div className="w-full h-full min-h-screen flex bg-primary justify-center">
        <Routes>
          <Route path="/" Component={Home} />
        </Routes>
      </div>
    </BrowserRouter>
  </StrictMode>
);
