import React, { useEffect, useState } from 'react';
import { getInsights } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInsights() {
      try {
        const res = await getInsights();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, []);

  if (loading) {
    return <div className="fade-in" style={{ padding: '40px' }}><div className="skeleton" style={{ height: '300px', borderRadius: '12px' }} /></div>;
  }

  if (!data || data.score_trend.length === 0) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Not enough data for insights. Run some analyses first.</p>
      </div>
    );
  }

  // Format dates for trend charts
  const formattedScoreTrend = data.score_trend.map(d => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>Performance Insights</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Aggregate analytics across all your evaluation runs.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        
        {/* Score Trend */}
        <div className="panel">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Readiness Score Trend</h2>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedScoreTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" vertical={false} />
                <XAxis dataKey="displayDate" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--accent-teal)' }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--accent-teal)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-teal)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Common Breaches */}
        <div className="panel">
          <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Most Common Rule Breaches</h2>
          {data.common_breaches.length > 0 ? (
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.common_breaches} layout="vertical" margin={{ top: 0, right: 0, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--panel-border)" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--panel-border)', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="var(--breach-color)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
             <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
               No rule breaches recorded yet. Great job!
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
