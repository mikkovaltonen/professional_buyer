import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, FileText, Brain, Upload, Shield, Zap, BarChart3, Users, ArrowRight, Check, Cloud, Server, Database, Code, Sparkles, TrendingUp, Building2, FileSearch, Bot, MessageSquare, Search, Globe, FileSpreadsheet, History } from "lucide-react";
import { Link } from "react-router-dom";
import { RegisterButton } from "@/components/RegisterButton";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 font-sans">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 bg-white/80 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-semibold tracking-tight text-gray-900">ProcureAI</span>
            <span className="text-xs text-gray-500">Agent Evaluator</span>
          </div>
        </Link>
        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-gray-900 font-medium"
            asChild
          >
            <Link to="/login">Login</Link>
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25"
            asChild
          >
            <Link to="/login">Start Free Trial</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-indigo-600/10"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>
        
        <div className="container mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                AI-Powered Procurement Guidance
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Transform Every Employee Into a
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Professional Buyer</span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed">
                Evaluate and optimize your procurement processes with AI. Test document intelligence, automate workflows, and unlock cost savings across your entire organization.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 group"
                  onClick={() => window.location.href = 'mailto:mikko@zealsourcing.fi?subject=Book%20Free%20Demo%20with%20Our%20Data&body=Hi%20Mikko,%0A%0AWe%20would%20like%20to%20book%20a%20free%20demo%20of%20ProcureAI%20using%20our%20own%20procurement%20data.%0A%0ACompany:%20%0AName:%20%0ARole:%20%0APreferred%20demo%20time:%20%0AType%20of%20procurement%20data%20we%20want%20to%20test:%20%0A%0ABest%20regards'}
                >
                  Book Free Demo with Your Data
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">14-day free trial</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-8">
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                        <Bot className="h-10 w-10 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">AI Procurement Agent</h3>
                      <p className="text-gray-600">Intelligent document analysis & automation</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold transform rotate-12">
                New
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">78%</div>
              <div className="text-gray-600 mt-2">Cost Reduction</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">10x</div>
              <div className="text-gray-600 mt-2">Faster Processing</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">99.9%</div>
              <div className="text-gray-600 mt-2">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">24/7</div>
              <div className="text-gray-600 mt-2">AI Availability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Buyer Manifest */}
      <section className="py-20 px-8 bg-gradient-to-b from-white to-blue-50/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <FileText className="h-4 w-4" />
              Professional Buyer Manifest
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              The Procurement Revolution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              How AI transforms every employee into a professional buyer while reducing costs and increasing transparency
            </p>
          </div>

          {/* Problem Statement Card */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-8 mb-12 border border-red-200">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  The €7 Billion Problem
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  Procurement is inefficient with insufficient control & transparency to prevent abuses. Wild invoices are blossoming while support from professional buyers remains limited and overhead costs continue to rise.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <p className="text-gray-600">Lost business user time and fulfilment delays</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <p className="text-gray-600">High salary and license costs for professional buyers</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <p className="text-gray-600">Un-professional procurement due to lack of skills and tools</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <DollarSign className="h-8 w-8 text-red-600 mb-2" />
                      <p className="text-2xl font-bold text-red-600">€7B</p>
                      <p className="text-sm text-gray-600">P2P Market Size</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <TrendingUp className="h-8 w-8 text-orange-600 mb-2" />
                      <p className="text-2xl font-bold text-orange-600">+10%</p>
                      <p className="text-sm text-gray-600">Annual Growth</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-4 p-4 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Current Reality:</p>
                  <p className="text-xs text-gray-600 mt-1">1:n frequency ratio with escalating procurement costs</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Solution Card */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl p-8 mb-12 border border-green-200">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  AI Assistant Solution
                </h3>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  We build AI Agents that help users create POs intelligently, reducing manual processing while maintaining professional standards.
                </p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <p className="text-gray-600">Reduced "best guess" PO creation</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <p className="text-gray-600">Minimized manual professional buyer transactions</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5" />
                    <p className="text-gray-600">Democratized access to procurement expertise</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Transformation</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">1:n efficiency</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span className="text-gray-600">Reduced costs</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-gray-700">Impact:</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">80% Cost Reduction</p>
                    <p className="text-xs text-gray-600 mt-1">In procurement overhead</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Software Evolution */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 mb-12 border border-purple-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Code className="h-6 w-6 text-white" />
              </div>
              Software Industry Under Disruption
            </h3>
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="border-purple-200 bg-white/80">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Server className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Software 1.0</h4>
                  <p className="text-sm text-gray-600">Traditional code with low TCO, elegant API integration, and DevOps excellence</p>
                </CardContent>
              </Card>
              <Card className="border-pink-200 bg-white/80">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                    <Brain className="h-6 w-6 text-pink-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Software 2.0</h4>
                  <p className="text-sm text-gray-600">ML models with enhanced security and pattern recognition capabilities</p>
                </CardContent>
              </Card>
              <Card className="border-indigo-200 bg-white/80">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Software 3.0</h4>
                  <p className="text-sm text-gray-600">Agentic Process Automation with self-evaluation and autonomous execution</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Agentic Process Automation */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-8 mb-12 border border-indigo-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              Agentic Process Automation
            </h3>
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <p className="text-gray-700 mb-6 italic">
                "I plan tasks and execute them, and self-evaluate results"
              </p>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">AI Agent Capabilities:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Search className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-gray-600">Search policies and catalogues</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Database className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-gray-600">Study data warehouse data</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileSearch className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-gray-600">Read purchase invoices</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm text-gray-600">Find renegotiated prices</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Integration Points:</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Vendor data warehouses</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Purchase invoice systems</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Policy management systems</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">Professional buyer workflows</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Forward Deployment Engineer */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-8 mb-12 border border-yellow-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              Forward Deployment Engineer Approach
            </h3>
            <p className="text-gray-700 mb-6">
              Following the Palantir and Sierra way of deep customer integration
            </p>
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-yellow-200 bg-white/80">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">FDE Core Tasks:</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-600">Sit among customer users and do their work with them</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-600">Involve 100% in all hassle to learn root causes</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-600">Develop everything alone with full ownership</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                      <p className="text-sm text-gray-600">Do UI/UX design based on real user needs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-white/80">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Value Alignment:</h4>
                  <div className="space-y-3">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">Free functional prototypes & demos</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">Full satisfaction money-back warranties</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">Value-based pricing schemes</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <p className="text-sm font-medium text-gray-800">Sell your own demo with conviction</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* AI Assistant Features Matrix */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-3xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-slate-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              AI Assistant Performance Metrics
            </h3>
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold text-gray-900">Reliability</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Accuracy</span>
                      <span className="text-sm font-semibold text-gray-900">0-6 Sigma</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="h-5 w-5 text-green-600" />
                    <h4 className="font-semibold text-gray-900">Response Time</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Processing</span>
                      <span className="text-sm font-semibold text-gray-900">1-100 sec</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '70%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900">Scope</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Features</span>
                      <span className="text-sm font-semibold text-gray-900">1-n capabilities</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <Card className="border-indigo-200 bg-indigo-50/50">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">UI/UX & DevOps Excellence</h4>
                  <p className="text-sm text-gray-600">Minimal friction in development and deployment with user-centric design</p>
                </CardContent>
              </Card>
              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Change Management</h4>
                  <p className="text-sm text-gray-600">Low friction adoption with gradual rollout and comprehensive training</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">The Procurement Challenge</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Creating one PO costs €30-100 on average. High P2P setup costs leave business units without professional buyer support.
            </p>
          </div>
          
          {/* Problem Visualization */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">The Cost-Frequency Paradox</h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <p className="text-gray-700">
                      <span className="font-semibold">High-frequency purchases:</span> Professional procurement with POs
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <p className="text-gray-700">
                      <span className="font-semibold">Mid-frequency purchases:</span> P2P break-even point limits coverage
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <p className="text-gray-700">
                      <span className="font-semibold">Low-frequency purchases:</span> Outside central support, low-quality PO process
                    </p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-900 font-medium">
                    Potential to improve EBIT by 1% through AI-powered procurement
                  </p>
                </div>
              </div>
              <div className="relative bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600 mb-2">€7B</div>
                    <div className="text-sm text-gray-600">P2P Market Size</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-semibold text-orange-600">+10%</div>
                      <div className="text-xs text-gray-600">Annual Growth</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-2xl font-semibold text-red-600">€30-100</div>
                      <div className="text-xs text-gray-600">Cost per PO</div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Growing Problem
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-7 w-7 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">€30-100 Per PO</h3>
                <p className="text-gray-600">
                  Manual processes make each purchase order expensive, limiting professional procurement coverage.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-7 w-7 text-orange-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Limited P2P Coverage</h3>
                <p className="text-gray-600">
                  High setup costs prevent P2P solutions from covering all business units and use cases.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
              <CardContent className="p-8">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <FileSearch className="h-7 w-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1% EBIT Opportunity</h3>
                <p className="text-gray-600">
                  Organizations miss significant profit improvement potential due to procurement inefficiencies.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Overview Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">AI-Powered Solution</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Evaluate if a thinking chatbot could transform your procurement processes
            </p>
          </div>
          
          {/* Solution Flow Visualization */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-16">
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                <div className="text-center mb-4">
                  <Bot className="h-16 w-16 text-blue-600 mx-auto mb-3" />
                  <h4 className="text-lg font-semibold text-gray-900">AI Agent Architecture</h4>
                </div>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 flex items-center gap-3">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm text-gray-700">Intelligent Document Processing</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 flex items-center gap-3">
                    <Search className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-700">Policy & Catalogue Search</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 flex items-center gap-3">
                    <Database className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm text-gray-700">Data Warehouse Integration</span>
                  </div>
                  <div className="bg-white rounded-lg p-3 flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-700">Automated Compliance Checks</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-gray-900">How It Works</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Natural Language Interface</h4>
                      <p className="text-gray-600 text-sm">Users describe their procurement needs in plain language</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">AI Task Planning</h4>
                      <p className="text-gray-600 text-sm">Intelligent chatbot breaks down requests and plans optimal procurement actions</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Search className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Multi-Source Intelligence</h4>
                      <p className="text-gray-600 text-sm">WebSearch for vendors, internal knowledge search, and purchase history analysis</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">ERP/P2P Integration</h4>
                      <p className="text-gray-600 text-sm">Seamless connection with existing systems via APIs and data imports</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm font-medium text-blue-900">
                    Test with your own data: Upload Excel files to simulate ERP/P2P integration
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Evaluation Capabilities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Test and validate AI-powered procurement solutions with your own data and documents.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Cost Optimization</h3>
                <p className="text-gray-600 mb-6">
                  AI automatically aligns purchases with negotiated contracts and identifies savings opportunities.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Contract compliance monitoring</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Automated spend analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Supplier optimization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Document Intelligence</h3>
                <p className="text-gray-600 mb-6">
                  Extract and analyze data from any procurement document format with advanced AI.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">PDF, Excel, Word support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Automated data extraction</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Smart categorization</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300 group hover:-translate-y-2">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">AI Buyer Assistant</h3>
                <p className="text-gray-600 mb-6">
                  Transform every employee into a procurement expert with intelligent guidance.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Natural language queries</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Real-time recommendations</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-gray-600">Policy compliance checks</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Enterprise-Grade Technology Stack</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on modern cloud infrastructure with seamless ERP/P2P integration capabilities.
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 shadow-2xl">
            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-8">Cloud-Native Architecture</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Cloud className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Serverless Infrastructure</h4>
                      <p className="text-gray-400">Deployed on Vercel with auto-scaling capabilities and global CDN distribution.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Brain className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Google Gemini 2.5</h4>
                      <p className="text-gray-400">Latest AI model for advanced document understanding and natural language processing.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-orange-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Database className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Cloud Firestore</h4>
                      <p className="text-gray-400">Real-time database for instant synchronization and offline capabilities.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-2xl font-semibold text-white mb-8">ERP/P2P Integration</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Server className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">RESTful API Gateway</h4>
                      <p className="text-gray-400">Secure API integration with existing ERP and P2P systems via REST endpoints.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Enterprise Security</h4>
                      <p className="text-gray-400">OAuth 2.0 authentication with role-based access control and data encryption.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-yellow-600/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">Real-time Processing</h4>
                      <p className="text-gray-400">Stream processing for instant document analysis and procurement insights.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 p-6 bg-blue-600/10 rounded-xl border border-blue-600/20">
              <p className="text-center text-gray-300">
                <span className="font-semibold text-white">Seamless Integration:</span> Connect with SAP, Oracle, Coupa, and other major ERP/P2P platforms through our unified API layer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-8 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Procurement?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join leading organizations using AI to revolutionize their procurement processes. 
            Schedule a personalized demo to see how we can cut your procurement costs by 78%.
          </p>
          <div className="flex justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold shadow-xl"
              onClick={() => window.location.href = 'mailto:mikko@zealsourcing.fi?subject=Request%20for%20ProcureAI%20Demo&body=Hi%20Mikko,%0A%0AI%20am%20interested%20in%20learning%20more%20about%20ProcureAI%20and%20would%20like%20to%20schedule%20a%20demo.%0A%0ACompany:%20%0AName:%20%0ARole:%20%0APreferred%20time:%20%0A%0ABest%20regards'}
            >
              Request Free Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <div className="mt-8 text-blue-100">
            <p className="text-sm">
              Or contact us directly at{' '}
              <a 
                href="mailto:mikko@zealsourcing.fi" 
                className="underline hover:text-white transition-colors font-semibold"
              >
                mikko@zealsourcing.fi
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-8">
        <div className="container mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <div className="p-12 lg:p-16">
                <div className="mb-6">
                  <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <Building2 className="h-4 w-4" />
                    About Zeal Sourcing
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Buying Stuff, But Better
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Zeal Sourcing transforms how businesses approach procurement. We combine deep industry expertise with cutting-edge AI technology to deliver measurable results.
                </p>
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">20+ years of procurement expertise</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">Trusted by Fortune 500 companies</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-gray-700">AI-first approach to procurement</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="font-medium"
                    onClick={() => window.open('https://zealsourcing.fi', '_blank', 'noopener,noreferrer')}
                  >
                    Visit Website
                  </Button>
                  <Button
                    variant="outline"
                    className="font-medium"
                    onClick={() => window.open('https://linkedin.com/company/zeal-sourcing', '_blank', 'noopener,noreferrer')}
                  >
                    LinkedIn
                  </Button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-12 lg:p-16 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <span className="text-6xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">Z</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Zeal Sourcing</h3>
                  <p className="text-blue-100 text-lg">Professional Procurement Solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-semibold text-white">ProcureAI</span>
              </div>
              <p className="text-gray-400">
                AI-powered procurement intelligence for modern businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#integrations" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#security" className="text-gray-400 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="https://www.zealsourcing.fi/insights" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="https://github.com/mikkovaltonen/professional_buyer" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="https://vercel.com/docs/functions/serverless-functions" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">API Reference</a></li>
                <li><a href="mailto:mikko@zealsourcing.fi?subject=Support%20Request" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-3">
                <li><a href="https://www.zealsourcing.fi/team" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="https://www.zealsourcing.fi" className="text-gray-400 hover:text-white transition-colors">Zeal Sourcing</a></li>
                <li><a href="https://www.linkedin.com/company/zealsourcing" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2024 Zeal Sourcing. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm">
                Developed by Mikko Valtonen for open source use
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;