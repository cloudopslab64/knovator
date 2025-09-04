
import React from 'react';
import { Button } from '@/components/ui/button';

const InstructorBio = () => {
  return (
    <section id="about" className="section-padding bg-aws-gradient text-white">
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-aws-orange/30 rounded-lg transform -rotate-3"></div>
            <div className="relative bg-gradient-to-br from-aws-blue/90 to-aws-dark p-6 rounded-lg border border-white/10 rotate-3 transform hover:rotate-0 transition-transform duration-500">
              <div className="h-64 md:h-80 bg-gray-300 rounded mb-6">
                {/* Placeholder for instructor image */}
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-aws-blue/80 to-aws-dark/80 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/10 p-3 rounded">
                  <div className="font-bold text-2xl">10+</div>
                  <div className="text-sm">Years Experience</div>
                </div>
                <div className="bg-white/10 p-3 rounded">
                  <div className="font-bold text-2xl">5+</div>
                  <div className="text-sm">AWS Certifications</div>
                </div>
                <div className="bg-white/10 p-3 rounded">
                  <div className="font-bold text-2xl">500+</div>
                  <div className="text-sm">Students Trained</div>
                </div>
                <div className="bg-white/10 p-3 rounded">
                  <div className="font-bold text-2xl">50+</div>
                  <div className="text-sm">Enterprise Projects</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-white text-sm mb-4">
              <span className="w-2 h-2 rounded-full bg-aws-orange mr-2"></span>
              <span>Meet Your Instructor</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">John Doe</h2>
            <p className="text-xl font-medium text-aws-orange">AWS Certified Solutions Architect & DevOps Engineer</p>
            <p className="text-gray-200">
              With over a decade of experience in cloud computing and AWS technologies, 
              John has helped hundreds of students and professionals master AWS and advance 
              their careers in cloud computing.
            </p>
            <p className="text-gray-200">
              Having worked with startups and Fortune 500 companies, John brings real-world 
              experience to the classroom, focusing on practical skills that are immediately 
              applicable in today's cloud-centric job market.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-aws-blue"></div>
                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-aws-blue"></div>
                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-aws-blue"></div>
              </div>
              <p className="text-sm">Joined by expert guest instructors</p>
            </div>
            <Button asChild className="bg-aws-orange hover:bg-orange-500 text-aws-blue mt-2">
              <a href="#contact">Schedule a Free Consultation</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstructorBio;
