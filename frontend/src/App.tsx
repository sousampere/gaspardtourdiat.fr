import { useEffect, useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';

import { Background } from './components/Background';
import { CommandPalette } from './components/CommandPalette';
import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { About } from './pages/About';
import { Admin } from './pages/Admin';
import { Contact } from './pages/Contact';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Projects } from './pages/Projects';

/** A client-side route change should start at the top of the document. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:border focus:border-acid/40 focus:bg-panel focus:px-4 focus:py-2 focus:font-mono focus:text-sm focus:text-acid"
      >
        Aller au contenu
      </a>

      <Background />
      <ScrollToTop />
      <Navbar onOpenPalette={() => setPaletteOpen(true)} />

      <main id="contenu" className="mx-auto w-full max-w-5xl px-4 pt-28 sm:px-6 sm:pt-32">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
