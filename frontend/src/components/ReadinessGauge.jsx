import React, { useEffect, useState } from 'react';

export default function ReadinessGauge({ score, passProbability, verdict }) {
  const [offset, setOffset] = useState(251.2); // Initial offset represents 0% (2 * PI * r)
  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.327

  useEffect(() => {
    // Animate the gauge stroke fill after mount
    const progress = Math.min(Math.max(score, 0), 100);
    const progressOffset = circumference - (progress / 100) * circumference;
    // Set a tiny timeout to trigger CSS transition
    const timer = setTimeout(() => {
      setOffset(progressOffset);
    }, 100);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  // Color semantic mappings
  let color = 'var(--breach-color)';
  let verdictClass = 'badge badge-breach';
  if (score >= 70) {
    color = 'var(--pass-color)';
    verdictClass = 'badge badge-pass';
  } else if (score >= 40) {
    color = 'var(--warning-color)';
    verdictClass = 'badge badge-warning';
  }

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px' }}>
      <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
        Challenge Readiness Score
      </h3>

      <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '20px' }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="rgba(42, 52, 60, 0.3)"
            strokeWidth="8"
          />
          {/* Animated progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Text readout inside the circle */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <span className="mono" style={{ fontSize: '32px', fontWeight: '800', color: '#FFFFFF', lineHeight: '1' }}>
            {score}
          </span>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '2px', letterSpacing: '0.5px' }}>
            points
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <span className={verdictClass} style={{ fontSize: '13px', padding: '6px 14px' }}>
          {verdict}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Pass Probability: <strong className="mono" style={{ color: 'var(--text-primary)' }}>{(passProbability * 100).toFixed(1)}%</strong>
        </span>
      </div>
    </div>
  );
}
