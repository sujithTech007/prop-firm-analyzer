import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, TrendingUp, Award, AlertTriangle, RefreshCw, BarChart3 
} from 'lucide-react';
import { getHistory, getDemoTrades, analyzeReadiness } from '../services/api';
import { toast } from 'react-toastify';

export default function Overview() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

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
      navigate(`/dashboard/results/${res.id}`);
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

  return (
    <DashboardView 
      history={history} 
      navigate={navigate} 
      onTryDemo={handleTryDemo} 
      demoLoading={demoLoading} 
    />
  );
}

// ----------------------------------------------------
// DASHBOARD OVERVIEW VIEW
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
            onClick={() => navigate('/dashboard/new')}
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
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
              <TrendingUp size={44} style={{ color: 'var(--brand-color)', opacity: 0.8, marginBottom: '16px' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>No Evaluations Found</h3>
              <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 24px auto', lineHeight: '1.6' }}>
                Start auditing your MT4/MT5 statements against customized evaluation rules to diagnose compliance risks and check readiness scores.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => navigate('/dashboard/new')}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px', fontSize: '12.5px' }}
                >
                  Start First Audit
                </button>
                <button
                  onClick={onTryDemo}
                  disabled={demoLoading}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', fontSize: '12.5px' }}
                >
                  Load Sample Report
                </button>
              </div>
            </div>
          ) : (
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
                        onClick={() => navigate(`/dashboard/results/${run.id}`)}
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
          )}
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
