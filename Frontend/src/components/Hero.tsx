
import React from 'react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  return (
    <section className="py-16 md:py-24 lg:py-32 bg-aws-gradient text-white overflow-hidden">
      <div className="container relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-aws-orange mr-2"></span>
              <span>Professional AWS Training</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Master AWS Cloud <span className="text-aws-orange">Engineering</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 max-w-xl">
              Comprehensive AWS training courses designed to help you build cloud expertise, earn certifications, and advance your career.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild size="lg" className="bg-aws-orange hover:bg-orange-500 text-aws-blue">
                <a href="#contact">Get Started Now</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <a href="#courses">Explore Courses</a>
              </Button>
            </div>
            <div className="pt-6">
              <p className="text-sm text-gray-300">Trusted by professionals from</p>
              <div className="flex items-center gap-6 mt-4 opacity-80">
                <div className="text-sm font-semibold">Amazon</div>
                <div className="text-sm font-semibold">Microsoft</div>
                <div className="text-sm font-semibold">Google</div>
                <div className="text-sm font-semibold">IBM</div>
              </div>
            </div>
          </div>
          <div className="relative animate-slide-up lg:pl-10">
            <div className="relative">
              <div className="absolute inset-0 bg-aws-orange/20 rounded-lg transform translate-x-4 translate-y-4"></div>
              <div className="bg-gradient-to-br from-aws-blue/90 to-aws-dark/90 p-6 md:p-8 rounded-lg relative z-10 border border-white/10">
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-white/10 rounded-md p-4">
                    <h3 className="font-medium mb-1">AWS Solutions Architect</h3>
                    <p className="text-sm text-gray-200">Learn to design distributed applications and systems</p>
                  </div>
                  <div className="bg-white/10 rounded-md p-4">
                    <h3 className="font-medium mb-1">AWS Developer</h3>
                    <p className="text-sm text-gray-200">Master AWS services for application development</p>
                  </div>
                  <div className="bg-white/10 rounded-md p-4">
                    <h3 className="font-medium mb-1">AWS SysOps Administrator</h3>
                    <p className="text-sm text-gray-200">Deploy, manage, and operate scalable systems</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
