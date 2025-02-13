import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

const Header = () => {
  return (
    <header className="flex justify-between items-center p-4">
      {/* ... other header content ... */}
      <div className="flex gap-4">
        <LoginForm />
        <RegisterForm />
      </div>
    </header>
  );
};

export default Header; 