import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext';
import { EventProvider } from './context/EventContext';
import { CommunityProvider } from './context/CommunityContext';
import { NotificationProvider } from './context/NotificationContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { DepartmentProvider } from './context/DepartmentContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Luôn coi dữ liệu là cũ để đảm bảo khi invalidate sẽ refetch
      gcTime: 30 * 60 * 1000, // 30 phút (thời gian lưu trong garbage collector)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
        <AuthProvider>
          <DepartmentProvider>
            <EventProvider>
              <CommunityProvider>
                <NotificationProvider>
                  <App />
                </NotificationProvider>
              </CommunityProvider>
            </EventProvider>
          </DepartmentProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
