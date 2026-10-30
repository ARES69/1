import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Pricing from './pages/Pricing';
import Workspace from './pages/Workspace';
import Auth from './pages/Auth';
import Blog from './pages/Blog';
import Legal from './pages/Legal';
import { I18nProvider } from './i18n';
import { ThemeProvider } from './lib/theme';

function Layout() {
  const location = useLocation();
  const isWorkspace = location.pathname === '/app';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/app" element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <Workspace />
                </ErrorBoundary>
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Auth />} />
            <Route path="/signup" element={<Auth />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<Blog />} />
            <Route path="/legal/:slug" element={<Legal />} />
            <Route path="*" element={
              <div className="pt-24 pb-20 text-center">
                <h1 className="text-6xl font-bold gradient-text mb-4">404</h1>
                <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>Page not found</p>
                <a href="/" className="px-6 py-3 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 transition-colors">
                  Go Home
                </a>
              </div>
            } />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!isWorkspace && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <I18nProvider>
          <Layout />
        </I18nProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
