import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Простая главная страница
function SimpleHome() {
  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'IBM Plex Mono, monospace',
      backgroundColor: '#fdfcfc',
      color: '#201d1d',
      minHeight: '100vh'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '38px', fontWeight: 'bold', marginBottom: '24px' }}>
          RS-BUILDER
        </h1>
        <p style={{ fontSize: '16px', color: '#9a9898', marginBottom: '32px' }}>
          AI Agent that delivers artifacts, not advice
        </p>
        
        <div style={{ 
          border: '1px solid rgba(15, 0, 0, 0.12)',
          borderRadius: '4px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <div style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '16px' }}>
            <span style={{ color: '#30d158' }}>$</span> rs-builder --help
          </div>
          <div style={{ fontSize: '14px', color: '#9a9898', lineHeight: '1.6' }}>
            <p>AI agent that delivers artifacts, not advice.</p>
            <p style={{ marginTop: '16px' }}>Usage: rs-builder [prompt] [options]</p>
          </div>
        </div>

        <a 
          href="/app"
          style={{
            display: 'inline-block',
            padding: '8px 24px',
            backgroundColor: '#fdfcfc',
            color: '#201d1d',
            border: '1px solid #646262',
            borderRadius: '4px',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          open workspace →
        </a>
      </div>
    </div>
  );
}

// Простая страница логина
function SimpleLogin() {
  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'IBM Plex Mono, monospace',
      backgroundColor: '#fdfcfc',
      color: '#201d1d',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
          Login
        </h1>
        <form>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#6e6e73' }}>
              email
            </label>
            <input 
              type="email"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#f8f7f7',
                border: '1px solid rgba(15, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'IBM Plex Mono, monospace'
              }}
              placeholder="you@example.com"
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: '#6e6e73' }}>
              password
            </label>
            <input 
              type="password"
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#f8f7f7',
                border: '1px solid rgba(15, 0, 0, 0.12)',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'IBM Plex Mono, monospace'
              }}
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '10px 24px',
              backgroundColor: '#fdfcfc',
              color: '#201d1d',
              border: '1px solid #646262',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              fontFamily: 'IBM Plex Mono, monospace',
              cursor: 'pointer'
            }}
          >
            login →
          </button>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SimpleHome />} />
        <Route path="/login" element={<SimpleLogin />} />
        <Route path="/signup" element={<SimpleLogin />} />
        <Route path="*" element={
          <div style={{ 
            padding: '40px', 
            fontFamily: 'IBM Plex Mono, monospace',
            textAlign: 'center'
          }}>
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>404</h1>
            <p style={{ color: '#9a9898', marginBottom: '24px' }}>page not found</p>
            <a href="/" style={{ color: '#007aff' }}>← go home</a>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}
