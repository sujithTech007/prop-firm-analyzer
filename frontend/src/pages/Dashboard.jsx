import React, { useEffect, useState } from 'react';
import UploadTrades from '../components/UploadTrades';

export default function Dashboard({ onAnalyze, isLoading }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger the background line sketch animation on mount
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden', padding: '40px 0' }}>
      
      {/* Signature Ambient Animated Background Line */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: 0,
        width: '100%',
        height: '350px',
        opacity: 0.15,
        pointerEvents: 'none',
        zIndex: 0
      }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 300"
          preserveAspectRatio="none"
          style={{ overflow: 'visible' }}
        >
          <path
            d="M 0 250 C 150 220, 250 280, 380 200 C 500 120, 600 240, 750 160 C 900 80, 1000 180, 1200 100"
            fill="none"
            stroke="var(--brand-color)"
            strokeWidth="3.5"
            strokeDasharray="1800"
            strokeDashoffset={animate ? "0" : "1800"}
            style={{
              transition: 'stroke-dashoffset 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              filter: 'drop-shadow(0 0 8px rgba(232, 163, 61, 0.6))'
            }}
          />
          {/* Secondary subtle line for depth */}
          <path
            d="M 0 260 C 180 240, 280 290, 420 220 C 550 140, 650 260, 800 180 C 950 100, 1050 200, 1200 120"
            fill="none"
            stroke="var(--pass-color)"
            strokeWidth="1.5"
            strokeDasharray="1800"
            strokeDashoffset={animate ? "0" : "1800"}
            style={{
              transition: 'stroke-dashoffset 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              transitionDelay: '0.3s',
              opacity: 0.7
            }}
          />
        </svg>
      </div>

      {/* Main Dashboard Panel */}
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '800px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{
            fontSize: '32px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '10px',
            fontWeight: '700'
          }}>
            Analyze Your Readiness
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '600px', margin: '0 auto', lineHeight: '1.6' }}>
            Upload your historical trade data CSV and evaluate if your trading metrics match the requirements of major prop firm challenge evaluations.
          </p>
        </header>

        <div className="panel panel-brand">
          <UploadTrades onAnalyze={onAnalyze} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
