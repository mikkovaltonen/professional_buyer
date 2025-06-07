import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user?.isAuthenticated) {
      const from = (location.state as { from?: string })?.from || '/workbench';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let success;
      if (isRegistering) {
        success = await register(email, password);
        if (!success) {
          setError('Registration failed. Email may already be in use.');
        }
      } else {
        success = await login(email, password);
        if (!success) {
          setError('Invalid credentials');
        }
      }
      
      if (success) {
        const from = (location.state as { from?: string })?.from || '/workbench';
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('[LoginForm] Auth error:', err);
      setError('An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-indigo-200 shadow-xl">
        <CardHeader className="space-y-2 text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
          <Link to="/" className="flex flex-col items-center mb-6">
            <span className="text-3xl font-bold tracking-wider text-white">PROCUREMENT AI</span>
            <span className="text-indigo-100 text-sm font-medium">Agent Evaluator</span>
          </Link>
          <CardTitle className="text-2xl font-bold text-white">Login</CardTitle>
          <p className="text-indigo-100">Enter your credentials to continue evaluation</p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white h-11 shadow-lg hover:shadow-xl transition-all"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
            </Button>
            <div className="text-center">
              <button 
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
            </div>
            <div className="text-center mt-4">
              <Link 
                to="/" 
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                ← Back to homepage
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm; 