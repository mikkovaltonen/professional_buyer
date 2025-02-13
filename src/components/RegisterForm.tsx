
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const RegisterForm = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegisterClick = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Connection test error details:', error);
        toast.error("Connection failed: " + error.message);
        return;
      }
      setIsOpen(true);
    } catch (error) {
      console.error('Connection test error:', error);
      toast.error("Failed to test connection");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting registration process...');
      
      const signUpData = {
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin
        }
      };
      
      console.log('Sending registration request with:', { email: signUpData.email });
      
      const { data, error } = await supabase.auth.signUp(signUpData);

      if (error) {
        console.error('Registration error details:', error);
        toast.error(error.message);
        return;
      }

      if (data.user) {
        console.log('Registration successful:', data.user);
        toast.success("Check your email to confirm your account!");
        setIsOpen(false);
        setFormData({ email: "", password: "", confirmPassword: "" });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error?.message || "Something went wrong during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white hover:bg-gray-50"
          onClick={handleRegisterClick}
        >
          Register
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create an Account</DialogTitle>
          <DialogDescription>
            Join Insurance Vault to manage your insurance documents securely.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#9b87f5] hover:bg-[#7E69AB]"
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterForm;
