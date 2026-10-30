import Motion from '@/components/Motion';
import Loader from '@/components/Loader';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import About from '@/components/About';
import Work from '@/components/Work';
import Services from '@/components/Services';
import Industries from '@/components/Industries';
import Lab from '@/components/Lab';
import Process from '@/components/Process';
import Cta from '@/components/Cta';
import Footer from '@/components/Footer';
import Brief from '@/components/Brief';

export default function Home() {
  return (
    <>
      <Loader />
      <Motion />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <About />
        <Work />
        <Services />
        <Industries />
        <Lab />
        <Process />
        <Cta />
      </main>
      <Footer />
      <Brief />
    </>
  );
}
