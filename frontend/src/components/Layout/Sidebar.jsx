import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, LineChart, Settings, BookOpen, X } from 'lucide-react';

export default function Sidebar({ mobileOpen, onClose }) {
  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Analysis', path: '/dashboard/new', icon: PlusCircle },
    { name: 'History', path: '/dashboard/history', icon: History },
    { name: 'Insights', path: '/dashboard/insights', icon: LineChart },
    { name: 'Academy', path: '/dashboard/academy', icon: BookOpen },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 98,
            transition: 'opacity 0.2s ease'
          }}
          className="mobile-sidebar-overlay"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        style={{
          width: '240px',
          borderRight: '1px solid var(--panel-border)',
          backgroundColor: 'var(--panel-bg)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px',
          // Mobile responsive defaults:
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-240px)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          zIndex: 99
        }} 
        className="responsive-sidebar"
      >
        {/* CSS Media Query overrides for Desktop layout */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .responsive-sidebar {
              position: static !important;
              transform: none !important;
              height: auto !important;
              z-index: 1 !important;
            }
            .mobile-sidebar-close {
              display: none !important;
            }
          }
        `}} />

        {/* Sidebar Title & Close Button Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', paddingLeft: '8px' }}>
          <div>
            <h1 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: 'var(--text-primary)',
              letterSpacing: '-0.5px',
              lineHeight: 1.2
            }}>
              Prop Firm<br/>Readiness
            </h1>
          </div>
          
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="mobile-sidebar-close"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Link Items */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose} // Auto-close drawer on path click
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                color: isActive ? 'var(--accent-teal)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(74, 219, 186, 0.1)' : 'transparent',
                fontWeight: isActive ? 500 : 400,
                transition: 'all 0.2s ease',
              })}
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>
        
        {/* Version Footer */}
        <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--panel-border)', color: 'var(--text-muted)', fontSize: '12px', paddingLeft: '8px' }}>
          Analyzer v2.0
        </div>
      </aside>
    </>
  );
}
