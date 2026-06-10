/* ===========================================================
   SCREEN: Tournament Outlook
   Championship odds · projected Top 4 · power rankings · model
   =========================================================== */

function TitleRaceRow({ t, max, rank }) {
  const c = t.color === "#FFFFFF" ? "#cfd6e2" : t.color;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span className="num muted" style={{ width: 22, fontSize: 18, textAlign: "right" }}>{rank}</span>
      <Crest code={t.code} size={30} />
      <span style={{ width: 92, fontWeight: 600, fontSize: 13.5 }}>{t.name}</span>
      <div style={{ flex: 1 }}>
        <ProbBar value={(t.titleProb / max) * 100} color={c} height={10} delay={rank * 40} />
      </div>
      <span className="num" style={{ width: 58, textAlign: "right", fontSize: 20, color: "var(--text)" }}>
        {t.titleProb}<span className="muted" style={{ fontSize: 12 }}>%</span>
      </span>
      <Delta trend={t.trend} />
    </div>
  );
}

function PowerRow({ t, rank }) {
  return (
    <div className="lift" style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", borderRadius: 12, border: "1px solid var(--line)" }}>
      <span className="num" style={{ width: 26, fontSize: 22, color: rank <= 3 ? "var(--accent)" : "var(--text-dim)" }}>{rank}</span>
      <Crest code={t.code} size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{t.name}</div>
        <div className="muted" style={{ fontSize: 11.5 }}>{t.conf}</div>
      </div>
      <FormRow form={t.form} />
      <div style={{ textAlign: "right", width: 56 }}>
        <div className="num" style={{ fontSize: 18 }}>{t.elo}</div>
        <div className="section-tag">Elo</div>
      </div>
      <Delta trend={t.trend} />
    </div>
  );
}

function TournamentOutlook() {
  const teams = [...window.WC.teams].sort((a, b) => b.titleProb - a.titleProb);
  const max = teams[0].titleProb;
  const top4 = teams.slice(0, 4);
  const weights = window.WC.modelWeights;

  return (
    <div className="fade-in grid" style={{ gridTemplateColumns: "1.5fr 1fr", alignItems: "start" }}>
      {/* Championship race */}
      <div className="card pad">
        <CardHead icon="trophy" tag="Monte Carlo · 10,000 simulations" title="Championship Probability" />
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {teams.slice(0, 10).map((t, i) => <TitleRaceRow key={t.code} t={t} max={max} rank={i + 1} />)}
        </div>
        <div className="muted" style={{ fontSize: 11.5, marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
          {ICONS.info({ size: 13 })} Probabilities re-simulated each daily refresh from current form, injuries & schedule.
        </div>
      </div>

      {/* Right column */}
      <div className="grid" style={{ gap: 18 }}>
        {/* Projected top 4 */}
        <div className="card pad">
          <CardHead icon="target" tag="Projected finish" title="The Final Four" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {top4.map((t, i) => {
              const medals = ["#FFD24A", "#C7CEDB", "#E08A4A", "#7E8AA0"];
              return (
                <div key={t.code} className="lift" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, background: "var(--surface-2)" }}>
                  <div className="num" style={{ width: 34, height: 34, borderRadius: 9, display: "grid", placeItems: "center", background: medals[i], color: "#07090F", fontSize: 20 }}>{i + 1}</div>
                  <Crest code={t.code} size={30} />
                  <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{t.name}</span>
                  <div style={{ textAlign: "right" }}>
                    <div className="num" style={{ fontSize: 18, color: "var(--accent)" }}>{t.top4}%</div>
                    <div className="section-tag">Top-4 odds</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Model weights */}
        <div className="card pad">
          <CardHead icon="spark" tag="How the model thinks" title="Prediction Weights" />
          <div style={{ display: "flex", height: 12, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            {weights.map(w => <div key={w.factor} style={{ width: w.weight + "%", background: w.color }} title={w.factor + " " + w.weight + "%"} />)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {weights.map(w => (
              <div key={w.factor} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: w.color, flexShrink: 0 }} />
                <span className="mid" style={{ flex: 1 }}>{w.factor}</span>
                <span className="num" style={{ fontSize: 16 }}>{w.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Power rankings full width */}
      <div className="card pad" style={{ gridColumn: "1 / -1" }}>
        <CardHead icon="trend" tag="Daily power index" title="Team Power Rankings" more="Full table" />
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[...window.WC.teams].sort((a,b)=>b.elo-a.elo).map((t, i) => <PowerRow key={t.code} t={t} rank={i + 1} />)}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TournamentOutlook });
