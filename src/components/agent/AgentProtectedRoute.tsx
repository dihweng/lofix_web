import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAgentAuth } from '../../context/AgentAuthContext';
import { AgentSidebar } from './AgentSidebar';
import { AgentHeader } from './AgentHeader';

export const AgentProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAgentAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-500">Authenticating Agent Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AgentSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AgentHeader />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
