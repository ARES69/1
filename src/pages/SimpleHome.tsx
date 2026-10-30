import { Link } from 'react-router-dom';

export default function SimpleHome() {
  return (
    <div style={{ 
      padding: '40px 20px', 
      fontFamily: 'IBM Plex Mono, monospace',
      backgroundColor: '#fdfcfc',
      color: '#201d1d',
      minHeight: 'calc(100vh - 56px)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Terminal Window */}
        <div style={{ 
          border: '1px solid rgba(15, 0, 0, 0.12)',
          borderRadius: '4px',
          marginBottom: '40px',
          overflow: 'hidden'
        }}>
          {/* Terminal Header */}
          <div style={{
            backgroundColor: '#f8f7f7',
            borderBottom: '1px solid rgba(15, 0, 0, 0.12)',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff3b30' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff9f0a' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#30d158' }} />
            </div>
            <span style={{ fontSize: '12px', color: '#6e6e73', marginLeft: '8px' }}>
              ~/rs-builder
            </span>
          </div>
          
          {/* Terminal Content */}
          <div style={{ padding: '24px', backgroundColor: '#fdfcfc' }}>
            <div style={{ fontSize: '14px', color: '#6e6e73', marginBottom: '16px' }}>
              <span style={{ color: '#30d158' }}>$</span> rs-builder --help
            </div>
            <div style={{ fontSize: '14px', color: '#9a9898', lineHeight: '1.6' }}>
              <p>AI agent that delivers artifacts, not advice.</p>
              <p style={{ marginTop: '16px', color: '#6e6e73' }}>Usage:</p>
              <p>  rs-builder [prompt] [options]</p>
              <p style={{ marginTop: '16px', color: '#6e6e73' }}>Examples:</p>
              <p>  rs-builder "build a landing page"</p>
              <p>  rs-builder "create a pitch deck"</p>
              <p>  rs-builder "make a research report"</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <h1 style={{ 
          fontSize: '38px', 
          fontWeight: 'bold', 
          lineHeight: '1.5',
          marginBottom: '24px',
          color: '#201d1d'
        }}>
          AI Agent that delivers artifacts, not advice
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          lineHeight: '1.5',
          marginBottom: '32px',
          color: '#9a9898',
          maxWidth: '600px'
        }}>
          RS-BUILDER is a hands-on AI builder that produces real deliverables — landing pages, pitch decks, research reports, playable games. One prompt, working output.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '40px' }}>
          <Link 
            to="/app"
            style={{
              padding: '8px 24px',
              backgroundColor: '#fdfcfc',
              color: '#201d1d',
              border: '1px solid #646262',
              borderRadius: '4px',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            open workspace →
          </Link>
          <Link 
            to="/pricing"
            style={{
              padding: '8px 24px',
              backgroundColor: 'transparent',
              color: '#6e6e73',
              border: 'none',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '14px',
              fontWeight: '500',
              textDecoration: 'underline',
              display: 'inline-block'
            }}
          >
            view pricing →
          </Link>
        </div>

        {/* Features */}
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ 
            fontSize: '16px', 
            fontWeight: 'bold',
            marginBottom: '24px',
            color: '#201d1d'
          }}>
            # features
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { num: '01', title: 'Real Sandbox', desc: 'Code executes in a real sandbox with filesystem, shell, and network access.' },
              { num: '02', title: 'Multi-Model Chain', desc: 'Free-tier LLM chain with automatic fallback.' },
              { num: '03', title: 'Live Preview', desc: 'See your artifact rendered in real-time as the agent builds it.' },
              { num: '04', title: 'Git Integration', desc: 'Built-in version control with commits and branches.' },
              { num: '05', title: 'Deploy to Production', desc: 'One-click deploy to Vercel, Netlify, or GitHub Pages.' },
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 'bold', 
                  color: '#007aff',
                  marginTop: '2px'
                }}>
                  {feature.num}
                </span>
                <div>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    color: '#201d1d'
                  }}>
                    {feature.title}
                  </h3>
                  <p style={{ 
                    fontSize: '14px',
                    color: '#9a9898',
                    lineHeight: '1.5'
                  }}>
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
