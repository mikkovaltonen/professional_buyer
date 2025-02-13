
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileSearch, PiggyBank, Brain, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent animate-fade-in">
          Smart Insurance Management
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in">
          Store, manage, and optimize your insurance documents with AI-powered insights
        </p>
        <Button className="text-lg px-8 py-6 animate-fade-in">
          Get Started <ArrowRight className="ml-2" />
        </Button>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileSearch className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Secure Document Storage</h3>
              <p className="text-gray-600">
                Safely store and access all your insurance documents in one secure location
              </p>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered Optimization</h3>
              <p className="text-gray-600">
                Our AI analyzes your needs to find the best protection plans for you
              </p>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Cost Savings</h3>
              <p className="text-gray-600">
                Save money by comparing and optimizing your insurance coverage
              </p>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card className="p-6 hover:shadow-lg transition-shadow duration-300 animate-fade-in">
            <CardContent className="space-y-4">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Complete Protection</h3>
              <p className="text-gray-600">
                Get comprehensive coverage recommendations tailored to your needs
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-6">Ready to Optimize Your Insurance?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already saving time and money with our platform
          </p>
          <Button variant="default" size="lg">
            Start Now <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
