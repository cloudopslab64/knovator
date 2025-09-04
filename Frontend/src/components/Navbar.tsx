
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <a href="/" className="flex items-center space-x-2">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 4L21 9V19L12 22L3 19V9Z" stroke="#232F3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22V13" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 9L12 13L3 9" stroke="#232F3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-bold text-xl text-aws-blue">AWS Academy</span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#courses" className="text-sm font-medium hover:text-aws-orange transition-colors">
            Courses
          </a>
          <a href="#benefits" className="text-sm font-medium hover:text-aws-orange transition-colors">
            Benefits
          </a>
          <a href="#about" className="text-sm font-medium hover:text-aws-orange transition-colors">
            About Instructor
          </a>
          <Button asChild className="bg-aws-blue hover:bg-aws-dark text-white">
            <a href="#contact">Register Now</a>
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <button 
          className="md:hidden" 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-16 inset-x-0 bg-white border-b">
          <div className="container py-4 space-y-4">
            <a 
              href="#courses" 
              className="block text-sm font-medium hover:text-aws-orange transition-colors" 
              onClick={() => setIsOpen(false)}
            >
              Courses
            </a>
            <a 
              href="#benefits" 
              className="block text-sm font-medium hover:text-aws-orange transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Benefits
            </a>
            <a 
              href="#about" 
              className="block text-sm font-medium hover:text-aws-orange transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About Instructor
            </a>
            <Button 
              asChild 
              className="w-full bg-aws-blue hover:bg-aws-dark text-white"
              onClick={() => setIsOpen(false)}
            >
              <a href="#contact">Register Now</a>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
