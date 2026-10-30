export default function TestPage() {
  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'monospace',
      backgroundColor: '#fdfcfc',
      color: '#201d1d',
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>
        RS-BUILDER Test Page
      </h1>
      <p style={{ fontSize: '16px', marginBottom: '20px' }}>
        If you can see this page, the basic rendering is working.
      </p>
      <div style={{ 
        padding: '20px', 
        border: '1px solid rgba(15, 0, 0, 0.12)',
        borderRadius: '4px',
        backgroundColor: '#f8f7f7'
      }}>
        <p style={{ fontSize: '14px', color: '#9a9898' }}>
          Terminal-style box
        </p>
      </div>
      <button style={{
        marginTop: '20px',
        padding: '8px 24px',
        backgroundColor: '#fdfcfc',
        color: '#201d1d',
        border: '1px solid #646262',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '14px',
        cursor: 'pointer'
      }}>
        Test Button
      </button>
    </div>
  );
}
