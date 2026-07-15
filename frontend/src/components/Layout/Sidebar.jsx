import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, LineChart, Settings, BookOpen } from 'lucide-react';

export default function Sidebar() {
  const navItems = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'New Analysis', path: '/dashboard/new', icon: PlusCircle },
    { name: 'History', path: '/dashboard/history', icon: History },
    { name: 'Insights', path: '/dashboard/insights', icon: LineChart },
    { name: 'Academy', path: '/dashboard/academy', icon: BookOpen },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '240px',
      borderRight: '1px solid var(--panel-border)',
      backgroundColor: 'var(--panel-bg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px'
    }}>
      <div style={{ marginBottom: '40px', paddingLeft: '8px' }}>
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

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
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
      
      <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--panel-border)', color: 'var(--text-muted)', fontSize: '12px', paddingLeft: '8px' }}>
        Analyzer v2.0
      </div>
    </aside>
  );
}
