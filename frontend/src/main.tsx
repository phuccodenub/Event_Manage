import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { NotificationProvider } from './context/NotificationContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DepartmentProvider } from './context/DepartmentContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <AuthProvider>
        <DepartmentProvider>
          <EventProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </EventProvider>
        </DepartmentProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
