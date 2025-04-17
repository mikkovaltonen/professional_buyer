import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Workbench from "./pages/Workbench";
import LoginForm from "./components/LoginForm";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from 'react';

const App = () => {
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('🧪 App mounted - Testing Vercel logs');
    console.log('Auth state:', { user, loading, isAuthenticated });
  }, [user, loading, isAuthenticated]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginForm />} />
        <Route 
          path="/workbench" 
          element={isAuthenticated ? <Workbench /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
