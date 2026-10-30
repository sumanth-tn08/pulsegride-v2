import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { LoginPage } from './pages/LoginPage';

// PHC Portal Pages
import { PHCLayout } from './pages/phc/PHCLayout';
import { PHCDashboard } from './pages/phc/PHCDashboard';
import { PHCMedicines } from './pages/phc/PHCMedicines';
import { PHCBeds } from './pages/phc/PHCBeds';
import { PHCAssistant } from './pages/phc/PHCAssistant';

// Health Administrator Portal Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPHCs } from './pages/admin/AdminPHCs';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminPredictions } from './pages/admin/AdminPredictions';
import { AdminInvestigation } from './pages/admin/AdminInvestigation';
import { AdminApprovals } from './pages/admin/AdminApprovals';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default Route -> /login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* 1. PHC Portal */}
        <Route path="/phc" element={<PHCLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PHCDashboard />} />
          <Route path="medicines" element={<PHCMedicines />} />
          <Route path="beds" element={<PHCBeds />} />
          <Route path="assistant" element={<PHCAssistant />} />
        </Route>

        {/* 2. Health Administrator Portal */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="phcs" element={<AdminPHCs />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="predictions" element={<AdminPredictions />} />
          <Route path="investigation" element={<AdminInvestigation />} />
          <Route path="approvals" element={<AdminApprovals />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

