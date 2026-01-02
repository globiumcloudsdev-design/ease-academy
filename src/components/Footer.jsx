import Link from 'next/link';
import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg" style={{ background: 'linear-gradient(to bottom right, var(--ease-gradient-start), var(--ease-gradient-end))' }}>
                E
              </div>
              <div>
                <h3 className="text-xl font-bold" style={{ background: 'linear-gradient(to right, var(--ease-gradient-start), var(--ease-gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Ease Academy</h3>
                <p className="text-sm" style={{ color: 'var(--ease-muted)' }}>School Management System</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6 max-w-md">
              A comprehensive school management system with multi-branch support, role-based access control, and modern features designed for the future of education.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Info</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-blue-600" />
                <span className="text-gray-600">+92 335 2778488 || 02137520456</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="text-gray-600">globiumclouds@gmail.com</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-full w-8 text-blue-600 mt-0.5" />
                <span className="text-gray-600">House R-84 , near Al.Habeeb Resturent, <br /> Sector 15-A/4 Sector 15 A 4 <br /> Buffer Zone, Karachi, Pakistan, Karachi Lines, Pakistan</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2025 Ease Academy. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                Terms of Service
              </Link>
              <Link href="#" className="text-gray-600 hover:text-blue-600 transition-colors text-sm">
                Support
              </Link>
            </div>
          </div>
          <p className="text-gray-600 text-sm mt-4 text-center">
            <span className="font-mono font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Powered By: Globium Clouds</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
