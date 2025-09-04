
import React from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import CourseHighlights from '@/components/CourseHighlights';
import Benefits from '@/components/Benefits';
import InstructorBio from '@/components/InstructorBio';
import LeadForm from '@/components/LeadForm';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <CourseHighlights />
        <Benefits />
        <InstructorBio />
        <LeadForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
