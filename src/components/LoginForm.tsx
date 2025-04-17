import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    
    console.log('🔐 Login form submitted with email:', formData.email);
    
    try {
      const success = await login(formData.email, formData.password);
      console.log('📝 Login attempt result:', success);
      
      if (success) {
        console.log('✅ Login successful, navigating to workbench...');
        navigate('/workbench');
      } else {
        console.log('❌ Login failed, showing error message');
        setError('Virheellinen sähköposti tai salasana');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      setError('Kirjautumisessa tapahtui virhe. Yritä uudelleen.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <Link to="/" className="flex flex-col items-center mb-6">
            <span className="text-3xl font-bold tracking-wider">WISESTEIN</span>
            <span className="text-[#4ADE80] text-sm">Supply Chain Management At Its Best.</span>
          </Link>
          <CardTitle className="text-2xl font-bold">Kirjaudu sisään</CardTitle>
          <p className="text-gray-500">Syötä tunnuksesi jatkaaksesi</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Sähköposti</Label>
              <Input
                id="email"
                type="email"
                placeholder="forecasting@kemppi.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Salasana</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                className="w-full"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-[#4ADE80] hover:bg-[#22C55E] text-white h-11"
            >
              Kirjaudu sisään
            </Button>
            <div className="text-center mt-4">
              <Link 
                to="/" 
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Takaisin etusivulle
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm; 