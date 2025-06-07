import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, Brain, Upload } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="flex justify-between items-center px-8 py-6 bg-white shadow-sm">
        <Link to="/" className="flex flex-col">
          <span className="text-2xl font-light tracking-wide text-blue-900">PROCUREMENT AI</span>
          <span className="text-blue-600 text-sm font-light">Agent Evaluator</span>
        </Link>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="text-blue-700 hover:bg-blue-50 font-light"
            asChild
          >
            <Link to="/login">Login</Link>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-8 py-20 text-center">
        <h1 className="text-6xl font-light mb-8 leading-tight">
          <span className="text-blue-900">Procurement AI Agent</span>
          <br />
          <span className="text-blue-700">Evaluator</span>
        </h1>
        <p className="text-xl mb-6 text-blue-800 font-light max-w-3xl mx-auto">
          Evaluate and test AI-powered procurement capabilities with real documents.
        </p>
        <p className="text-lg mb-12 text-blue-600 font-light max-w-2xl mx-auto">
          Upload procurement policies and simulate ERP/P2P integration by loading sample data via excels and evaluate AI Agent performance with your own data
        </p>
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg font-light shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          asChild
        >
          <Link to="/login">Start Evaluation</Link>
        </Button>

        <section className="mt-32">
          <h2 className="text-4xl font-light mb-16 text-blue-900">The Procurement Challenge</h2>
          <div className="mb-20 bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
            <img src="/problem.png" alt="Procurement Cost Problem Analysis" className="w-full h-auto" />
          </div>
        </section>

        <section className="mt-32">
          <h2 className="text-4xl font-light mb-16 text-blue-900">Key Evaluation Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Card className="p-8 border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 rounded-2xl">
              <CardContent className="space-y-6">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-light text-blue-900">Cost Savings Potential</h3>
                <p className="text-blue-700 font-light leading-relaxed">
                  Evaluate how AI can align purchases with negotiated contracts and reduce operational costs by automating procurement processes.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 rounded-2xl">
              <CardContent className="space-y-6">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-light text-blue-900">Document Intelligence</h3>
                <p className="text-blue-700 font-light leading-relaxed">
                  Test AI's ability to extract and analyze data from your procurement documents, contracts, and supplier catalogs.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-300 hover:transform hover:-translate-y-2 rounded-2xl">
              <CardContent className="space-y-6">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-light text-blue-900">Professional Buyer Intelligence</h3>
                <p className="text-blue-700 font-light leading-relaxed">
                  Experience how AI can transform every employee into a professional buyer by providing intelligent procurement guidance and automation.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-32">
          <h2 className="text-4xl font-light mb-16 text-blue-900">Our Solution for Evaluation</h2>
          <div className="grid md:grid-cols-2 gap-12 items-start p-10 bg-blue-50 rounded-3xl shadow-xl border border-blue-100">
            <div>
              <h3 className="text-3xl font-light text-blue-900 mb-6">Professional Buyer Tech Stack</h3>
              <p className="text-blue-700 mb-8 font-light leading-relaxed">An overview of the technology stack empowering professional buyers.</p>
              <img src="/professiona_buyer_tech_stack.png" alt="Professional Buyer Tech Stack" className="rounded-2xl shadow-lg border border-blue-200 w-full h-auto" />
            </div>
            <div>
              <h3 className="text-3xl font-light text-blue-900 mb-6">Core Solution Overview</h3>
              <p className="text-blue-700 mb-8 font-light leading-relaxed">A diagram illustrating the main components and flow of our solution.</p>
              <img src="/solution_overview.png" alt="Solution Overview" className="rounded-2xl shadow-lg border border-blue-200 w-full h-auto" />
            </div>
          </div>
        </section>

        <section className="mt-32 mb-20">
          <h2 className="text-4xl font-light mb-10 text-blue-900 text-center">
            Start Your <span className="text-blue-600">Procurement AI Evaluation</span>
          </h2>
          <div className="flex justify-center gap-6">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-full text-lg font-light shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              asChild
            >
              <Link to="/login">Begin Evaluation</Link>
            </Button>
            <Button
              variant="outline"
              className="px-10 py-4 rounded-full text-lg border-blue-600 text-blue-600 hover:bg-blue-50 font-light shadow-lg transition-all duration-300"
              onClick={() => window.open('https://github.com/mikkovaltonen/professional_buyer', '_blank', 'noopener,noreferrer')}
            >
              View Full Solution →
            </Button>
          </div>
        </section>

        <section className="mt-32 mb-20">
          <h2 className="text-4xl font-light mb-16 text-blue-900 text-center">About Zeal Sourcing</h2>
          <div className="bg-white rounded-3xl shadow-xl border border-blue-100 overflow-hidden">
            <img src="/zeal.png" alt="Zeal Sourcing - Buying stuff but better" className="w-full h-auto" />
          </div>
          <div className="text-center mt-12">
            <p className="text-blue-700 text-xl mb-8 font-light max-w-2xl mx-auto">
              Professional procurement solutions that transform how businesses buy and source.
            </p>
            <div className="flex justify-center gap-6">
              <Button
                variant="outline"
                className="px-8 py-3 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-light shadow-lg transition-all duration-300"
                onClick={() => window.open('https://zealsourcing.fi', '_blank', 'noopener,noreferrer')}
              >
                Visit zealsourcing.fi
              </Button>
              <Button
                variant="outline"
                className="px-8 py-3 rounded-full border-blue-600 text-blue-600 hover:bg-blue-50 font-light shadow-lg transition-all duration-300"
                onClick={() => window.open('https://linkedin.com/company/zeal-sourcing', '_blank', 'noopener,noreferrer')}
              >
                LinkedIn
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-blue-900 py-20 mt-20">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div>
              <h3 className="font-light text-lg mb-6 text-white">Services</h3>
              <ul className="space-y-3">
                <li><a href="https://www.zealsourcing.fi/procurement-services" className="text-blue-200 hover:text-white font-light transition-colors duration-300">Procurement Services</a></li>
                <li><a href="https://www.zealsourcing.fi/create-procurement-strategy" className="text-blue-200 hover:text-white font-light transition-colors duration-300">Procurement Strategy</a></li>
                <li><a href="https://www.zealsourcing.fi/copy-of-create-procurement-strategy" className="text-blue-200 hover:text-white font-light transition-colors duration-300">Procurement & Tools</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-light text-lg mb-6 text-white">Resources</h3>
              <ul className="space-y-3">
                <li><a href="https://www.zealsourcing.fi/insights" className="text-blue-200 hover:text-white font-light transition-colors duration-300">Insights</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-light text-lg mb-6 text-white">Contact</h3>
              <ul className="space-y-3">
                <li><a href="https://www.zealsourcing.fi/our-team" className="text-blue-200 hover:text-white font-light transition-colors duration-300">Our Team</a></li>
                <li><a href="https://www.linkedin.com/company/zealsourcing" className="text-blue-200 hover:text-white font-light transition-colors duration-300">LinkedIn</a></li>
                <li><a href="https://www.zealsourcing.fi" className="text-blue-200 hover:text-white font-light transition-colors duration-300">Visit Zeal Sourcing</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-blue-700 text-center">
            <p className="text-blue-200 font-light">© 2024 Zeal Sourcing. All rights reserved.</p>
            <p className="text-blue-300 font-light mt-2">Developed by Mikko Valtonen for open source use</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
