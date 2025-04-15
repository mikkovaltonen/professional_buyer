import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Workbench from "./pages/Workbench";
import LoginForm from "./components/LoginForm";
import { useAuth } from "@/hooks/useAuth";

const App = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<LoginForm />} />
        <Route 
          path="/workbench" 
          element={user ? <Workbench /> : <Index />} 
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
