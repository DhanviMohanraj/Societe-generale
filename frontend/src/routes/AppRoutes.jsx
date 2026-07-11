import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Workspace from '../pages/Workspace';
import PolicyLibrary from '../pages/PolicyLibrary';
import PolicyViewer from '../pages/PolicyViewer';
import ConflictAnalysis from '../pages/ConflictAnalysis';
import DashboardLayout from '../layouts/DashboardLayout';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Authenticated routes wrapped in DashboardLayout with corresponding titles */}
      <Route element={<DashboardLayout pageTitle="Lexora Workspace" />}>
        <Route path="/workspace" element={<Workspace />} />
      </Route>
      
      <Route element={<DashboardLayout pageTitle="Policy Library" />}>
        <Route path="/policies" element={<PolicyLibrary />} />
      </Route>

      <Route element={<DashboardLayout pageTitle="Policy Viewer" />}>
        <Route path="/policies/:id" element={<PolicyViewer />} />
      </Route>
      
      <Route element={<DashboardLayout pageTitle="Conflict Analysis" />}>
        <Route path="/conflicts" element={<ConflictAnalysis />} />
      </Route>
      
      {/* Fallback routing */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
