
import { Button } from "@/components/ui/button";
import { FileSearch, Lock, Shield, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SecureStorage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <Link to="/" className="inline-flex items-center text-gray-600 hover:text-primary mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="h-20 w-20 bg-purple-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <FileSearch className="h-10 w-10 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold mb-6">Secure Document Storage</h1>
            <p className="text-xl text-gray-600">
              Your insurance documents, safely stored and easily accessible
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Lock className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Bank-Level Security</h3>
              <p className="text-gray-600">
                Your documents are protected with enterprise-grade encryption and security measures
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <Shield className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-3">Privacy First</h3>
              <p className="text-gray-600">
                Your data privacy is our top priority with strict access controls
              </p>
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" className="px-8">
              Start Storing Securely
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureStorage;
