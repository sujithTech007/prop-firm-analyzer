import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, Play, Award, AlertTriangle, ArrowRight, 
  UploadCloud, ShieldAlert, Cpu, Sparkles, RefreshCw, 
  BarChart3, CheckCircle, FileText, Settings, X, Globe,
  ShieldCheck, AlertCircle, FileSpreadsheet, Layers
} from 'lucide-react';
import { getDemoTrades, analyzeReadiness } from '../services/api';
import { toast } from 'react-toastify';

export default function Landing() {
  const navigate = useNavigate();
  
  // Announcement Bar dismissible state
  const [showAnnounce, setShowAnnounce] = useState(true);
  
  // Sample report loading state
  const [demoLoading, setDemoLoading] = useState(false);

  // Live Compliance Simulator states
  const [simWinRate, setSimWinRate] = useState(54);
  const [simProfitFactor, setSimProfitFactor] = useState(1.7);
  const [simDrawdown, setSimDrawdown] = useState(3.2);

  // Active Tab for the Features Spotlight Live Preview
  const [activeProfileTab, setActiveProfileTab] = useState('ftmo');

  useEffect(() => {
    document.title = "Pass Your Prop Challenge | Prop Firm Challenge Readiness Analyzer";
  }, []);

  // Simulator math
  const readinessScore = Math.min(100, Math.max(10, Math.round((simWinRate * 0.9) + (simProfitFactor * 14) - (simDrawdown * 3.5))));
  const passProb = Math.min(99, Math.max(1, Math.round(readinessScore * 0.96)));
  
  let scoreColor = "var(--warning-color)";
  let scoreVerdict = "NEEDS CALIBRATION";
  if (readinessScore >= 70) {
    scoreColor = "var(--pass-color)";
    scoreVerdict = "OPTIMAL PASS READINESS";
  } else if (readinessScore < 45) {
    scoreColor = "var(--breach-color)";
    scoreVerdict = "CRITICAL DRAWDOWN RISK";
  }

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference;

  // Run the actual demo analysis and navigate to results
  const handleTryDemo = async () => {
    setDemoLoading(true);
    const toastId = toast.loading("Downloading demo trade records...");
    try {
      const csvText = await getDemoTrades();
      const file = new File([csvText], "sample_trades.csv", { type: "text/csv" });
      const defaultRules = {
        account_size: 100000.0,
        max_daily_loss_pct: 5.0,
        max_total_drawdown_pct: 10.0,
        profit_target_pct: 10.0,
        min_trading_days: 4,
        consistency_rule_pct: 40.0
      };
      
      toast.update(toastId, { render: "Running AI diagnostics engine...", type: "info", isLoading: true });
      const res = await analyzeReadiness(file, defaultRules);
      
      toast.update(toastId, { render: "Sample report loaded!", type: "success", isLoading: false, autoClose: 3000 });
      navigate(`/dashboard/results/${res.id}`);
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: err.message || "Failed to generate report.", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setDemoLoading(false);
    }
  };

  // Scroll to section helper
  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* 1. TOP ANNOUNCEMENT BAR */}
      {showAnnounce && (
        <div style={{
          backgroundColor: 'var(--brand-color)',
          color: '#0E1317',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 700,
          textAlign: 'center',
          position: 'relative',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 100,
          fontFamily: "'Space Grotesk', sans-serif",
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
          <span>
            ⚡ VERSION 2.0 LIVE: New consistency rule checking and calibrated ML drawdown models are now active.
          </span>
          <button 
            onClick={() => setShowAnnounce(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0E1317',
              cursor: 'pointer',
              position: 'absolute',
              right: '16px',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 2. NAVBAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 90,
        backgroundColor: 'rgba(14, 19, 23, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--panel-border)',
        height: '70px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            backgroundColor: 'rgba(232, 163, 61, 0.12)',
            border: '1px solid var(--brand-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <TrendingUp size={20} color="var(--brand-color)" />
          </div>
          <span style={{ 
            fontFamily: "'Space Grotesk', sans-serif", 
            fontWeight: 700, 
            fontSize: '17px', 
            letterSpacing: '-0.5px',
            color: '#fff'
          }}>
            PROP FIRM READINESS
          </span>
        </div>

        {/* Navigation center links */}
        <nav style={{ display: 'none', gap: '32px' }} className="nav-center-menu">
          <style dangerouslySetInnerHTML={{__html: `@media (min-width: 768px) { .nav-center-menu { display: flex !important; } }`}} />
          <button onClick={() => scrollToSection('how-it-works')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }} className="hover-white-nav">How it works</button>
          <button onClick={() => scrollToSection('feature-profiles')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }} className="hover-white-nav">Firm Profiles</button>
          <button onClick={() => scrollToSection('why-exists')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }} className="hover-white-nav">Insights</button>
          <button onClick={() => scrollToSection('faqs')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: 500, transition: 'color 0.2s' }} className="hover-white-nav">FAQs</button>
        </nav>

        {/* Custom CSS overrides for hover nav */}
        <style dangerouslySetInnerHTML={{__html: `.hover-white-nav:hover { color: #fff !important; }`}} />

        {/* Nav right CTA buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '12px', textTransform: 'none', border: '1px solid var(--panel-border)' }}
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/dashboard/new')}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '12px', textTransform: 'none' }}
          >
            Try Free Analysis
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1 }}>

        {/* 3. HERO SECTION (Asymmetric 2-Column) */}
        <section style={{
          position: 'relative',
          padding: '80px 24px 100px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          borderBottom: '1px solid var(--panel-border)'
        }}>
          {/* Grid Background texture */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: 'radial-gradient(rgba(232, 163, 61, 0.03) 2px, transparent 2px)',
            backgroundSize: '32px 32px', pointerEvents: 'none', zIndex: 0
          }} />

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr', 
            gap: '48px', 
            alignItems: 'center', 
            zIndex: 1, 
            position: 'relative'
          }} className="hero-columns">
            <style dangerouslySetInnerHTML={{__html: `@media (min-width: 992px) { .hero-columns { grid-template-columns: 1.25fr 1fr !important; } }`}} />

            {/* Left Column Content */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, cubicBezier: [0.16, 1, 0.3, 1] }}
              style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
            >
              <div style={{ display: 'inline-flex' }}>
                <span className="mono" style={{ 
                  backgroundColor: 'rgba(232, 163, 61, 0.08)', 
                  color: 'var(--brand-color)',
                  border: '1px solid rgba(232, 163, 61, 0.25)', 
                  padding: '6px 14px',
                  borderRadius: '9999px', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase'
                }}>
                  🛡️ Risk Compliance Diagnostics for Traders
                </span>
              </div>

              <h1 style={{ 
                fontSize: 'clamp(36px, 5.5vw, 62px)', 
                fontWeight: 800, 
                lineHeight: 1.05,
                letterSpacing: '-1.5px', 
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#fff'
              }}>
                AUDIT YOUR EDGE.<br/>
                <span style={{ 
                  background: 'linear-gradient(90deg, var(--brand-color), #FFC061)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  PASS THE CHALLENGE.
                </span>
              </h1>

              <p style={{ color: 'var(--text-secondary)', fontSize: '17px', lineHeight: 1.6, maxWidth: '580px' }}>
                Audit your trade statements before purchasing an evaluation. Detect drawdowns, confirm profit consistency limits, and verify pass probability against prop firm rules using machine learning.
              </p>

              <div style={{ 
                color: 'var(--text-muted)', 
                fontSize: '13px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                borderLeft: '2px solid var(--panel-border)',
                paddingLeft: '12px'
              }}>
                <span>Calibrated for evaluations similar to FTMO, FundingPips, and Topstep.</span>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                <button 
                  onClick={() => navigate('/dashboard/new')}
                  className="btn btn-primary animate-lift"
                  style={{ 
                    padding: '16px 32px', 
                    fontSize: '14px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    boxShadow: '0 4px 20px rgba(232, 163, 61, 0.2)' 
                  }}
                >
                  <UploadCloud size={16} />
                  Run Free Analysis
                </button>
                
                <button 
                  onClick={handleTryDemo}
                  disabled={demoLoading}
                  className="btn btn-secondary animate-lift"
                  style={{ 
                    padding: '16px 32px', 
                    fontSize: '14px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    borderColor: 'var(--panel-border)'
                  }}
                >
                  {demoLoading ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      Auditing Sample...
                    </>
                  ) : (
                    <>
                      <FileText size={16} />
                      See Sample Report
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Right Column Content - Stylized Compliance Simulator */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1, cubicBezier: [0.16, 1, 0.3, 1] }}
              style={{ zIndex: 2 }}
            >
              <div className="panel" style={{ 
                padding: '30px', 
                borderColor: 'var(--panel-border)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', 
                position: 'relative',
                backgroundColor: 'rgba(22, 28, 34, 0.8)',
                backdropFilter: 'blur(8px)'
              }}>
                {/* Visual grid overlay inside simulator panel */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.005) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.005) 1px, transparent 1px)',
                  backgroundSize: '20px 20px', pointerEvents: 'none'
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={14} color="var(--brand-color)" />
                    <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-secondary)' }} className="mono">
                      COMPLIANCE SIMULATOR
                    </h3>
                  </div>
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--pass-color)', fontWeight: 'bold', backgroundColor: 'rgba(63, 193, 160, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    ACTIVE MATRIX
                  </span>
                </div>

                {/* Score Circular Dial & Verdict Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '28px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0, margin: '0 auto' }}>
                    <svg width="100%" height="100%" viewBox="0 0 110 110" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="55" cy="55" r={radius} fill="transparent" stroke="rgba(42, 52, 60, 0.4)" strokeWidth="7" />
                      <circle 
                        cx="55" 
                        cy="55" 
                        r={radius} 
                        fill="transparent" 
                        stroke={scoreColor} 
                        strokeWidth="7"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                      />
                    </svg>
                    <div style={{ 
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span className="mono" style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>{readinessScore}</span>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>SCORE</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '180px' }}>
                    <span className="mono" style={{ fontSize: '11px', color: scoreColor, fontWeight: 700, letterSpacing: '0.5px', display: 'block' }}>
                      ● {scoreVerdict}
                    </span>
                    <h4 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 4px 0', color: '#fff' }}>
                      {passProb}% Pass Probability
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                      Correlated against 16 core risk boundaries including consistency metric ceilings.
                    </p>
                  </div>
                </div>

                {/* Simulated Sliders */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', borderTop: '1px solid var(--panel-border)', paddingTop: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Strategy Win Rate:</span>
                      <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simWinRate}%</span>
                    </div>
                    <input 
                      type="range" min="30" max="80" 
                      value={simWinRate} 
                      onChange={e => setSimWinRate(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--brand-color)', cursor: 'pointer' }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Profit Factor:</span>
                      <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simProfitFactor}x</span>
                    </div>
                    <input 
                      type="range" min="0.8" max="2.8" step="0.1" 
                      value={simProfitFactor} 
                      onChange={e => setSimProfitFactor(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--brand-color)', cursor: 'pointer' }} 
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Maximum Drawdown:</span>
                      <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simDrawdown}%</span>
                    </div>
                    <input 
                      type="range" min="0.5" max="8.0" step="0.5" 
                      value={simDrawdown} 
                      onChange={e => setSimDrawdown(parseFloat(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--brand-color)', cursor: 'pointer' }} 
                    />
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        </section>

        {/* 4. TRUST/STATS STRIP */}
        <section style={{
          backgroundColor: 'rgba(22, 28, 34, 0.4)',
          borderBottom: '1px solid var(--panel-border)',
          padding: '48px 24px'
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
              textAlign: 'center'
            }}>
              
              <div>
                <h3 className="mono" style={{ fontSize: '36px', fontWeight: 800, color: 'var(--brand-color)', marginBottom: '4px' }}>16</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Rule Categories Audited
                </p>
              </div>

              <div>
                <h3 className="mono" style={{ fontSize: '36px', fontWeight: 800, color: 'var(--accent-teal)', marginBottom: '4px' }}>4+</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  ML Models Calibrated
                </p>
              </div>

              <div>
                <h3 className="mono" style={{ fontSize: '36px', fontWeight: 800, color: 'var(--warning-color)', marginBottom: '4px' }}>&lt; 3s</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Avg. Diagnostic Time
                </p>
              </div>

              <div>
                <h3 className="mono" style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>100%</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                  Broker Agnostic Ingestion
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* 5. "HOW IT WORKS" SECTION */}
        <section id="how-it-works" style={{
          padding: '100px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          borderBottom: '1px solid var(--panel-border)',
          position: 'relative'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: '#fff', marginBottom: '8px' }}>
              How it works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '520px', margin: '0 auto' }}>
              Audit your trades in three quick steps to isolate critical breaches before they invalidate your evaluation.
            </p>
          </div>

          {/* Connected timeline container */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '30px',
            position: 'relative',
            zIndex: 1
          }}>
            
            {/* Step 1 */}
            <div className="panel" style={{ padding: '32px', borderColor: 'var(--panel-border)', position: 'relative' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '8px',
                backgroundColor: 'rgba(74, 219, 186, 0.08)',
                border: '1px solid rgba(74, 219, 186, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <UploadCloud size={24} color="var(--accent-teal)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                1. Upload Trade Logs
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.5', margin: 0 }}>
                Drag and drop your trade statements exported from MT4, MT5, or cTrader. Our broker-tolerant parser automatically sanitizes transaction columns.
              </p>
            </div>

            {/* Step 2 */}
            <div className="panel" style={{ padding: '32px', borderColor: 'var(--panel-border)', position: 'relative' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '8px',
                backgroundColor: 'rgba(232, 163, 61, 0.08)',
                border: '1px solid rgba(232, 163, 61, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Cpu size={24} color="var(--brand-color)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                2. Audit Compliance Rules
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.5', margin: 0 }}>
                We test your trading curve against rigorous metrics including consistency limits (max single day profit %) and absolute daily/overall drawdown margins.
              </p>
            </div>

            {/* Step 3 */}
            <div className="panel" style={{ padding: '32px', borderColor: 'var(--panel-border)', position: 'relative' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '8px',
                backgroundColor: 'rgba(236, 201, 75, 0.08)',
                border: '1px solid rgba(236, 201, 75, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Sparkles size={24} color="var(--warning-color)" />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                3. Inspect AI Predictor
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.5', margin: 0 }}>
                Get an instant overall readiness rating and a machine-learning based pass probability report with exact feature contribution charts.
              </p>
            </div>

          </div>
        </section>

        {/* 6. FEATURE HIGHLIGHT SECTION (Asymmetric Alternating Rows) */}
        <section id="feature-profiles" style={{
          padding: '100px 24px',
          maxWidth: '1200px',
          margin: '0 auto',
          borderBottom: '1px solid var(--panel-border)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: '#fff', marginBottom: '8px' }}>
              Engineered for Prop Challenge Compliance
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '520px', margin: '0 auto' }}>
              A set of diagnostic modules built specifically to address the root causes of challenge failures.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
            
            {/* ROW 1: PRESET DATABASE (Image Left, Text Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center' }} className="feature-row-1">
              <style dangerouslySetInnerHTML={{__html: `@media (min-width: 992px) { .feature-row-1 { grid-template-columns: 1fr 1.1fr !important; } }`}} />
              
              {/* Left Column: Interactive Presets Card */}
              <div className="panel" style={{ padding: '24px', borderColor: 'var(--panel-border)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button 
                    onClick={() => setActiveProfileTab('ftmo')}
                    className="mono"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid',
                      cursor: 'pointer',
                      backgroundColor: activeProfileTab === 'ftmo' ? 'rgba(74, 219, 186, 0.1)' : 'transparent',
                      color: activeProfileTab === 'ftmo' ? 'var(--accent-teal)' : 'var(--text-secondary)',
                      borderColor: activeProfileTab === 'ftmo' ? 'var(--accent-teal)' : 'var(--panel-border)',
                      fontWeight: 'bold'
                    }}
                  >
                    FTMO 100K
                  </button>
                  <button 
                    onClick={() => setActiveProfileTab('pips')}
                    className="mono"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid',
                      cursor: 'pointer',
                      backgroundColor: activeProfileTab === 'pips' ? 'rgba(232, 163, 61, 0.1)' : 'transparent',
                      color: activeProfileTab === 'pips' ? 'var(--brand-color)' : 'var(--text-secondary)',
                      borderColor: activeProfileTab === 'pips' ? 'var(--brand-color)' : 'var(--panel-border)',
                      fontWeight: 'bold'
                    }}
                  >
                    FUNDINGPIPS 100K
                  </button>
                  <button 
                    onClick={() => setActiveProfileTab('custom')}
                    className="mono"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      border: '1px solid',
                      cursor: 'pointer',
                      backgroundColor: activeProfileTab === 'custom' ? 'rgba(236, 201, 75, 0.1)' : 'transparent',
                      color: activeProfileTab === 'custom' ? 'var(--warning-color)' : 'var(--text-secondary)',
                      borderColor: activeProfileTab === 'custom' ? 'var(--warning-color)' : 'var(--panel-border)',
                      fontWeight: 'bold'
                    }}
                  >
                    CUSTOM AUDIT
                  </button>
                </div>

                <div style={{ backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid var(--panel-border)', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Evaluation Metric</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Rule Threshold</span>
                  </div>
                  {activeProfileTab === 'ftmo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="mono">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Target Profit</span>
                        <span style={{ color: 'var(--pass-color)' }}>$10,000 (10%)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Max Daily Drawdown</span>
                        <span style={{ color: 'var(--breach-color)' }}>$5,000 (5%)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Max Overall Drawdown</span>
                        <span style={{ color: 'var(--breach-color)' }}>$10,000 (10%)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Consistency Check</span>
                        <span style={{ color: 'var(--text-secondary)' }}>Not Enforced</span>
                      </div>
                    </div>
                  )}
                  {activeProfileTab === 'pips' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="mono">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Target Profit</span>
                        <span style={{ color: 'var(--pass-color)' }}>$8,000 (8%)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Max Daily Loss (Relative)</span>
                        <span style={{ color: 'var(--breach-color)' }}>$5,000 (5%)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Max Overall Loss</span>
                        <span style={{ color: 'var(--breach-color)' }}>$10,000 (10%)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Profit Consistency Ceiling</span>
                        <span style={{ color: 'var(--warning-color)' }}>35.0% Max/Day</span>
                      </div>
                    </div>
                  )}
                  {activeProfileTab === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className="mono">
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Dynamic Account Size</span>
                        <span style={{ color: '#fff' }}>User Configurable</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Adjustable Max Drawdowns</span>
                        <span style={{ color: 'var(--brand-color)' }}>0.5% - 20%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Min Trading Days</span>
                        <span style={{ color: '#fff' }}>Custom Target</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span>Consistency Threshold</span>
                        <span style={{ color: 'var(--warning-color)' }}>Adjustable Limit</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Copy */}
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '16px', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Prop Firm Profile Database
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '20px' }}>
                  No more manually checking complex evaluation terms. We keep updated profiles for leading prop programs. Audits are automatically tailored to check relative daily drawdown ceilings and consistency rule percentages (e.g., ensuring no single trading day yields more than 35% of total profits, a common breach condition on modern programs).
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--accent-teal)' }} className="mono">
                  <Globe size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>ALWAYS CALIBRATED & SYNCED</span>
                </div>
              </div>

            </div>

            {/* ROW 2: ML PREDICTIONS (Text Left, Image Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center' }} className="feature-row-2">
              <style dangerouslySetInnerHTML={{__html: `@media (min-width: 992px) { .feature-row-2 { grid-template-columns: 1.1fr 1fr !important; } }`}} />
              
              {/* Left Column: Copy */}
              <div className="order-mobile-2">
                <style dangerouslySetInnerHTML={{__html: `@media (max-width: 991px) { .order-mobile-2 { order: 2; } }`}} />
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '16px', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Explainable ML Scoring
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '20px' }}>
                  We don't just calculate basic math. A calibrated classifier evaluates your portfolio history across 16 behavioral properties (like average win streaks, trade durations, profit consistency, and recovery ratios) to compute a realistic pass likelihood score.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '24px' }}>
                  The engine highlights exact weights and features contributing to or pulling down your score, so you know exactly what adjustments to make.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--brand-color)' }} className="mono">
                  <ShieldCheck size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>EXPLAINABLE CLASSIFIER OUTPUT</span>
                </div>
              </div>

              {/* Right Column: AI Visual Preview */}
              <div className="panel order-mobile-1" style={{ padding: '24px', borderColor: 'var(--panel-border)' }}>
                <style dangerouslySetInnerHTML={{__html: `@media (max-width: 991px) { .order-mobile-1 { order: 1; } }`}} />
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--text-secondary)' }} className="mono">AI FEATURE WEIGHT LOGS</span>
                  <span style={{ fontSize: '11px', color: 'var(--warning-color)', fontWeight: 'bold' }} className="mono">AUDITED</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }} className="mono">
                      <span>Max Daily Drawdown Control</span>
                      <span style={{ color: 'var(--pass-color)' }}>+24% (Optimal)</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ width: '82%', height: '100%', backgroundColor: 'var(--pass-color)' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }} className="mono">
                      <span>Profit Consistency Ratio</span>
                      <span style={{ color: 'var(--warning-color)' }}>+4% (Marginal)</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ width: '48%', height: '100%', backgroundColor: 'var(--warning-color)' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }} className="mono">
                      <span>Trade Count & Minimum Days</span>
                      <span style={{ color: 'var(--pass-color)' }}>+18% (Compliant)</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ width: '74%', height: '100%', backgroundColor: 'var(--pass-color)' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }} className="mono">
                      <span>Holding Duration Variance</span>
                      <span style={{ color: 'var(--breach-color)' }}>-12% (High Risk)</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                      <div style={{ width: '30%', height: '100%', backgroundColor: 'var(--breach-color)' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* ROW 3: RISK SIMULATOR PREVIEW (Image Left, Text Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center' }} className="feature-row-3">
              <style dangerouslySetInnerHTML={{__html: `@media (min-width: 992px) { .feature-row-3 { grid-template-columns: 1fr 1.1fr !important; } }`}} />
              
              {/* Left Column: Visual Simulator card */}
              <div className="panel" style={{ padding: '24px', borderColor: 'var(--panel-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }} className="mono">MONTE CARLO PROJECTIONS</span>
                  <span style={{ fontSize: '11px', color: 'var(--accent-teal)', fontWeight: 'bold' }} className="mono">10,000 ITERATIONS</span>
                </div>
                
                {/* Visual rendering of simulated equity path paths */}
                <div style={{ height: '120px', position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center' }}>
                  <svg width="100%" height="100%" viewBox="0 0 200 100" preserveAspectRatio="none">
                    {/* Grid Lines */}
                    <line x1="0" y1="20" x2="200" y2="20" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    <line x1="0" y1="50" x2="200" y2="50" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    <line x1="0" y1="80" x2="200" y2="80" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
                    {/* Simulated Path lines */}
                    <path d="M 0 50 Q 30 40 60 60 T 120 20 T 180 15 T 200 10" fill="none" stroke="rgba(74, 219, 186, 0.4)" strokeWidth="1.5" />
                    <path d="M 0 50 Q 25 60 55 55 T 115 70 T 175 65 T 200 60" fill="none" stroke="rgba(232, 163, 61, 0.3)" strokeWidth="1.5" strokeDasharray="2 2" />
                    <path d="M 0 50 Q 40 70 80 85 T 120 90 T 200 95" fill="none" stroke="rgba(229, 89, 94, 0.2)" strokeWidth="1.5" />
                    {/* Breach line */}
                    <line x1="0" y1="85" x2="200" y2="85" stroke="rgba(229, 89, 94, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
                  </svg>
                  <div style={{ position: 'absolute', top: '4px', right: '6px', fontSize: '9px', color: 'rgba(255,255,255,0.4)' }} className="mono">
                    BREACH THRESHOLD
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px' }} className="mono">
                  <span style={{ color: 'var(--pass-color)' }}>Pass paths: 78.4%</span>
                  <span style={{ color: 'var(--breach-color)' }}>Breached paths: 21.6%</span>
                </div>
              </div>

              {/* Right Column: Copy */}
              <div>
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '16px', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Risk & Drawdown Projections
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '20px' }}>
                  What happens if you run into a five-trade losing streak? Our simulator models your strategy parameters over 10,000 synthetic evaluations using Monte Carlo simulations. 
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '20px' }}>
                  It plots the likelihood of hitting your profit target versus breaking daily or cumulative loss boundaries under variable market conditions, helping you calibrate your trade sizing before you fund.
                </p>
              </div>

            </div>

            {/* ROW 4: PDF REPORT EXPORT (Text Left, Image Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center' }} className="feature-row-4">
              <style dangerouslySetInnerHTML={{__html: `@media (min-width: 992px) { .feature-row-4 { grid-template-columns: 1.1fr 1fr !important; } }`}} />
              
              {/* Left Column: Copy */}
              <div className="order-mobile-2">
                <style dangerouslySetInnerHTML={{__html: `@media (max-width: 991px) { .order-mobile-2 { order: 2; } }`}} />
                <h3 style={{ fontSize: '24px', fontWeight: 700, color: '#fff', marginBottom: '16px', fontFamily: "'Space Grotesk', sans-serif" }}>
                  Professional PDF Audits
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '20px' }}>
                  Export clean, executive-level reports containing compliance details, equity curve charts, and AI pass diagnostic summaries.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', lineHeight: '1.6', marginBottom: '24px' }}>
                  Perfect for keeping logs of your trading performance, submitting records to trading teams, or reviewing trade logs to check for incremental growth.
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--accent-teal)' }} className="mono">
                  <FileText size={16} />
                  <span style={{ fontSize: '12px', fontWeight: 'bold' }}>ONE-CLICK VECTOR PDF GENERATION</span>
                </div>
              </div>

              {/* Right Column: Visual Report card */}
              <div className="panel order-mobile-1" style={{ padding: '24px', borderColor: 'var(--panel-border)', backgroundColor: '#1E262E' }}>
                <style dangerouslySetInnerHTML={{__html: `@media (max-width: 991px) { .order-mobile-1 { order: 1; } }`}} />
                
                {/* Simulated Document Preview */}
                <div style={{ border: '1px solid var(--panel-border)', borderRadius: '4px', backgroundColor: '#0E1317', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Doc Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '8px', height: '8px', backgroundColor: 'var(--brand-color)', borderRadius: '2px' }} />
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff' }} className="mono">COMPLIANCE REPORT</span>
                    </div>
                    <span style={{ fontSize: '8px', color: 'var(--text-secondary)' }} className="mono">ID: IP_9845</span>
                  </div>

                  {/* Doc Body Elements */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ height: '4px', width: '70%', backgroundColor: 'var(--panel-border)', borderRadius: '2px' }} />
                    <div style={{ height: '4px', width: '45%', backgroundColor: 'var(--panel-border)', borderRadius: '2px' }} />
                  </div>

                  {/* Verified checks list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '6px 0' }} className="mono">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px' }}>
                      <CheckCircle size={10} color="var(--pass-color)" />
                      <span>Max Loss Audit: <strong style={{ color: 'var(--pass-color)' }}>PASSED</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px' }}>
                      <CheckCircle size={10} color="var(--pass-color)" />
                      <span>Consistency Threshold: <strong style={{ color: 'var(--pass-color)' }}>PASSED</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px' }}>
                      <AlertCircle size={10} color="var(--warning-color)" />
                      <span>Relative Drawdown: <strong style={{ color: 'var(--warning-color)' }}>WARNING</strong></span>
                    </div>
                  </div>

                  {/* Stamp visual */}
                  <div style={{ alignSelf: 'flex-end', border: '1px solid rgba(74, 219, 186, 0.4)', borderRadius: '4px', padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--pass-color)' }} />
                    <span style={{ fontSize: '8px', fontWeight: 'bold', color: 'var(--pass-color)' }} className="mono">AUDIT VERIFIED</span>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </section>

        {/* 7. SOCIAL PROOF / CREDIBILITY SECTION ("Why this exists") */}
        <section id="why-exists" style={{
          padding: '100px 24px',
          backgroundColor: 'rgba(22, 28, 34, 0.4)',
          borderBottom: '1px solid var(--panel-border)'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              padding: '6px 12px',
              backgroundColor: 'rgba(229, 89, 94, 0.08)',
              border: '1px solid rgba(229, 89, 94, 0.2)',
              color: 'var(--breach-color)',
              fontSize: '11px',
              fontWeight: 'bold',
              borderRadius: '999px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '24px',
              fontFamily: "'Space Grotesk', sans-serif"
            }}>
              🚨 The Hard Truth of Prop Trading
            </div>

            <h2 style={{ 
              fontSize: 'clamp(28px, 4vw, 38px)', 
              fontWeight: 700, 
              fontFamily: "'Space Grotesk', sans-serif", 
              color: '#fff', 
              lineHeight: 1.15,
              marginBottom: '24px' 
            }}>
              Over 90% of challenge candidates fail.
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '16.5px', lineHeight: '1.7', marginBottom: '28px' }}>
              Statistically, the majority of traders fail evaluation challenges on top-tier prop firms. Most of these breaches are not due to an unprofitable strategy, but rather preventable rules breaches—specifically relative daily loss calculations, rule inconsistencies, or panic sizing during drawdowns.
            </p>

            <p style={{ color: 'var(--text-secondary)', fontSize: '16.5px', lineHeight: '1.7', marginBottom: '32px' }}>
              We built this analyzer to act as an objective diagnostic tool. By auditing your historical statement before paying for an evaluation, you confirm that your trade sizing, hold times, and P&L consistency are mathematically prepared to pass.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              maxWidth: '500px',
              margin: '0 auto',
              borderTop: '1px solid var(--panel-border)',
              paddingTop: '32px'
            }} className="mono">
              <div style={{ textAlign: 'left' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>CANDIDATE FAILURE RATE</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--breach-color)' }}>90% - 95%</span>
              </div>
              <div style={{ textAlign: 'left', borderLeft: '1px solid var(--panel-border)', paddingLeft: '20px' }}>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>PRIMARY FAILURE CAUSE</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#fff', display: 'block', marginTop: '6px' }}>RISK BOUNDARY BREACH</span>
              </div>
            </div>

          </div>
        </section>

        {/* 8. FINAL CTA SECTION (Bold Band) */}
        <section style={{
          padding: '120px 24px',
          position: 'relative',
          overflow: 'hidden',
          textAlign: 'center',
          borderBottom: '1px solid var(--panel-border)'
        }}>
          {/* Subtle moving grid background */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: 'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
            backgroundSize: '48px 48px', opacity: 0.15, pointerEvents: 'none', zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '640px', margin: '0 auto' }}>
            <h2 style={{ 
              fontSize: 'clamp(32px, 5vw, 44px)', 
              fontWeight: 800, 
              fontFamily: "'Space Grotesk', sans-serif", 
              color: '#fff', 
              lineHeight: 1.1,
              marginBottom: '20px' 
            }}>
              Know before you pay for a challenge.
            </h2>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '36px', lineHeight: '1.5' }}>
              Ingest your statement, audit your risk boundaries, and purchase your evaluations with full data-backed confidence.
            </p>

            <button 
              onClick={() => navigate('/dashboard/new')}
              className="btn btn-primary animate-lift"
              style={{ padding: '16px 36px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto', boxShadow: '0 4px 25px rgba(232, 163, 61, 0.25)' }}
            >
              <Play size={14} />
              Evaluate Statement Now
            </button>
          </div>
        </section>

        {/* FAQS SECTION */}
        <section id="faqs" style={{
          padding: '100px 24px',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, textAlign: 'center', color: '#fff', marginBottom: '40px', fontFamily: "'Space Grotesk', sans-serif" }}>
            Frequently Asked Questions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="panel" style={{ padding: '24px', borderColor: 'var(--panel-border)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                How does the statement parser work?
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                We support standard CSV exports directly from MT4, MT5, or cTrader. Our client-side parser scans columns, strips deposit lines, cleans headers, and aligns raw trade records into normalized database schema automatically.
              </p>
            </div>

            <div className="panel" style={{ padding: '24px', borderColor: 'var(--panel-border)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                Is my trading data uploaded to external servers?
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                The parsing and initial audits happen locally. Only anonymized trade performance vectors (e.g. profit consistency metric and drawdown bounds) are parsed by our AI predictor to calculate pass scores. We never store raw order IDs, names, or broker credentials.
              </p>
            </div>

            <div className="panel" style={{ padding: '24px', borderColor: 'var(--panel-border)' }}>
              <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                What is the "Consistency Rule"?
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                Many modern prop firms require that no single day's profit exceeds a set percentage (usually 30% to 40%) of the total profit target. Our compliance engine scans your trade history to compute consistency values and warn you if single-day profits spike above this boundary.
              </p>
            </div>

          </div>
        </section>

      </main>

      {/* 9. FOOTER */}
      <footer style={{
        backgroundColor: '#0A0D10',
        borderTop: '1px solid var(--panel-border)',
        padding: '60px 24px 30px 24px',
        fontSize: '13px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          <div style={{ display: 'flex', justifycontent: 'space-between', flexWrap: 'wrap', gap: '30px' }} className="footer-cols">
            <style dangerouslySetInnerHTML={{__html: `.footer-cols { justify-content: space-between !important; }`}} />
            
            <div style={{ maxWidth: '300px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(232, 163, 61, 0.1)',
                  border: '1px solid var(--brand-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={14} color="var(--brand-color)" />
                </div>
                <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '15px', color: '#fff' }}>
                  PROP FIRM READINESS
                </span>
              </div>
              <p style={{ lineHeight: '1.5', fontSize: '12.5px' }}>
                Objective compliance auditing and pass readiness predictions for prop trading evaluations.
              </p>
            </div>

            {/* Quick links columns */}
            <div style={{ display: 'flex', gap: '60px', flexWrap: 'wrap' }}>
              
              <div>
                <h4 style={{ color: '#fff', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px' }} className="mono">
                  Product
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><button onClick={() => navigate('/dashboard/new')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }} className="hover-white-nav">New Evaluation</button></li>
                  <li><button onClick={() => navigate('/dashboard/history')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }} className="hover-white-nav">Evaluation Archive</button></li>
                  <li><button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }} className="hover-white-nav">Dashboard</button></li>
                </ul>
              </div>

              <div>
                <h4 style={{ color: '#fff', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px' }} className="mono">
                  Company
                </h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li><button onClick={() => scrollToSection('how-it-works')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }} className="hover-white-nav">How it works</button></li>
                  <li><button onClick={() => scrollToSection('why-exists')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px' }} className="hover-white-nav">Core Vision</button></li>
                  <li><a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} className="hover-white-nav">GitHub Project</a></li>
                </ul>
              </div>

            </div>

          </div>

          {/* Disclaimer and copyright */}
          <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span style={{ maxWidth: '650px', lineHeight: '1.4' }}>
              Disclaimer: We are an independent diagnostic service. We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with FTMO, FundingPips, Topstep, or any other proprietary trading firm. All analysis values are estimates. Past performance does not guarantee passing actual evaluation challenges.
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>
              &copy; {new Date().getFullYear()} Prop Firm Readiness Analyzer.
            </span>
          </div>

        </div>
      </footer>

    </div>
  );
}
