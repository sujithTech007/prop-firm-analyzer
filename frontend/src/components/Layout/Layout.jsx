import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{
          height: '64px',
          borderBottom: '1px solid var(--panel-border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'flex-end'
        }}>
          {/* Add a user profile or setting icon if needed */}
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--panel-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold'
          }}>
            TR
          </div>
        </header>
        
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
