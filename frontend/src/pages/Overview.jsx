import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { getHistory, getInsights } from '../services/api';

export default function Overview() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  const totalRuns = history.length;
  const avgScore = totalRuns > 0 ? history.reduce((acc, r) => acc + r.readiness_score, 0) / totalRuns : 0;
  const passes = history.filter(r => r.verdict === 'Likely ready').length;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Monitor your readiness to pass a prop firm challenge.</p>
        </div>
        <button
          onClick={() => navigate('/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: 'var(--accent-teal)', color: '#000',
            border: 'none', padding: '12px 20px', borderRadius: '8px',
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(74, 219, 186, 0.2)'
          }}
        >
          <Play size={18} />
          New Analysis
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <SummaryCard icon={TrendingUp} title="Total Analyses" value={loading ? '-' : totalRuns} />
        <SummaryCard icon={Award} title="Average Score" value={loading ? '-' : Math.round(avgScore)} suffix="/100" />
        <SummaryCard icon={AlertTriangle} title="Pass Ready" value={loading ? '-' : passes} />
      </div>

      <div className="panel">
        <h2 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 16px 0' }}>Recent Analyses</h2>
        {loading ? (
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '4px' }} />)}
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <p>No analyses yet. Click "New Analysis" to get started.</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Date</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Account Size</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Score</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 5).map(run => (
                <tr key={run.id} 
                    onClick={() => navigate(`/results/${run.id}`)}
                    style={{ 
                      borderBottom: '1px solid var(--panel-border)', 
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    className="hover-row"
                >
                  <td style={{ padding: '12px 16px' }}>{new Date(run.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: '12px 16px' }}>${run.account_size.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{run.readiness_score}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600,
                      backgroundColor: run.readiness_score >= 70 ? 'rgba(74, 219, 186, 0.1)' : 
                                      (run.readiness_score >= 40 ? 'rgba(255, 179, 71, 0.1)' : 'rgba(229, 89, 94, 0.1)'),
                      color: run.readiness_score >= 70 ? 'var(--accent-teal)' : 
                             (run.readiness_score >= 40 ? 'var(--warning-yellow)' : 'var(--breach-color)')
                    }}>
                      {run.verdict}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, value, suffix = "" }) {
  return (
    <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color="var(--accent-teal)" />
      </div>
      <div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: 700 }}>
          {value}{suffix && <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{suffix}</span>}
        </div>
      </div>
    </div>
  );
}
