import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHistory } from '../services/api';
import { History as HistoryIcon } from 'lucide-react';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHistory() {
      try {
        const data = await getHistory();
        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>Analysis History</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Review your past prop firm challenge evaluations.</p>
      </div>

      <div className="panel">
        {loading ? (
          <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: '48px', width: '100%', borderRadius: '4px' }} />)}
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <HistoryIcon size={48} style={{ opacity: 0.5, marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 500, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>No History Found</h3>
            <p style={{ margin: '0 0 24px 0' }}>You haven't run any analyses on this device yet.</p>
            <button 
              onClick={() => navigate('/new')}
              style={{
                backgroundColor: 'var(--brand-color)', color: '#000', border: 'none',
                padding: '10px 20px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Start New Analysis
            </button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--panel-border)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Date & Time</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Account Size</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Score</th>
                <th style={{ padding: '12px 16px', fontWeight: 500 }}>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {history.map(run => (
                <tr key={run.id} 
                    onClick={() => navigate(`/results/${run.id}`)}
                    style={{ borderBottom: '1px solid var(--panel-border)', cursor: 'pointer', transition: 'background-color 0.2s' }}
                    className="hover-row"
                >
                  <td style={{ padding: '16px' }}>{new Date(run.created_at).toLocaleString()}</td>
                  <td style={{ padding: '16px' }}>${run.account_size.toLocaleString()}</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{run.readiness_score}</td>
                  <td style={{ padding: '16px' }}>
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
