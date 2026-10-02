import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Customer Web App Pages
import { LandingPage } from './pages/LandingPage';
import { ShortletsBrowsePage } from './pages/shortlets/ShortletsBrowsePage';
import { ShortletDetailPage } from './pages/shortlets/ShortletDetailPage';
import { ListingDetailPage } from './pages/listings/ListingDetailPage';
import { CleaningCalculatorPage } from './pages/cleaning/CleaningCalculatorPage';
import { UtilitiesPage } from './pages/utilities/UtilitiesPage';
import { UserDashboardPage } from './pages/dashboard/UserDashboardPage';
import { PrivacyPolicyPage } from './pages/legal/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/legal/TermsOfServicePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/shortlets" element={<ShortletsBrowsePage />} />
              <Route path="/shortlets/:type/:id" element={<ShortletDetailPage />} />
              <Route path="/listings/:id" element={<ListingDetailPage />} />
              <Route path="/cleaning" element={<CleaningCalculatorPage />} />
              <Route path="/utilities" element={<UtilitiesPage />} />
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
