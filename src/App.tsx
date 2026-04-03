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
    <div className="bg-bg-base min-h-screen text-white font-sans selection:bg-primary/30 selection:text-white relative">
      <DataWave3D />
      
      <Navbar />
      
      {/* Main content wrapper with z-index to sit above the fixed background */}
      <main className="relative z-10">
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
