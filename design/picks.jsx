/* ===========================================================
   SCREEN: Today's Picks  +  shared MatchCard
   =========================================================== */

function ScorePips({ n, color }) {
  return null;
}

// Win/Draw/Loss tri-bar
function TriBar({ winH, draw, winA, homeColor, awayColor }) {
  return (
    <div style={{ display: "flex", height: 8, borderRadius: 6, overflow: "hidden", gap: 2 }}>
      <div style={{ width: winH + "%", background: homeColor }} title={"Home " + winH + "%"} />
      <div style={{ width: draw + "%", background: "var(--text-dim)" }} title={"Draw " + draw + "%"} />
      <div style={{ width: winA + "%", background: awayColor }} title={"Away " + winA + "%"} />
    </div>
  );
}

function MatchCard({ m, expanded, onToggle, compact }) {
  const home = window.WC.teamMap[m.home];
  const away = window.WC.teamMap[m.awayCode];
  const homeColor = home.color === "#FFFFFF" ? "#cfd6e2" : home.color;
  const awayColor = away.color === "#FFFFFF" ? "#cfd6e2" : away.color;
  const pickLabel = m.pickKind === "draw" ? "Draw" : (window.WC.teamMap[m.pick] ? window.WC.teamMap[m.pick].name + " Win" : "Draw");
  const confColor = m.conf >= 65 ? "var(--good)" : m.conf >= 50 ? "var(--accent)" : "var(--accent-warm)";

  return (
    <div className={"card lift" + (expanded ? " is-open" : "")} style={{ padding: compact ? 16 : 18, cursor: "pointer" }} onClick={onToggle}>
      {/* meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span className="section-tag">{m.stage}</span>
        <span className="muted" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          {ICONS.clock({ size: 12 })} {m.time}
        </span>
        <span className={"badge " + (m.tag === "High confidence" ? "badge-good" : m.tag === "Upset watch" ? "badge-warm" : m.tag === "Coin flip" ? "badge-dim" : "badge-accent")}
          style={{ marginLeft: "auto" }}>{m.tag}</span>
      </div>

      {/* teams + predicted score */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <Crest code={m.home} size={42} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{home.name}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>Elo {home.elo}</div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div className="num" style={{ fontSize: 40, lineHeight: 0.9, letterSpacing: "0.02em", whiteSpace: "nowrap" }}>
            {m.score[0]}<span className="muted" style={{ margin: "0 6px" }}>–</span>{m.score[1]}
          </div>
          <div className="section-tag" style={{ marginTop: 2 }}>Predicted</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 11, justifyContent: "flex-end", flexDirection: "row-reverse" }}>
          <Crest code={m.awayCode} size={42} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>{away.name}</div>
            <div className="muted" style={{ fontSize: 11.5 }}>Elo {away.elo}</div>
          </div>
        </div>
      </div>

      {/* pick + confidence */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 12 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              {ICONS.bolt({ size: 13, })} <b style={{ color: "var(--accent)" }}>AI Pick:</b> <span style={{ fontWeight: 700 }}>{pickLabel}</span>
            </span>
          </div>
          <TriBar winH={m.winH} draw={m.draw} winA={m.winA} homeColor={homeColor} awayColor={awayColor} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 11.5 }} className="muted tabular">
            <span>{home.code} {m.winH}%</span><span>Draw {m.draw}%</span><span>{away.code} {m.winA}%</span>
          </div>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div className="num" style={{ fontSize: 30, color: confColor, lineHeight: 1 }}>{m.conf}<span style={{fontSize:14}}>%</span></div>
          <div className="section-tag">Confidence</div>
        </div>
      </div>

      {/* expandable reasons */}
      <div style={{ maxHeight: expanded ? 380 : 0, overflow: "hidden", transition: "max-height .35s cubic-bezier(.2,.8,.2,1)" }}>
        <hr className="hr" style={{ margin: "16px 0 14px" }} />
        <div className="section-tag" style={{ marginBottom: 9 }}>Why the model picks this</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {m.reasons.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 9, fontSize: 13, alignItems: "flex-start" }}>
              <span style={{ color: "var(--accent)", marginTop: 1, flexShrink: 0 }}>{ICONS.check({ size: 14 })}</span>
              <span className="mid">{r}</span>
            </div>
          ))}
        </div>
        {m.risk && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 14, padding: "11px 13px", borderRadius: 11, background: "rgba(255,178,61,0.09)", border: "1px solid rgba(255,178,61,0.22)" }}>
            <span style={{ color: "var(--accent-warm)", flexShrink: 0, marginTop: 1 }}>{ICONS.info({ size: 15 })}</span>
            <div>
              <div className="section-tag" style={{ color: "var(--accent-warm)", marginBottom: 3 }}>Risk factor</div>
              <span className="mid" style={{ fontSize: 13 }}>{m.risk}</span>
            </div>
          </div>
        )}
        <div className="muted" style={{ fontSize: 11, marginTop: 12, display: "flex", alignItems: "center", gap: 5 }}>
          {ICONS.clock({ size: 12 })} Data freshness: updated {window.WC.meta.lastUpdate} · picks lock at kickoff
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginTop: 12, fontSize: 11.5, color: "var(--text-dim)", fontWeight: 600 }}>
        {expanded ? "Hide reasoning" : "Tap for AI reasoning"} {ICONS.chevR({ size: 12 })}
      </div>
    </div>
  );
}

function TodaysPicks() {
  const [open, setOpen] = React.useState("m1");
  const [filter, setFilter] = React.useState("all");
  const ms = window.WC.matches;
  const shown = filter === "all" ? ms : ms.filter(m => m.conf >= 60);

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <div className="segment">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All {ms.length}</button>
          <button className={filter === "conf" ? "on" : ""} onClick={() => setFilter("conf")}>High confidence</button>
        </div>
        <div className="badge badge-dim" style={{ marginLeft: "auto", padding: "6px 12px" }}>
          {ICONS.refresh({ size: 13 })}&nbsp; Morning refresh · {window.WC.meta.lastUpdate}
        </div>
      </div>

      <div className="grid stagger" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))" }}>
        {shown.map(m => (
          <MatchCard key={m.id} m={m} expanded={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} />
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MatchCard, TriBar, TodaysPicks });
