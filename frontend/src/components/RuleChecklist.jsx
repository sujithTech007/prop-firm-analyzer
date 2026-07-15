import React from 'react';

export default function RuleChecklist({ rules }) {
  const getBadgeClass = (status) => {
    if (status === 'pass') return 'badge badge-pass';
    if (status === 'warning') return 'badge badge-warning';
    return 'badge badge-breach';
  };

  const getRowBorderColor = (status) => {
    if (status === 'pass') return 'rgba(63, 193, 160, 0.15)';
    if (status === 'warning') return 'rgba(236, 201, 75, 0.15)';
    return 'rgba(229, 89, 94, 0.15)';
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3 style={{ fontSize: '16px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        Compliance Checklist
      </h3>
      
      {rules && rules.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rules.map((rule, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                padding: '14px 16px',
                backgroundColor: 'rgba(30, 38, 46, 0.4)',
                border: `1px solid ${getRowBorderColor(rule.status)}`,
                borderRadius: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontWeight: '600', fontSize: '15px' }}>{rule.rule_name}</span>
                <span className={getBadgeClass(rule.status)}>{rule.status}</span>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {rule.detail}
              </p>
              
              <div style={{ display: 'flex', gap: '24px', fontSize: '12px', marginTop: '4px', borderTop: '1px dashed rgba(42, 52, 60, 0.4)', paddingTop: '6px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Limit: </span>
                  <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{rule.limit_value}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Actual: </span>
                  <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{rule.actual_value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>No rules checked.</p>
      )}
    </div>
  );
}
