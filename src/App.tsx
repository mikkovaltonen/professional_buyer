import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Workbench from "./pages/Workbench";
import LoginForm from "./components/LoginForm";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from 'react';

const AppRoutes = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    // console.log('🧪 App mounted - Testing Vercel logs');
    // console.log('[App.tsx] Auth state:', { user, loading });
  }, [user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route 
        path="/login" 
        element={
          user?.isAuthenticated ? (
            <Navigate to="/workbench" replace /> 
          ) : (
            <LoginForm />
          )
        } 
      />
      <Route 
        path="/workbench" 
        element={
          <ProtectedRoute>
            <Workbench />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter 
      basename="/"
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppRoutes />
    </BrowserRouter>
  );
};

export default App;
