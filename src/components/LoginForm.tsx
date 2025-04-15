import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';

const LoginForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(formData.email, formData.password);
    if (success) {
      navigate('/workbench');
    } else {
      setError('Virheellinen sähköposti tai salasana');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Sähköposti</Label>
        <Input
          id="email"
          type="email"
          placeholder="Syötä sähköpostiosoitteesi"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Salasana</Label>
        <Input
          id="password"
          type="password"
          placeholder="Syötä salasanasi"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
        />
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button 
        type="submit" 
        className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-white"
      >
        Kirjaudu sisään
      </Button>
    </form>
  );
};

export default LoginForm; 