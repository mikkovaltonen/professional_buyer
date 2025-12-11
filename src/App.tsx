import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Workbench from "./pages/Workbench";
import IssueReportPage from "./pages/IssueReport";
import PurchaseRequisitionsPage from "./pages/PurchaseRequisitions";
import LoginForm from "./components/LoginForm";
import ProtectedRoute from "./components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<LoginForm />} />
      <Route 
        path="/workbench" 
        element={
          <ProtectedRoute>
            <Workbench />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/requisitions" 
        element={
          <ProtectedRoute>
            <PurchaseRequisitionsPage />
          </ProtectedRoute>
        }
      />
      <Route 
        path="/issues" 
        element={
          <ProtectedRoute>
            <IssueReportPage />
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
