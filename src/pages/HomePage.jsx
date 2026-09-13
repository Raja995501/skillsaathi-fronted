import Navbar from '../components/layout/Navbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import Hero from '../components/home/Hero.jsx'
import ExploreSkills from '../components/home/ExploreSkills.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'

export default function HomePage() {
  return (
    <div className="font-sans" id="home">
      <Navbar />
      <main>
        <Hero />
        <ExploreSkills />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  )
}
