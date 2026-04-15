/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TheChoice from './components/TheChoice';
import Services from './components/Services';
import WhyNow from './components/WhyNow';
import About from './components/About';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import DataWave3D from './components/DataWave3D';

export default function App() {
  return (
    <div className="bg-bg-base min-h-screen text-white font-sans selection:bg-primary/30 selection:text-white relative overflow-hidden">
      {/* Background Enhancements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="aurora-blur bg-accent top-[-20%] left-[-20%] animate-aurora opacity-30 w-[1000px] h-[1000px]"></div>
        <div className="aurora-blur bg-cta bottom-[-20%] right-[-20%] animate-aurora opacity-30 w-[1000px] h-[1000px]" style={{ animationDirection: 'reverse', animationDuration: '25s' }}></div>
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-125 contrast-150"></div>
      </div>

      <DataWave3D />
      
      <Navbar />
      
      {/* Main content wrapper with z-index to sit above the fixed background */}
      <main className="relative z-10 w-full">
        <Hero />
        <Services />
        <WhyNow />
        <TheChoice />
        <About />
        <FinalCTA />
      </main>
      
      <Footer />
    </div>
  );
}
