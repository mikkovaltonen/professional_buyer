import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, Brain, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <nav className="flex justify-between items-center p-6 bg-white/80 backdrop-blur-sm border-b border-indigo-100">
        <Link to="/" className="flex flex-col">
          <span className="text-3xl font-bold tracking-wider bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">PROCUREMENT AI</span>
          <span className="text-indigo-600 text-sm font-medium">Agent Evaluator</span>
        </Link>
        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            className="text-indigo-600 hover:bg-indigo-50"
            asChild
          >
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold mb-6">
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Procurement AI Agent</span>
          <br />
          <span className="text-indigo-600">Evaluator</span>
        </h1>
        <p className="text-xl mb-4 text-gray-700">
          Evaluate and test AI-powered procurement capabilities with real documents.
        </p>
        <p className="text-xl mb-8 text-gray-600">
          Upload procurement policies and simulate ERP/P2P integration by loading sample data via excels and evaluate AI Agent performance with your own data
        </p>
        <Button 
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all"
          asChild
        >
          <Link to="/login">Start Evaluation</Link>
        </Button>

        <section className="mt-24">
          <h2 className="text-3xl font-bold mb-12 text-gray-800">Key Evaluation Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 border-indigo-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Cost Savings Potential</h3>
                <p className="text-gray-600">
                  Evaluate how AI can align purchases with negotiated contracts and reduce operational costs by automating procurement processes.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-purple-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Upload className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Document Intelligence</h3>
                <p className="text-gray-600">
                  Test AI's ability to extract and analyze data from your procurement documents, contracts, and supplier catalogs.
                </p>
              </CardContent>
            </Card>

            <Card className="p-6 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="space-y-4">
                <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Professional Buyer Intelligence</h3>
                <p className="text-gray-600">
                  Experience how AI can transform every employee into a professional buyer by providing intelligent procurement guidance and automation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-24 mb-16">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            Start Your <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Procurement AI Evaluation</span>
          </h2>
          <div className="flex justify-center gap-4">
            <Button 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all"
              asChild
            >
              <Link to="/login">Begin Evaluation</Link>
            </Button>
            <Button 
              variant="outline" 
              className="px-8 py-6 rounded-lg text-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={() => window.open('https://github.com/mikkovaltonen/professional_buyer', '_blank', 'noopener,noreferrer')}
            >
              View Full Solution →
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-gray-50 py-16 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold text-lg mb-4">Services</h3>
              <ul className="space-y-2">
                <li><a href="https://www.zealsourcing.fi/services" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Procurement Services</a></li>
                <li><a href="https://www.zealsourcing.fi/about-4" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Procurement Strategy</a></li>
                <li><a href="https://www.zealsourcing.fi/copy-of-create-procurement-strategy" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Procurement & Tools</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="https://www.zealsourcing.fi/insights" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Insights</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Contact</h3>
              <ul className="space-y-2">
                <li><a href="https://www.zealsourcing.fi/team" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900">Our Team</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center">
              <p className="text-gray-600">Developed by Mikko Valtonen for open source use</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
