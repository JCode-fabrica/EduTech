import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
type Role = 'admin' | 'coordenacao' | 'professor';

export default function ProtectedRoute({ allow }: { allow: Role[] }) {
  const { user, loading, hasRole } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(...allow)) return <Navigate to="/" replace />;
  return <Outlet />;
}
