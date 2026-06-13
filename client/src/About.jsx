import React from 'react';
import AboutSection from './components/about/AboutSection';

function About() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-950 to-purple-800 text-white">
      <div className="container">
        <AboutSection />
      </div>
    </section>
  );
}

export default About;