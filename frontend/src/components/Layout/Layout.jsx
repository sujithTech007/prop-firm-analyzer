import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      {/* Responsive Sidebar component */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: '64px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(22, 28, 34, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}>
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px'
            }}
            className="mobile-nav-toggle"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          
          <style dangerouslySetInnerHTML={{__html: `
            .mobile-nav-toggle {
              display: flex !important;
            }
            @media (min-width: 768px) {
              .mobile-nav-toggle {
                display: none !important;
              }
            }
          `}} />

          {/* User profile bubble (right-aligned) */}
          <div style={{
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            backgroundColor: 'var(--panel-border)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '14px', 
            fontWeight: 'bold',
            marginLeft: 'auto'
          }}>
            TR
          </div>
        </header>
        
        {/* Core page outlet container */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '16px' }} className="responsive-main">
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 768px) {
              .responsive-main {
                padding: 24px !important;
              }
            }
          `}} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
