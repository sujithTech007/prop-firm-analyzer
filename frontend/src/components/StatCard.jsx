import React from 'react';

export default function StatCard({ label, value, subtext, status }) {
  // Determine if we should color the value text based on status
  let valColor = 'var(--text-primary)';
  if (status === 'pass') valColor = 'var(--pass-color)';
  if (status === 'warning') valColor = 'var(--warning-color)';
  if (status === 'breach') valColor = 'var(--breach-color)';

  return (
    <div className="panel panel-alt" style={{ padding: '16px 20px' }}>
      <div className="input-label" style={{ marginBottom: '8px' }}>{label}</div>
      <div 
        className="mono" 
        style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          color: valColor,
          lineHeight: '1.2' 
        }}
      >
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {subtext}
        </div>
      )}
    </div>
  );
}
