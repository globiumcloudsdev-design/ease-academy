"use client";


import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  School, 
  Menu, 
  X, 
  ChevronDown,
  Home,
  Users,
  MessageSquare,
  Phone,
  BarChart3,
  BookOpen,
  Sparkles,
  Globe,
  Shield,
  Cloud
} from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { 
      href: "#features", 
      label: "Features", 
      icon: BookOpen,
      dropdown: [
        { icon: Users, label: "Student Management", href: "#student-management" },
        { icon: BookOpen, label: "Academic Tools", href: "#academic" },
        { icon: BarChart3, label: "Analytics", href: "#analytics" },
        { icon: Globe, label: "Multi-Branch", href: "#multi-branch" },
        { icon: Shield, label: "Security", href: "#security" },
        { icon: Cloud, label: "Cloud Features", href: "#cloud" }
      ]
    },
    { href: "#testimonials", label: "Testimonials", icon: MessageSquare },
    { href: "#contact", label: "Contact", icon: Phone },
  ];

  const stats = [
    { value: "500+", label: "Schools" },
    { value: "10K+", label: "Users" },
    { value: "99.9%", label: "Uptime" }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/90 backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo with Animation */}
            <Link 
              href="/" 
              className="flex items-center gap-3 group relative"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--ease-gradient-start)] to-[var(--ease-gradient-end)] rounded-xl blur-md opacity-70 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-12 h-12 bg-gradient-to-br from-[var(--ease-gradient-start)] to-[var(--ease-gradient-end)] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <School className="h-7 w-7 text-white" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-ping opacity-75" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-[var(--ease-gradient-start)] to-[var(--ease-gradient-end)] bg-clip-text text-transparent">
                  Ease Academy
                </span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">SCHOOL MANAGEMENT SYSTEM</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navItems.map((item, idx) => (
                <div key={idx} className="relative group">
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={() => setFeaturesOpen(!featuresOpen)}
                        className="flex items-center gap-2 text-slate-700 hover:text-[var(--ease-primary)] transition-colors font-medium text-sm group"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${featuresOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Features Dropdown */}
                      <div className={`absolute top-full left-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 p-6 transition-all duration-300 transform origin-top ${featuresOpen ? 'scale-100 opacity-100 visible' : 'scale-95 opacity-0 invisible'}`}>
                        <div className="grid grid-cols-2 gap-4">
                          {item.dropdown.map((dropdownItem, i) => (
                            <Link
                              key={i}
                              href={dropdownItem.href}
                              className="flex items-start gap-3 p-4 rounded-xl hover:bg-slate-50/80 transition-all duration-300 group/item"
                              onClick={() => setFeaturesOpen(false)}
                            >
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                <dropdownItem.icon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900 text-sm">{dropdownItem.label}</h4>
                                <p className="text-xs text-slate-500 mt-1">Learn more →</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-slate-200">
                          <div className="flex items-center justify-between">
                            {stats.map((stat, i) => (
                              <div key={i} className="text-center">
                                <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                                <div className="text-xs text-slate-500">{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 text-slate-700 hover:text-[var(--ease-primary)] transition-colors font-medium text-sm group relative"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--ease-gradient-start)] to-[var(--ease-gradient-end)] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                    </Link>
                  )}
                </div>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden lg:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-700 hover:text-[var(--ease-primary)] font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button className="bg-gradient-to-r from-[var(--ease-gradient-start)] to-[var(--ease-gradient-end)] hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors"
            >
              {isOpen ? (
                <X className="h-6 w-6 text-slate-700" />
              ) : (
                <Menu className="h-6 w-6 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 transition-all duration-300 ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col gap-4">
              {navItems.map((item, idx) => (
                <div key={idx}>
                  {item.dropdown ? (
                    <>
                      <button
                        onClick={() => setFeaturesOpen(!featuresOpen)}
                        className="flex items-center justify-between w-full p-4 rounded-xl hover:bg-slate-50 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-slate-600" />
                          <span className="font-medium text-slate-900">{item.label}</span>
                        </div>
                        <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${featuresOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* Mobile Dropdown */}
                      <div className={`ml-4 pl-4 border-l-2 border-slate-200 space-y-2 transition-all duration-300 ${featuresOpen ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                        {item.dropdown.map((dropdownItem, i) => (
                          <Link
                            key={i}
                            href={dropdownItem.href}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                            onClick={() => {
                              setIsOpen(false);
                              setFeaturesOpen(false);
                            }}
                          >
                            <dropdownItem.icon className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-slate-700">{dropdownItem.label}</span>
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5 text-slate-600" />
                      <span className="font-medium text-slate-900">{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Mobile Stats */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="grid grid-cols-3 gap-4">
                  {stats.map((stat, i) => (
                    <div key={i} className="text-center p-3 rounded-lg bg-gradient-to-br from-slate-50 to-white">
                      <div className="text-lg font-bold text-slate-900">{stat.value}</div>
                      <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Mobile CTA Buttons */}
              <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-200">
                <Link href="/auth/sign-in" onClick={() => setIsOpen(false)}>
                  <Button variant="outline" className="w-full justify-center">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up" onClick={() => setIsOpen(false)}>
                  <Button className="w-full justify-center bg-gradient-to-r from-[var(--ease-gradient-start)] to-[var(--ease-gradient-end)]">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--ease-gradient-start)] via-[var(--ease-secondary)] to-[var(--ease-accent)] transform origin-left scale-x-0 transition-transform duration-500" 
             style={{
               transform: 'scaleX(var(--scroll-progress, 0))',
               transformOrigin: 'left'
             }} 
        />
      </header>

      {/* Add this script for scroll progress */}
      <script dangerouslySetInnerHTML={{
        __html: `
          window.addEventListener('scroll', () => {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            document.documentElement.style.setProperty('--scroll-progress', scrolled / 100);
          });
        `
      }} />
    </>
  );
}