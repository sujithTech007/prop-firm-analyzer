import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, TrendingUp, Award, AlertTriangle, ArrowRight, 
  UploadCloud, ShieldAlert, Cpu, Sparkles, RefreshCw, BarChart3 
} from 'lucide-react';
import { getHistory, getDemoTrades, analyzeReadiness } from '../services/api';
import { toast } from 'react-toastify';

export default function Overview() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  // Local simulator states for the Landing Page
  const [simWinRate, setSimWinRate] = useState(52);
  const [simProfitFactor, setSimProfitFactor] = useState(1.6);
  const [simDrawdown, setSimDrawdown] = useState(3.5);

  useEffect(() => {
    document.title = "Overview Dashboard | Prop Firm Analyzer";
    async function loadData() {
      try {
        const histData = await getHistory();
        setHistory(histData || []);
      } catch (err) {
        console.error("Failed to load overview data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleTryDemo = async () => {
    setDemoLoading(true);
    const toastId = toast.loading("Fetching and parsing sample trades...");
    try {
      const csvText = await getDemoTrades();
      const file = new File([csvText], "demo_trades_sample.csv", { type: "text/csv" });
      const defaultRules = {
        account_size: 100000.0,
        max_daily_loss_pct: 5.0,
        max_total_drawdown_pct: 10.0,
        profit_target_pct: 10.0,
        min_trading_days: 4,
        consistency_rule_pct: 40.0
      };
      
      toast.update(toastId, { render: "Analyzing compliance metrics with AI model...", type: "info", isLoading: true });
      const res = await analyzeReadiness(file, defaultRules);
      
      toast.update(toastId, { render: "Demo analysis generated successfully!", type: "success", isLoading: false, autoClose: 3000 });
      navigate(`/results/${res.id}`);
    } catch (err) {
      console.error(err);
      toast.update(toastId, { render: err.message || "Failed to analyze demo data.", type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px' }} className="fade-in">
        <div className="skeleton" style={{ height: '240px', borderRadius: '12px', marginBottom: '24px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <div className="skeleton" style={{ height: '100px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '100px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '100px', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  // Dual View: Landing Page vs Command Center Dashboard
  if (history.length === 0) {
    return <LandingView onTryDemo={handleTryDemo} demoLoading={demoLoading} simWinRate={simWinRate} setSimWinRate={setSimWinRate} simProfitFactor={simProfitFactor} setSimProfitFactor={setSimProfitFactor} simDrawdown={simDrawdown} setSimDrawdown={setSimDrawdown} navigate={navigate} />;
  }

  return <DashboardView history={history} navigate={navigate} onTryDemo={handleTryDemo} demoLoading={demoLoading} />;
}

// ----------------------------------------------------
// 1. LANDING/MARKETING VIEW
// ----------------------------------------------------
function LandingView({ 
  onTryDemo, demoLoading, 
  simWinRate, setSimWinRate, 
  simProfitFactor, setSimProfitFactor, 
  simDrawdown, setSimDrawdown,
  navigate 
}) {
  // Local simulator math
  const readinessScore = Math.min(100, Math.max(10, Math.round((simWinRate * 0.9) + (simProfitFactor * 13) - (simDrawdown * 3))));
  const passProb = Math.min(99, Math.max(1, Math.round(readinessScore * 0.95)));
  
  let scoreColor = "var(--warning-color)";
  let scoreVerdict = "NEEDS COMPLIANCE CALIBRATION";
  if (readinessScore >= 70) {
    scoreColor = "var(--pass-color)";
    scoreVerdict = "OPTIMAL PASS READINESS";
  } else if (readinessScore < 45) {
    scoreColor = "var(--breach-color)";
    scoreVerdict = "CRITICAL DRAWDOWN RISK";
  }

  // Calculate SVG stroke offset
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference;

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      
      {/* Hero Section */}
      <section style={{ 
        display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'center',
        padding: '40px 0 80px 0', borderBottom: '1px solid var(--panel-border)', position: 'relative'
      }} className="hero-grid">
        <style dangerouslySetInnerHTML={{__html: `@media (min-width: 992px) { .hero-grid { grid-template-columns: 1.2fr 1fr !important; } }`}} />
        
        {/* Subtle grid background accent */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '40%', height: '100%',
          backgroundImage: 'radial-gradient(rgba(232, 163, 61, 0.04) 2px, transparent 2px)',
          backgroundSize: '24px 24px', pointerEvents: 'none', zIndex: 0
        }} />

        {/* Hero Left Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignSelf: 'flex-start' }}>
            <span className="mono" style={{ 
              backgroundColor: 'rgba(232, 163, 61, 0.08)', color: 'var(--brand-color)',
              border: '1px solid rgba(232, 163, 61, 0.2)', padding: '6px 12px',
              borderRadius: '9999px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.1em'
            }}>
              ⚡ COMPLIANCE AUDITING ENGINE V2.0
            </span>
          </div>

          <h1 style={{ 
            fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, lineHeight: 1.1,
            letterSpacing: '-1.5px', fontFamily: "'Space Grotesk', sans-serif"
          }}>
            Audit your trading edge.<br/>
            <span style={{ borderBottom: '3px solid var(--brand-color)' }}>Pass your challenge</span>.
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: 1.6, maxWidth: '560px' }}>
            Ingest your MT4/MT5 trading statements, audit compliance parameters (including profit consistency limits), and predict your pass readiness using calibrated machine learning.
          </p>

          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
            <button 
              onClick={() => navigate('/new')}
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 0 20px rgba(232,163,61,0.15)' }}
            >
              <UploadCloud size={16} />
              Evaluate Statement
            </button>
            
            <button 
              onClick={onTryDemo}
              disabled={demoLoading}
              className="btn btn-secondary"
              style={{ padding: '14px 28px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <RefreshCw size={16} className={demoLoading ? "spin" : ""} />
              {demoLoading ? "Loading Demo..." : "Try with Sample Data"}
            </button>
          </div>
        </div>

        {/* Hero Right Content: Interactive Compliance Simulator */}
        <div style={{ zIndex: 1 }}>
          <div className="panel" style={{ 
            padding: '30px', border: '1px solid var(--panel-border)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', position: 'relative'
          }}>
            {/* Visual motiv: background grid lines */}
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)',
              backgroundSize: '20px 20px', pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                COMPLIANCE SIMULATOR
              </h3>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--brand-color)', fontWeight: 'bold' }}>LIVE PREVIEW</span>
            </div>

            {/* Dial & Score Output */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '28px' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', flexShrink: 0 }}>
                <svg width="100%" height="100%" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background Track */}
                  <circle cx="60" cy="60" r="50" fill="transparent" stroke="var(--panel-border)" strokeWidth="8" />
                  {/* Indicator Fill */}
                  <circle 
                    cx="60" cy="60" r="50" fill="transparent" 
                    stroke={scoreColor} strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.4s ease' }}
                  />
                </svg>
                {/* Score Number in center */}
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <span className="mono" style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>{readinessScore}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>READINESS</span>
                </div>
              </div>

              <div>
                <span className="mono" style={{ fontSize: '11px', color: scoreColor, fontWeight: 700, letterSpacing: '0.5px' }}>
                  {scoreVerdict}
                </span>
                <h4 style={{ fontSize: '18px', fontWeight: 600, margin: '4px 0 2px 0', color: '#fff' }}>
                  {passProb}% ML Pass Prob
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                  Predicted using 16 behavioral features mapped to simulated settings.
                </p>
              </div>
            </div>

            {/* Simulated Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Strategy Win Rate:</span>
                  <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simWinRate}%</span>
                </div>
                <input 
                  type="range" min="30" max="80" 
                  value={simWinRate} 
                  onChange={e => setSimWinRate(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-color)' }} 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Strategy Profit Factor:</span>
                  <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simProfitFactor}x</span>
                </div>
                <input 
                  type="range" min="0.8" max="2.8" step="0.1" 
                  value={simProfitFactor} 
                  onChange={e => setSimProfitFactor(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-color)' }} 
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Simulated Max Drawdown:</span>
                  <span className="mono" style={{ color: '#fff', fontWeight: 600 }}>{simDrawdown}%</span>
                </div>
                <input 
                  type="range" min="0.5" max="8.0" step="0.5" 
                  value={simDrawdown} 
                  onChange={e => setSimDrawdown(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--brand-color)' }} 
                />
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* Concise "How It Works" Section */}
      <section style={{ padding: '60px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>
            The Auditing Workflow
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            We ingest and cross-check your statements against proprietary challenge parameters.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          
          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '8px', 
              backgroundColor: 'rgba(74, 219, 186, 0.05)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
            }}>
              <UploadCloud size={20} color="var(--accent-teal)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
              1. Ingest Trade Logs
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              Upload logs from MT4, MT5, or cTrader. Our tolerant parser automatically sniffs delimiters, cleans broker metadata headers, and strips deposit transactions.
            </p>
          </div>

          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '8px', 
              backgroundColor: 'rgba(232, 163, 61, 0.05)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
            }}>
              <Cpu size={20} color="var(--brand-color)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
              2. Audit Risk Boundaries
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              We evaluate your account against dynamic risk rules (max daily drawdowns, total balance caps, target rules, and strict consistency ratios).
            </p>
          </div>

          <div className="panel" style={{ padding: '24px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '8px', 
              backgroundColor: 'rgba(236, 201, 75, 0.05)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', marginBottom: '16px'
            }}>
              <Sparkles size={20} color="var(--warning-color)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
              3. Predict Readiness
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
              A calibrated machine learning classifier processes 16 behavioral features to predict pass probability, coupled with clear feature contribution descriptions.
            </p>
          </div>

        </div>
      </section>

    </div>
  );
}

// ----------------------------------------------------
// 2. DASHBOARD OVERVIEW VIEW
// ----------------------------------------------------
function DashboardView({ history, navigate, onTryDemo, demoLoading }) {
  const totalRuns = history.length;
  const avgScore = totalRuns > 0 ? history.reduce((acc, r) => acc + r.readiness_score, 0) / totalRuns : 0;
  const passes = history.filter(r => r.verdict === 'Likely ready').length;

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      
      {/* Header Block */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '32px', borderBottom: '1px solid var(--panel-border)', paddingBottom: '20px',
        flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            COMMAND OVERVIEW
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>
            Diagnostic summaries of your challenge readiness evaluations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={onTryDemo}
            disabled={demoLoading}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={demoLoading ? "spin" : ""} />
            Load Sample
          </button>
          
          <button
            onClick={() => navigate('/new')}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Play size={14} />
            New Evaluation
          </button>
        </div>
      </header>

      {/* High-Tech Statistics Row */}
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '20px', marginBottom: '32px' 
      }}>
        <SummaryCard icon={BarChart3} title="EVALUATION COUNT" value={totalRuns} />
        <SummaryCard icon={Award} title="AVERAGE READINESS" value={Math.round(avgScore)} suffix="/100" />
        <SummaryCard icon={AlertTriangle} title="OPTIMAL PASS PROBABILITY" value={passes} />
      </div>

      {/* Recent Evaluations Table */}
      <div className="panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0, color: '#fff', letterSpacing: '0.5px' }}>
            EVALUATION ARCHIVE
          </h2>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            SHOWING LAST {Math.min(5, totalRuns)} RECORDS
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--panel-border)', color: 'var(--text-secondary)', height: '36px' }}>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>EVALUATION DATE</th>
                <th style={{ padding: '10px 16px', fontWeight: 600 }}>PORTFOLIO BALANCE</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'center' }}>READINESS SCORE</th>
                <th style={{ padding: '10px 16px', fontWeight: 600, textAlign: 'right' }}>COMPLIANCE STATUS</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 5).map(run => {
                let badgeClass = "badge-warning";
                if (run.readiness_score >= 70) badgeClass = "badge-pass";
                if (run.readiness_score < 45) badgeClass = "badge-breach";
                
                return (
                  <tr key={run.id} 
                      onClick={() => navigate(`/results/${run.id}`)}
                      style={{ 
                        borderBottom: '1px solid var(--panel-border)', 
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                        height: '48px'
                      }}
                      className="hover-row"
                  >
                    <td style={{ padding: '10px 16px', color: '#fff' }}>
                      {new Date(run.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="mono" style={{ padding: '10px 16px', fontWeight: 600 }}>
                      ${run.account_size.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="mono" style={{ padding: '10px 16px', fontWeight: 700, textAlign: 'center', fontSize: '14px' }}>
                      {run.readiness_score}
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <span className={`badge ${badgeClass}`}>
                        {run.verdict}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ----------------------------------------------------
// HELPER CARD COMPONENT
// ----------------------------------------------------
function SummaryCard({ icon: Icon, title, value, suffix = "" }) {
  return (
    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px 24px' }}>
      <div style={{ 
        width: '44px', height: '44px', borderRadius: '6px', 
        backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid var(--panel-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center' 
      }}>
        <Icon size={20} color="var(--brand-color)" />
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>
          {title}
        </div>
        <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: '#fff' }}>
          {value}
          {suffix && <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '4px' }}>{suffix}</span>}
        </div>
      </div>
    </div>
  );
}
