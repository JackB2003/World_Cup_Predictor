/* ===========================================================
   SCREEN: Top Scorer Watch
   =========================================================== */

function ScorerRow({ s, rank, max }) {
  const t = window.WC.teamMap[s.team];
  const c = t.color === "#FFFFFF" ? "#cfd6e2" : t.color;
  return (
    <div className="lift" style={{ display: "grid", gridTemplateColumns: "30px 40px 1fr 120px 70px 44px", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: "1px solid var(--line)" }}>
      <span className="num" style={{ fontSize: 22, color: rank === 1 ? "var(--accent)" : "var(--text-dim)" }}>{rank}</span>
      <Crest code={s.team} size={32} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 7 }}>
          {s.player}
          {s.pens && <span className="badge badge-dim" title="Penalty taker" style={{ fontSize: 10, padding: "1px 7px" }}>PK</span>}
        </div>
        <div className="muted" style={{ fontSize: 11.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.note}</div>
      </div>
      <div>
        <ProbBar value={(s.prob / max) * 100} color={c} height={8} delay={rank * 40} />
        <div className="muted tabular" style={{ fontSize: 11, marginTop: 5 }}>Golden Boot {s.prob}%</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="num" style={{ fontSize: 22, color: "var(--accent)" }}>{s.proj}</div>
        <div className="section-tag">Proj. goals</div>
      </div>
      <Delta trend={s.trend} />
    </div>
  );
}

function TopScorer() {
  const sc = [...window.WC.scorers];
  const max = Math.max(...sc.map(s => s.prob));
  const leader = sc[0];
  const t = window.WC.teamMap[leader.team];

  return (
    <div className="fade-in grid" style={{ gridTemplateColumns: "1fr", gap: 18 }}>
      {/* Hero leader */}
      <div className="grid" style={{ gridTemplateColumns: "360px 1fr", gap: 18, alignItems: "stretch" }}>
        <div className="card pad" style={{ background: "linear-gradient(150deg, var(--surface-2), var(--surface))", overflow: "hidden", position: "relative" }}>
          <div className="section-tag">AI projected Golden Boot</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 18 }}>
            <div style={{ position: "relative" }}>
              <Crest code={leader.team} size={68} radius={18} />
              <div style={{ position: "absolute", bottom: -6, right: -6, width: 28, height: 28, borderRadius: 9, background: "var(--accent)", color: "#07090F", display: "grid", placeItems: "center", boxShadow: "0 6px 16px -4px rgba(var(--accent-rgb),.6)" }}>
                {ICONS.boot({ size: 15 })}
              </div>
            </div>
            <div>
              <div className="display" style={{ fontSize: 26, lineHeight: 1.05 }}>{leader.player}</div>
              <div className="mid" style={{ fontSize: 13.5, marginTop: 3 }}>{t.name} · {leader.pos}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 26, marginTop: 24 }}>
            <div><div className="num" style={{ fontSize: 44, color: "var(--accent)", lineHeight: 0.9 }}>{leader.proj}</div><div className="section-tag" style={{ marginTop: 4 }}>Projected goals</div></div>
            <div><div className="num" style={{ fontSize: 44, lineHeight: 0.9 }}>{leader.prob}<span style={{fontSize:20}}>%</span></div><div className="section-tag" style={{ marginTop: 4 }}>Win probability</div></div>
          </div>
        </div>

        {/* formula breakdown */}
        <div className="card pad">
          <CardHead icon="spark" tag="Top-scorer formula" title="Why Mbappé leads the model" />
          <div className="grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { k: "Proj. matches", v: "7", note: "Deep France run" },
              { k: "Expected mins", v: leader.minutes + "'", note: "Per match" },
              { k: "Goals / 90", v: leader.g90, note: "Elite rate" },
              { k: "Penalty taker", v: "Yes", note: "+ bonus", good: true },
              { k: "Group difficulty", v: "0.94", note: "Favourable" },
              { k: "Injury risk", v: "Low", note: "Fully fit", good: true },
            ].map(b => (
              <div key={b.k} style={{ background: "var(--surface-2)", borderRadius: 12, padding: "13px 14px" }}>
                <div className="section-tag">{b.k}</div>
                <div className="num" style={{ fontSize: 26, marginTop: 4, color: b.good ? "var(--good)" : "var(--text)" }}>{b.v}</div>
                <div className="muted" style={{ fontSize: 11 }}>{b.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* full race */}
      <div className="card pad">
        <CardHead icon="boot" tag="The race" title="Golden Boot Leaderboard" more="All players" />
        <div className="grid stagger" style={{ gap: 10 }}>
          {sc.map((s, i) => <ScorerRow key={s.player} s={s} rank={i + 1} max={max} />)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TopScorer });
