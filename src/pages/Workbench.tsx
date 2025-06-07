import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ProfessionalBuyerChat from "@/components/ProfessionalBuyerChat";

const Workbench = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <ProfessionalBuyerChat onLogout={handleLogout} />
  );
};

export default Workbench;