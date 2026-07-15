import React, { useState } from 'react';
import { BookOpen, HelpCircle, AlertTriangle, ShieldCheck, TrendingUp, Info } from 'lucide-react';

export default function Academy() {
  const [activeTab, setActiveTab] = useState('glossary');

  const glossaryItems = [
    {
      term: "Max Daily Loss Limit",
      definition: "The maximum amount of money your account is allowed to lose in a single day. This is usually calculated based on the starting balance of the day and resets at midnight (broker server time). E.g. 5% daily limit on a $100k account means if your equity drops below $95k, the account is disqualified.",
      importance: "Critical risk control. Most traders fail challenges because they don't count active floating losses (unrealized P&L) towards their daily loss limit."
    },
    {
      term: "Max total Drawdown",
      definition: "The maximum capital decline allowed from the initial starting balance of the account (or a trailing peak). E.g. 10% total drawdown limit on a $100k account means your equity/balance must never go below $90k under any circumstance.",
      importance: "This is the absolute hard ceiling of risk. Once hit, it triggers immediate challenge disqualification."
    },
    {
      term: "Profit Target",
      definition: "The target profit you must achieve to successfully pass the challenge phase. For standard challenges, this is typically 8% to 10% in Phase 1, and 5% in Phase 2.",
      importance: "Reaching the target requires systematic execution. Trying to hit it in one trade usually leads to rule breach."
    },
    {
      term: "Consistency Rule",
      definition: "A policy enforced by many modern prop firms (like Topstep, MyFundedFX) stating that no single trading day can generate more than 30% to 40% of the total profit target. E.g. if target is $3,000, and a trader makes $1,500 on one lucky day, they fail consistency even if they pass the target.",
      importance: "Firms enforce this to filter out lucky gamblers and discover traders with stable, repeatable edges."
    },
    {
      term: "Expectancy",
      definition: "The average amount you expect to win or lose per trade, calculated as: (Win Rate % * Avg Win Size) - (Loss Rate % * Avg Loss Size). A positive expectancy means your strategy is profitable over the long term.",
      importance: "If your expectancy is negative, passing is statistically impossible without luck."
    },
    {
      term: "Profit Factor",
      definition: "The ratio of gross profits to gross losses. Calculated as: Total Profit Amount / Total Loss Amount. E.g., a profit factor of 1.5 means you made $1.50 for every $1.00 you lost.",
      importance: "A profit factor > 1.2 is healthy. A profit factor below 1.0 means you are losing money."
    },
    {
      term: "Scaling Plan",
      definition: "A program where the prop firm increases your account size and allows you to trade larger contract sizes as your account balance grows and you hit profit milestones.",
      importance: "Enables compounding your earnings without having to risk more personal capital."
    }
  ];

  const failureReasons = [
    {
      title: "1. Flouting the Daily Drawdown Rule",
      desc: "Traders often calculate their daily drawdown based on closed balance, ignoring floating equity. If a trade is in a deep drawdowns, the broker server updates unrealized equity in real time. If it dips below the daily limit for even a microsecond, the account is auto-flagged as failed.",
      solution: "Always use stop losses, and size your positions so that even if all active trades hit their stops, the total loss is under 1.5% of your account size. Never hold trades without stop-losses."
    },
    {
      title: "2. The Consistency Rule Pitfall",
      desc: "Many traders find a high-impact news event (like CPI or NFP) and use excessive leverage to gamble. If they make $4,000 on one trade and pass the challenge, they are shocked when the firm disqualifies them for breaching the 40% consistency rule.",
      solution: "Trade with a consistent position size and strategy. The goal is to reach your target through a series of structured, high-probability setups, not a single home run."
    },
    {
      title: "3. Emotional Revenge Trading",
      desc: "After taking a loss, the human brain enters a state of panic or tilt. The trader opens another position immediately with double the lot size to make the money back. If this trade fails, they repeat it, triggering daily limit breaches within minutes.",
      solution: "Have a hard rule: if you take 2 losses in a single day, shut down your platform. Walk away from the charts to allow your emotional state to cool down."
    },
    {
      title: "4. Overtrading in Low Volatility",
      desc: "When the market is quiet, traders get bored and start taking B-grade or C-grade setups. Because the market has no momentum, these trades get chopped up, resulting in multiple papercut losses that add up to a major drawdown.",
      solution: "Only trade during high-volatility sessions (London and New York overlaps). If your A+ setup is not present, do not place a trade. Patience is a high-income skill."
    },
    {
      title: "5. Poor Position Sizing (No Calculator)",
      desc: "Many traders guess their lot sizes (e.g. 'I will use 5 lots on EURUSD'). However, a 20-pip stop on 5 lots is a $1,000 risk. If the account size is $10k, that is 10% risk, which is far too high.",
      solution: "Always calculate your lot size using a position calculator before opening a trade. Keep risk per trade under 0.5% - 1.0% of your account size."
    }
  ];

  return (
    <div className="fade-in" style={{ paddingBottom: '40px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, margin: '0 0 8px 0' }}>Prop Firm Trading Academy</h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Learn the mechanics of challenge compliance and master risk management features.
        </p>
      </header>

      {/* Navigation tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--panel-border)', marginBottom: '32px', gap: '24px' }}>
        <button
          onClick={() => setActiveTab('glossary')}
          style={{
            background: 'transparent', border: 'none', color: activeTab === 'glossary' ? 'var(--accent-teal)' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '15px', cursor: 'pointer', paddingBottom: '12px',
            borderBottom: activeTab === 'glossary' ? '2px solid var(--accent-teal)' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <BookOpen size={16} />
          Terminology Glossary
        </button>
        <button
          onClick={() => setActiveTab('fails')}
          style={{
            background: 'transparent', border: 'none', color: activeTab === 'fails' ? 'var(--accent-teal)' : 'var(--text-secondary)',
            fontWeight: 600, fontSize: '15px', cursor: 'pointer', paddingBottom: '12px',
            borderBottom: activeTab === 'fails' ? '2px solid var(--accent-teal)' : 'none',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <AlertTriangle size={16} />
          Why Challenges Fail
        </button>
      </div>

      {activeTab === 'glossary' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {glossaryItems.map((item, idx) => (
            <div key={idx} className="panel" style={{ padding: '24px', display: 'flex', gap: '20px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'rgba(74, 219, 186, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <HelpCircle size={20} color="var(--accent-teal)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: '#fff' }}>{item.term}</h3>
                <p style={{ color: 'var(--text-primary)', fontSize: '13.5px', margin: 0, lineHeight: '1.5' }}>
                  {item.definition}
                </p>
                <div style={{ 
                  marginTop: '8px', padding: '10px 14px', borderRadius: '6px',
                  backgroundColor: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--text-muted)',
                  fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start'
                }}>
                  <Info size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span><strong>Evaluation context:</strong> {item.importance}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="panel panel-alt" style={{ padding: '24px', backgroundColor: 'rgba(229, 89, 94, 0.03)', border: '1px solid rgba(229, 89, 94, 0.15)' }}>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--breach-color)', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} /> Did You Know?
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
              Over <strong>92%</strong> of traders fail prop firm challenge accounts. The vast majority do not fail due to a lack of a trading edge, but because of poor risk management, rule breaches, or psychological tilt.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {failureReasons.map((reason, idx) => (
              <div key={idx} className="panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 10px 0', color: '#fff' }}>{reason.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '0 0 16px 0', lineHeight: '1.6' }}>
                  {reason.desc}
                </p>
                <div style={{ 
                  padding: '12px 16px', borderRadius: '6px',
                  backgroundColor: 'rgba(63, 193, 160, 0.04)', border: '1px solid rgba(63, 193, 160, 0.15)',
                  fontSize: '13px', color: 'var(--text-primary)', display: 'flex', gap: '10px', alignItems: 'flex-start'
                }}>
                  <ShieldCheck size={16} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--pass-color)' }} />
                  <span><strong>AI Strategy to Pass:</strong> {reason.solution}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding: '24px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>Ready to check your trade history?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: '0 0 16px 0' }}>
              Upload your trades now to evaluate your compliance scores and pass probability.
            </p>
            <a href="/new" style={{ 
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              backgroundColor: 'var(--accent-teal)', color: '#000', padding: '10px 20px',
              borderRadius: '6px', fontWeight: 600, textDecoration: 'none', fontSize: '14px'
            }}>
              <TrendingUp size={16} /> Evaluate New Statement
            </a>
          </div>

        </div>
      )}
    </div>
  );
}
