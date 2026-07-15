import React from 'react';

export default function Navbar() {
  return (
    <nav style={{
      borderBottom: '1px solid var(--panel-border)',
      padding: '16px 24px',
      backgroundColor: 'rgba(22, 28, 34, 0.8)',
      backdropFilter: 'blur(8px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: 'var(--brand-color)',
            letterSpacing: '-0.5px',
          }}>
            ⚡ READINESS
          </span>
          <span style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            paddingLeft: '8px',
            borderLeft: '1px solid var(--panel-border)',
          }}>
            prop firm challenge analyzer
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '13px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
          >
            Terminal Docs
          </a>
        </div>
      </div>
    </nav>
  );
}
