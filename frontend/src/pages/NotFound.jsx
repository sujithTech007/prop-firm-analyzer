import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ChevronLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "404 Page Not Found | Prop Firm Analyzer";
  }, []);

  return (
    <div className="fade-in" style={{ 
      textAlign: 'center', padding: '100px 20px', maxWidth: '500px', margin: '0 auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
    }}>
      <div style={{
        width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(229, 89, 94, 0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--breach-color)'
      }}>
        <ShieldAlert size={36} />
      </div>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 8px 0', color: '#fff' }}>404 - Page Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '14.5px', lineHeight: '1.5' }}>
          The page you are looking for does not exist or has been moved. Check the URL or return to the main dashboard.
        </p>
      </div>
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          backgroundColor: 'var(--accent-teal)', color: '#000',
          border: 'none', padding: '10px 18px', borderRadius: '6px',
          fontSize: '13.5px', fontWeight: 600, cursor: 'pointer'
        }}
      >
        <ChevronLeft size={16} />
        Back to Dashboard
      </button>
    </div>
  );
}
