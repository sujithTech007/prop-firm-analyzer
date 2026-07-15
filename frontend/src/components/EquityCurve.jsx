import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function EquityCurve({ trades }) {
  // Format data for Recharts, indexing trades 1 to N
  // Prepend a starting trade of 0 PnL
  const chartData = [
    { trade_index: 0, pnl: 0, label: 'Start', symbol: '', profit: 0 }
  ];

  trades.forEach((t, i) => {
    chartData.push({
      trade_index: i + 1,
      pnl: t.cumulative_pnl,
      label: `Trade #${i + 1}`,
      symbol: t.symbol,
      profit: t.profit,
      direction: t.direction.toUpperCase(),
      lot: t.lot_size
    });
  });

  const endingPnl = trades.length > 0 ? trades[trades.length - 1].cumulative_pnl : 0;
  const strokeColor = endingPnl >= 0 ? 'var(--pass-color)' : 'var(--breach-color)';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#1E262E',
          border: '1px solid var(--panel-border)',
          padding: '10px 14px',
          borderRadius: '6px',
          fontSize: '12px',
          boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
        }}>
          <p className="mono" style={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {data.label}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p>Cumulative P&L: <strong className="mono" style={{ color: data.pnl >= 0 ? 'var(--pass-color)' : 'var(--breach-color)' }}>${data.pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
            {data.trade_index > 0 && (
              <>
                <p>Trade Profit: <strong className="mono" style={{ color: data.profit >= 0 ? 'var(--pass-color)' : 'var(--breach-color)' }}>${data.profit >= 0 ? '+' : ''}{data.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></p>
                <p>Asset: <span className="mono">{data.symbol} ({data.direction} {data.lot} lots)</span></p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', minHeight: '360px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Cumulative Equity Curve
        </h3>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Ending P&L: <strong className="mono" style={{ color: strokeColor }}>${endingPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
        </div>
      </div>

      <div style={{ width: '100%', height: '300px', flex: 1 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid stroke="rgba(42, 52, 60, 0.15)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="trade_index"
              stroke="var(--text-secondary)"
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}
              tickLine={{ stroke: 'var(--panel-border)' }}
            />
            <YAxis
              stroke="var(--text-secondary)"
              tick={{ fontFamily: 'JetBrains Mono', fontSize: 10 }}
              tickLine={{ stroke: 'var(--panel-border)' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(232, 163, 61, 0.2)', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="pnl"
              stroke={strokeColor}
              strokeWidth={2.5}
              dot={{ stroke: strokeColor, strokeWidth: 1.5, r: 2.5, fill: '#0E1317' }}
              activeDot={{ r: 5, fill: strokeColor, strokeWidth: 0 }}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
