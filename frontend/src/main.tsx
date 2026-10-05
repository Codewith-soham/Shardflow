import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ProjectProvider } from '@/app/providers/ProjectProvider';
import { ToastProvider } from '@/components/feedback/Toast';
import { AppRouter } from '@/app/router';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <ProjectProvider>
          <ToastProvider>
            <AppRouter />
          </ToastProvider>
        </ProjectProvider>
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);
