import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Users,
  GraduationCap,
  Users2,
  DollarSign,
  Library,
  BarChart3,
  Settings,
  Database,
  Bell,
  Star,
  ArrowRight,
  Play,
  Quote,
  CheckCircle,
  Globe,
  Lock,
  Cloud,
  Phone,
  Mail,
  MapPin,
  Shield,
  HeartHandshake,
  School,
  Sparkles,
  Rocket,
  BookOpen,
  Calendar,
  TrendingUp,
  Award,
  Target,
  LineChart,
  Zap,
  ShieldCheck,
  Clock,
  UserCheck
} from 'lucide-react';

export default function Home() {
  // Data directly in the component
  const stats = [
    { value: "10K+", label: "Active Students", icon: Users, color: "blue" },
    { value: "500+", label: "Schools", icon: School, color: "purple" },
    { value: "99.9%", label: "Uptime", icon: Shield, color: "emerald" },
    { value: "24/7", label: "Support", icon: HeartHandshake, color: "orange" }
  ];

  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Complete student lifecycle from admission to graduation",
      features: ["Admissions", "Attendance", "Progress Tracking", "Report Cards"],
      color: "blue"
    },
    {
      icon: GraduationCap,
      title: "Academic Management",
      description: "Streamline curriculum, timetable, and grading",
      features: ["Timetable", "Assignments", "Exams", "Grading"],
      color: "purple"
    },
    {
      icon: DollarSign,
      title: "Fee Management",
      description: "Automated fee collection and financial reporting",
      features: ["Fee Collection", "Invoices", "Expenses", "Reports"],
      color: "emerald"
    },
    {
      icon: Users2,
      title: "Communication Hub",
      description: "Connect teachers, students, and parents",
      features: ["Messages", "Notices", "Announcements", "Alerts"],
      color: "orange"
    },
    {
      icon: Library,
      title: "Resource Management",
      description: "Manage school resources and inventory",
      features: ["Library", "Inventory", "Classrooms", "Transport"],
      color: "pink"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Data-driven insights for decision making",
      features: ["Reports", "Analytics", "Forecasting", "KPIs"],
      color: "cyan"
    }
  ];

  const howItWorksSteps = [
    {
      step: "01",
      title: "Sign Up & Configure",
      description: "Create your school account and customize settings",
      icon: Settings,
      color: "blue"
    },
    {
      step: "02",
      title: "Import Your Data",
      description: "Upload student, teacher, and class information",
      icon: Database,
      color: "purple"
    },
    {
      step: "03",
      title: "Go Live & Train",
      description: "Launch platform and train your team",
      icon: Bell,
      color: "emerald"
    }
  ];

  const testimonials = [
    {
      quote: "Ease Academy reduced our administrative workload by 60%. The multi-branch feature is a game-changer for our school chain.",
      name: "Sarah Johnson",
      role: "Principal, Green Valley International",
      initials: "SJ",
      color: "blue"
    },
    {
      quote: "Parent engagement has increased dramatically since we started using the parent portal. Communication is now seamless.",
      name: "Michael Chen",
      role: "Director, Bright Minds Academy",
      initials: "MC",
      color: "purple"
    },
    {
      quote: "The analytics dashboard gives us insights we never had before. We can now make data-driven decisions about curriculum.",
      name: "Dr. Emily Rodriguez",
      role: "Academic Dean, University Prep School",
      initials: "ER",
      color: "emerald"
    }
  ];

  const contactDetails = [
    {
      icon: Phone,
      title: "Phone Support",
      details: "+92 335 2778488 || 02137520456",
      description: "Mon-Fri, 9am-6pm EST",
      color: "blue"
    },
    {
      icon: Mail,
      title: "Email Us",
      details: "globiumclouds@gmail.com",
      description: "Response within 2 hours",
      color: "purple"
    },
    {
      icon: MapPin,
      title: "Visit Our Office",
      details: "House R-84 , near Al.Habeeb Resturent, Sector 15-A/4 Sector 15 A 4 Buffer Zone, Karachi, Pakistan, Karachi Lines, Pakistan",
      description: "Schedule a visit anytime",
      color: "emerald"
    }
  ];

  const trustedSchools = [
    "Green Valley",
    "Bright Minds",
    "University Prep",
    "Learning First",
    "Knowledge Hub",
    "Future Leaders"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Animated gradient orbs - Mobile optimized sizes */}
        <div className="absolute -top-20 -right-20 w-48 h-48 md:w-96 md:h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl md:blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -left-20 w-48 h-48 md:w-96 md:h-96 bg-gradient-to-br from-emerald-400/15 to-cyan-400/15 rounded-full blur-2xl md:blur-3xl animate-pulse-slow delay-1000" />
        <div className="absolute -bottom-20 right-1/4 w-48 h-48 md:w-96 md:h-96 bg-gradient-to-br from-violet-400/10 to-pink-400/10 rounded-full blur-2xl md:blur-3xl animate-pulse-slow delay-500" />
        
        {/* Floating particles - Smaller on mobile */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 md:w-4 md:h-4 bg-blue-300/30 rounded-full animate-float-1" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 md:w-3 md:h-3 bg-purple-300/30 rounded-full animate-float-2" />
        <div className="absolute top-2/3 left-1/3 w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-300/30 rounded-full animate-float-3" />
        <div className="absolute bottom-1/4 right-1/4 w-2 h-2 md:w-3 md:h-3 bg-cyan-300/30 rounded-full animate-float-4" />
        
        {/* Grid pattern - Smaller grid on mobile */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50/50">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(120,119,198,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(120,119,198,0.03)_1px,transparent_1px)] bg-[size:30px_30px] md:bg-[size:50px_50px]" />
        </div>
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/80 backdrop-blur-lg">
        <Navbar />
      </header>

      <main className="relative">
        {/* Enhanced Hero Section - Mobile Optimized */}
        <section className="relative min-h-[90vh] md:min-h-screen flex items-center justify-center overflow-hidden pt-16 md:pt-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50" />
          
          {/* Animated floating elements - Hidden on small mobile */}
          <div className="hidden sm:block absolute top-20 left-10 animate-float-1">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl md:rounded-2xl rotate-12 border border-blue-200/50 shadow-lg flex items-center justify-center">
              <BookOpen className="h-6 w-6 md:h-8 md:w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="hidden md:block absolute top-40 right-20 animate-float-2">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl md:rounded-2xl -rotate-12 border border-purple-200/50 shadow-lg flex items-center justify-center">
              <Calendar className="h-8 w-8 md:h-10 md:w-10 text-purple-500" />
            </div>
          </div>
          
          <div className="hidden lg:block absolute bottom-40 left-20 animate-float-3">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl md:rounded-2xl rotate-6 border border-emerald-200/50 shadow-lg flex items-center justify-center">
              <TrendingUp className="h-10 w-10 md:h-12 md:w-12 text-emerald-500" />
            </div>
          </div>
          
          <div className="hidden md:block absolute bottom-20 right-10 animate-float-4">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl md:rounded-2xl -rotate-6 border border-orange-200/50 shadow-lg flex items-center justify-center">
              <Award className="h-8 w-8 md:h-10 md:w-10 text-orange-500" />
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-7xl mx-auto text-center">
              {/* Animated badge with particles - Mobile optimized */}
              <div className="inline-flex items-center gap-1 md:gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-full mb-6 md:mb-10 border border-white/50 animate-fade-in-up shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-500" />
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-blue-500 animate-pulse relative z-10" />
                <span className="text-xs md:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent relative z-10">
                  Trusted by 500+ schools worldwide
                </span>
                <div className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-blue-400 rounded-full animate-ping" />
              </div>

              {/* Main Heading with responsive font sizes */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 tracking-tight animate-fade-in-up delay-100">
                <span className="block text-slate-900">
                  Transform Your{' '}
                  <span className="relative inline-block">
                    <span className="relative z-10">School</span>
                    <span className="absolute bottom-1 md:bottom-2 left-0 right-0 h-2 md:h-3 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-lg animate-pulse" />
                  </span>
                </span>
                <span className="block mt-2 md:mt-4">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600 bg-clip-text text-transparent animate-gradient-flow bg-[length:200%_auto]">
                    Management Made Simple
                  </span>
                </span>
              </h1>

              {/* Responsive Subheading */}
              <p className="max-w-3xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl text-slate-600 mb-8 md:mb-12 leading-relaxed animate-fade-in-up delay-200 px-4">
                All-in-one platform to streamline administration, enhance learning, 
                and connect your entire school community seamlessly.
              </p>

              {/* Responsive CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-16 md:mb-24 animate-fade-in-up delay-300 px-4">
                <Link href="#" className="w-full sm:w-auto group">
                  <Button size="lg" className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 text-base md:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 group-hover:scale-105 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <Rocket className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 group-hover:rotate-12 transition-transform duration-300" />
                    Start Free Trial
                    <ArrowRight className="ml-2 md:ml-3 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </Link>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto h-14 md:h-16 px-8 md:px-12 text-base md:text-lg border-2 border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-500 transform hover:-translate-y-1 group"
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <Play className="mr-2 md:mr-3 h-5 w-5 md:h-6 md:w-6 text-blue-600 group-hover:text-blue-700 transition-colors" />
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    Watch Demo
                  </div>
                </Button>
              </div>

              {/* Responsive Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl md:max-w-5xl mx-auto animate-fade-in-up delay-500 px-4">
                {stats.map((stat, idx) => (
                  <div 
                    key={idx}
                    className="bg-white/80 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 sm:p-6 md:p-8 border border-slate-200/50 shadow-lg hover:shadow-xl md:hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 md:hover:-translate-y-2 hover:scale-105 group relative overflow-hidden"
                  >
                    {/* Hover effect background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-white/0 to-purple-50/0 group-hover:from-blue-50/30 group-hover:via-white/20 group-hover:to-purple-50/30 transition-all duration-500" />
                    
                    {/* Animated icon container */}
                    <div className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-50 flex items-center justify-center mb-4 md:mb-6 mx-auto transform group-hover:rotate-12 transition-transform duration-500`}>
                      <stat.icon className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`} />
                      {/* Glow effect */}
                      <div className={`absolute inset-0 bg-${stat.color}-400/20 rounded-xl md:rounded-2xl blur-xl group-hover:opacity-50 opacity-0 transition-opacity duration-500`} />
                    </div>
                    
                    {/* Animated value */}
                    <div className="relative z-10 text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 md:mb-2 transform group-hover:scale-105 transition-transform duration-300">
                      {stat.value}
                    </div>
                    
                    {/* Label with subtle animation */}
                    <div className="relative z-10 text-xs sm:text-sm md:text-sm font-medium text-slate-600 tracking-wide group-hover:text-slate-900 transition-colors duration-300 leading-tight">
                      {stat.label}
                    </div>
                    
                    {/* Bottom glow line */}
                    <div className={`absolute bottom-0 left-1/4 right-1/4 h-0.5 md:h-1 bg-gradient-to-r from-${stat.color}-400/0 via-${stat.color}-400 to-${stat.color}-400/0 rounded-full transform translate-y-2 md:translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500`} />
                  </div>
                ))}
              </div>

              {/* Scroll indicator */}
              <div className="mt-12 md:mt-20 animate-bounce-slow">
                <div className="inline-flex flex-col items-center gap-1 md:gap-2">
                  <span className="text-xs md:text-sm font-medium text-slate-500 tracking-widest">EXPLORE MORE</span>
                  <div className="w-5 h-8 md:w-6 md:h-10 border-2 border-slate-300 rounded-full flex justify-center">
                    <div className="w-1 h-2 md:h-3 bg-slate-400 rounded-full mt-2 animate-scroll-indicator" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 md:py-20 bg-[var(--ease-background)] relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-blue-50 rounded-full mb-4 md:mb-6">
                <Target className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
                <span className="text-xs md:text-sm font-medium text-blue-700">Core Features</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 md:mb-4">
                Everything You Need, All in One Place
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600">
                From student admissions to financial reporting, Ease Academy provides a complete suite of tools to manage your institution efficiently.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 md:mb-20">
              {features.map((feature, idx) => (
                <Card 
                  key={idx} 
                  className="group hover:shadow-xl md:hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 md:hover:-translate-y-2 border border-slate-200 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                  <CardHeader className="pb-4 pt-6 md:pt-8 px-4 md:px-6">
                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-gradient-to-br from-${feature.color}-100 to-${feature.color}-50 flex items-center justify-center mb-4 md:mb-6 transform group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-5 w-5 md:h-7 md:w-7 text-${feature.color}-600`} />
                    </div>
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-900">{feature.title}</CardTitle>
                    <CardDescription className="text-slate-600 text-sm md:text-base">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 md:px-6 pb-6 md:pb-8">
                    <ul className="space-y-2 md:space-y-3">
                      {feature.features.map((item, i) => (
                        <li key={i} className="flex items-center text-sm md:text-base text-slate-700 group/item">
                          <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-emerald-500 mr-2 md:mr-3 flex-shrink-0" />
                          <span className="group-hover/item:text-slate-900 transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Platform Features */}
            <div className="bg-gradient-to-r from-[var(--ease-gradient-start)] to-[var(--ease-gradient-end)] rounded-xl md:rounded-2xl p-6 md:p-12 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 md:w-32 md:h-32 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              <div className="absolute bottom-0 left-0 w-12 h-12 md:w-24 md:h-24 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
              <div className="relative z-10">
                <div className="text-center mb-8 md:mb-10">
                  <h3 className="text-xl md:text-3xl font-bold mb-3 md:mb-4">Why Choose Ease Academy?</h3>
                  <p className="text-blue-100 text-sm md:text-base">Built with schools in mind, designed for the future</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto transform hover:scale-110 transition-transform duration-300">
                      <Globe className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Multi-Branch Ready</h4>
                    <p className="text-blue-100 text-sm md:text-base">Manage multiple campuses from a single dashboard</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto transform hover:scale-110 transition-transform duration-300">
                      <Lock className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Secure & Compliant</h4>
                    <p className="text-blue-100 text-sm md:text-base">Data encryption and privacy compliance built-in</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto transform hover:scale-110 transition-transform duration-300">
                      <Cloud className="h-8 w-8 md:h-10 md:w-10" />
                    </div>
                    <h4 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Cloud-Based</h4>
                    <p className="text-blue-100 text-sm md:text-base">Access from anywhere, on any device, anytime</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 md:py-20 bg-white relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-50 rounded-full mb-4 md:mb-6">
                <Zap className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />
                <span className="text-xs md:text-sm font-medium text-emerald-700">Easy Setup</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 md:mb-4">
                Get Started in 3 Simple Steps
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600">
                Our intuitive onboarding process will have your school up and running in no time.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
              <div className="hidden md:block absolute top-8 md:top-16 left-1/4 right-1/4 h-1 bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200" />
              
              {howItWorksSteps.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="relative z-10 bg-white rounded-xl md:rounded-2xl p-6 md:p-8 border border-slate-200 hover:border-blue-300 transition-all duration-500 transform hover:-translate-y-1 md:hover:-translate-y-2 shadow-lg hover:shadow-xl md:hover:shadow-2xl group">
                    <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-lg`}>
                      {step.step}
                    </div>
                    <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-gradient-to-br from-${step.color}-100 to-${step.color}-50 mb-6 md:mb-8 mt-4 md:mt-8 mx-auto transform group-hover:scale-110 transition-transform duration-300`}>
                      <step.icon className={`h-8 w-8 md:h-10 md:w-10 text-${step.color}-600`} />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 md:mb-4 text-center">{step.title}</h3>
                    <p className="text-slate-600 text-sm md:text-base text-center">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center mt-12 md:mt-16 px-4">
              <p className="text-slate-600 mb-6 md:mb-8 text-sm md:text-base">Average setup time: <span className="font-bold text-emerald-600">Less than 24 hours</span></p>
              <Link href="/login">
                <Button size="lg" className="h-12 md:h-14 px-8 md:px-10 text-base md:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Begin Your Journey
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-12 md:py-20 bg-gradient-to-b from-slate-50 to-white relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-purple-50 rounded-full mb-4 md:mb-6">
                <UserCheck className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
                <span className="text-xs md:text-sm font-medium text-purple-700">Success Stories</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 md:mb-4">
                Loved by Schools, Trusted by Educators
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600">
                Hear what principals, teachers, and parents have to say about their experience with Ease Academy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
              {testimonials.map((testimonial, idx) => (
                <Card key={idx} className="border border-slate-200 hover:shadow-xl md:hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 md:hover:-translate-y-2 group">
                  <CardContent className="p-6 md:p-8">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-${testimonial.color}-100 to-${testimonial.color}-50 flex items-center justify-center mb-4 md:mb-6`}>
                      <Quote className={`h-6 w-6 md:h-8 md:w-8 text-${testimonial.color}-600`} />
                    </div>
                    <p className="text-slate-700 mb-6 md:mb-8 italic text-base md:text-lg leading-relaxed">"{testimonial.quote}"</p>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-${testimonial.color}-100 to-${testimonial.color}-50 flex items-center justify-center mr-3 md:mr-4 font-bold text-${testimonial.color}-700 text-base md:text-xl`}>
                        {testimonial.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base md:text-lg">{testimonial.name}</h4>
                        <p className="text-slate-600 text-sm md:text-base">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Trusted Logos */}
            <div className="bg-white rounded-xl md:rounded-2xl p-6 md:p-10 border border-slate-200 shadow-lg">
              <p className="text-center text-slate-700 mb-6 md:mb-10 font-semibold text-base md:text-lg">Trusted by leading educational institutions</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-8">
                {trustedSchools.map((school, idx) => (
                  <div 
                    key={idx} 
                    className="h-12 md:h-16 bg-gradient-to-br from-slate-50 to-white rounded-lg md:rounded-xl flex items-center justify-center text-slate-700 font-semibold text-xs md:text-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300 hover:-translate-y-1 px-2"
                  >
                    <span className="text-center">{school}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-[var(--ease-gradient-start)] via-[var(--ease-secondary)] to-[var(--ease-accent)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 md:w-64 md:h-64 bg-white/10 rounded-full blur-2xl md:blur-3xl" />
          <div className="absolute bottom-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-white/5 rounded-full blur-2xl md:blur-3xl" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto text-center text-white px-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/20 rounded-full mb-4 md:mb-6 backdrop-blur-sm">
                <ShieldCheck className="h-3 w-3 md:h-4 md:w-4 text-white" />
                <span className="text-xs md:text-sm font-medium">Risk-Free Trial</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 md:mb-8">
                Ready to Transform Your School Management?
              </h2>
              <p className="text-sm md:text-lg lg:text-xl text-blue-100 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed">
                Join thousands of schools using Ease Academy to streamline their operations and enhance educational outcomes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center mb-8 md:mb-10">
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto h-12 md:h-16 px-8 md:px-14 text-base md:text-lg bg-white text-blue-700 hover:bg-slate-100 shadow-xl md:shadow-2xl hover:shadow-2xl md:hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
                    Start Free Trial
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto h-12 md:h-16 px-8 md:px-14 text-base md:text-lg bg-white text-blue-700 hover:bg-slate-100 shadow-xl md:shadow-2xl hover:shadow-2xl md:hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-105"
                >
                  <Play className="mr-2 md:mr-3 h-4 w-4 md:h-5 md:w-5" />
                  Request a Demo
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-8 justify-center items-center text-xs md:text-sm text-blue-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                  <span>No credit card required</span>
                </div>
                <div className="hidden sm:block">•</div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                  <span>14-day free trial</span>
                </div>
                <div className="hidden sm:block">•</div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                  <span>Full support included</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-12 md:py-20 bg-white relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 px-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 md:mb-4">
                Get in Touch
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-slate-600">
                Our education experts are ready to help you transform your school management experience.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
              {/* Contact Info */}
              <div className="flex flex-col justify-center">
                <div className="space-y-6 md:space-y-8">
                  {contactDetails.map((contact, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-500 group"
                    >
                      <div className={`w-12 h-12 md:w-16 md:h-16 rounded-lg md:rounded-xl bg-gradient-to-br from-${contact.color}-100 to-${contact.color}-50 flex items-center justify-center mr-4 md:mr-6 flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300`}>
                        <contact.icon className={`h-5 w-5 md:h-8 md:w-8 text-${contact.color}-600`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base md:text-lg mb-1 md:mb-2">{contact.title}</h4>
                        <p className="text-slate-900 font-semibold text-sm md:text-base mb-1">{contact.details}</p>
                        <p className="text-slate-600 text-xs md:text-sm">{contact.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl md:rounded-2xl p-6 md:p-10 border border-slate-200 shadow-lg md:shadow-xl">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-2">Request a Personalized Demo</h3>
                <p className="text-slate-600 text-sm md:text-base mb-6 md:mb-8">See how Ease Academy can transform your school management</p>
                <form className="space-y-4 md:space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="block text-xs md:text-sm font-medium text-slate-700">First Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 outline-none text-sm md:text-base"
                        placeholder="Abdur"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs md:text-sm font-medium text-slate-700">Last Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 outline-none text-sm md:text-base"
                        placeholder="Rehman"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs md:text-sm font-medium text-slate-700">School Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 outline-none text-sm md:text-base"
                      placeholder="Green Valley International"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs md:text-sm font-medium text-slate-700">Email Address</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 outline-none text-sm md:text-base"
                        placeholder="green@school.edu"
                      />
                    </div>
                    <Button className="w-full h-12 md:h-14 text-base md:text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1">
                      Request Demo
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </main>

      <Footer />
    </div>
  );
}