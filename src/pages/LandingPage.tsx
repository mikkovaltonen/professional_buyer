import React from 'react';
import { PiggyBank, FileText, Brain, Shield } from 'lucide-react';

const benefits = [
  {
    icon: <PiggyBank className="h-8 w-8 text-purple-500" />,
    title: "Cost Savings",
    description: "Save up to 10% or €200 annually on your family insurance premiums by comparing and optimizing your coverage through our RfP service",
    highlight: true
  },
  {
    icon: <FileText className="h-8 w-8 text-purple-500" />,
    title: "Secure Document Storage",
    description: "Safely store and access all your insurance documents in one secure location"
  },
  {
    icon: <Brain className="h-8 w-8 text-purple-500" />,
    title: "AI-Powered Optimization",
    description: "Our AI analyzes your needs to find the best protection plans for you"
  },
  {
    icon: <Shield className="h-8 w-8 text-purple-500" />,
    title: "Complete Protection",
    description: "Get comprehensive coverage recommendations tailored to your needs"
  }
];

const LandingPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      {/* ... muokataan Benefits-komponentin renderöintiä ... */}

      {benefits.map((benefit, index) => (
        <div 
          key={index} 
          className={`p-6 rounded-lg ${
            benefit.highlight 
              ? 'bg-gradient-to-r from-purple-50 to-blue-50 shadow-md border-2 border-purple-200' 
              : 'bg-white'
          }`}
        >
          <div className="mb-4">
            {benefit.icon}
          </div>
          <h3 className={`text-xl font-semibold mb-2 ${
            benefit.highlight ? 'text-purple-700' : 'text-gray-900'
          }`}>
            {benefit.title}
          </h3>
          <p className={`text-gray-600 ${
            benefit.highlight ? 'font-medium' : ''
          }`}>
            {benefit.description}
          </p>
        </div>
      ))}
    </div>
  );
};

export default LandingPage; 