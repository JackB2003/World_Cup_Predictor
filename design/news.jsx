/* ===========================================================
   SCREEN: News & Injury Alerts  +  Pick Tracker
   =========================================================== */

const SEV_MAP = {
  high: { cls: "badge-bad", dot: "var(--bad)", label: "High impact" },
  med:  { cls: "badge-warm", dot: "var(--accent-warm)", label: "Medium" },
  low:  { cls: "badge-dim", dot: "var(--text-dim)", label: "Low" },
};
const TYPE_ICON = { injury: "cross", suspension: "card", lineup: "rotate", news: "info", odds: "trend" };

function NewsItem({ n }) {
  const t = window.WC.teamMap[n.team];
  const sev = SEV_MAP[n.sev];
  const ic = TYPE_ICON[n.type];
  return (
    <div className="lift" style={{ display: "flex", gap: 14, padding: 16, borderRadius: 14, border: "1px solid var(--line)" }}>
      <div style={{ position: "relative" }}>
        <Crest code={n.team} size={44} />
        <div style={{ position: "absolute", bottom: -5, right: -5, width: 22, height: 22, borderRadius: 7, background: sev.dot, color: "#07090F", display: "grid", placeItems: "center" }}>
          {ICONS[ic]({ size: 12 })}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className={"badge " + sev.cls} style={{ fontSize: 10.5 }}>{sev.label}</span>
          <span className="muted" style={{ fontSize: 11.5, textTransform: "capitalize" }}>{n.type}</span>
          <span className="muted" style={{ fontSize: 11.5, marginLeft: "auto" }}>{n.time}</span>
        </div>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 4 }}>{n.title}</div>
        <div className="mid" style={{ fontSize: 12.5, lineHeight: 1.5 }}>{n.body}</div>
        <div style={{ marginTop: 9 }}>
          <span className="badge badge-accent" style={{ fontSize: 11 }}>{ICONS.bolt({ size: 11 })}&nbsp; Model impact: {n.impact}</span>
        </div>
      </div>
    </div>
  );
}

function NewsAlerts() {
  const [filter, setFilter] = React.useState("all");
  const news = window.WC.news;
  const shown = filter === "all" ? news : news.filter(n => n.type === filter || (filter === "fitness" && (n.type === "injury" || n.type === "suspension")));
  const counts = {
    high: news.filter(n => n.sev === "high").length,
    fitness: news.filter(n => n.type === "injury" || n.type === "suspension").length,
  };

  return (
    <div className="fade-in grid" style={{ gridTemplateColumns: "1fr 300px", alignItems: "start" }}>
      <div className="grid" style={{ gap: 14 }}>
        <div className="segment">
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>All</button>
          <button className={filter === "fitness" ? "on" : ""} onClick={() => setFilter("fitness")}>Injuries &amp; bans</button>
          <button className={filter === "lineup" ? "on" : ""} onClick={() => setFilter("lineup")}>Lineups</button>
          <button className={filter === "odds" ? "on" : ""} onClick={() => setFilter("odds")}>Odds</button>
        </div>
        <div className="grid stagger" style={{ gap: 12 }}>
          {shown.map((n, i) => <NewsItem key={i} n={n} />)}
        </div>
      </div>

      {/* side summary */}
      <div className="grid" style={{ gap: 18 }}>
        <div className="card pad">
          <CardHead icon="bell" title="Alert Summary" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="num" style={{ fontSize: 36, color: "var(--bad)", lineHeight: 1 }}>{counts.high}</div>
              <div className="mid" style={{ fontSize: 13 }}>High-impact alerts<br/><span className="muted" style={{fontSize:11.5}}>affecting today's picks</span></div>
            </div>
            <hr className="hr" />
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="num" style={{ fontSize: 36, color: "var(--accent-warm)", lineHeight: 1 }}>{counts.fitness}</div>
              <div className="mid" style={{ fontSize: 13 }}>Fitness items<br/><span className="muted" style={{fontSize:11.5}}>injuries + suspensions</span></div>
            </div>
          </div>
        </div>
        <div className="card pad" style={{ background: "linear-gradient(150deg, rgba(var(--accent-rgb),0.08), var(--surface))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {ICONS.refresh({ size: 16 })}<span className="section-tag">Refresh schedule</span>
          </div>
          <div className="mid" style={{ fontSize: 13, lineHeight: 1.5 }}>
            Pre-match only — no live tracking. A morning refresh updates results, standings, injuries & top scorers, with an optional pre-match pass 1–2 hrs before the first kickoff. Predictions recalculate before picks lock.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== PICK TRACKER ===================== */

function PickTracker() {
  const u = window.WC.userPicks;
  const STAT = { "on-track": { cls: "badge-good", t: "On track" }, "risk": { cls: "badge-warm", t: "At risk" }, "leading": { cls: "badge-good", t: "Leading" } };

  return (
    <div className="fade-in grid" style={{ gridTemplateColumns: "1fr", gap: 18 }}>
      {/* KPI strip */}
      <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
        {[
          { l: "Total points", v: u.points.toLocaleString(), accent: true, sub: "this tournament" },
          { l: "Global rank", v: "#" + u.rank, sub: "of " + u.totalUsers.toLocaleString() + " players" },
          { l: "Pick accuracy", v: u.accuracy + "%", sub: "last 14 picks" },
          { l: "Hot streak", v: u.streak, sub: "correct in a row", fire: true },
        ].map(k => (
          <div key={k.l} className="card pad lift">
            <div className="section-tag">{k.l}</div>
            <div className="num" style={{ fontSize: 42, marginTop: 4, color: k.accent ? "var(--accent)" : "var(--text)", display: "flex", alignItems: "center", gap: 8 }}>
              {k.v}{k.fire && <span style={{ color: "var(--accent-warm)" }}>{ICONS.fire({ size: 24 })}</span>}
            </div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
        {/* tournament picks status */}
        <div className="card pad">
          <CardHead icon="trophy" tag="Your one-time picks" title="Tournament Predictions" />
          <div className="section-tag" style={{ marginBottom: 10 }}>Top 4 finish</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {u.top4.map(p => {
              const t = window.WC.teamMap[p.team]; const st = STAT[p.status];
              return (
                <div key={p.pos} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 11, background: "var(--surface-2)" }}>
                  <span className="num muted" style={{ width: 18, fontSize: 18 }}>{p.pos}</span>
                  <Crest code={p.team} size={28} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, flex: 1 }}>{t.name}</span>
                  <span className="muted" style={{ fontSize: 11.5 }}>{p.note}</span>
                  <span className={"badge " + st.cls}>{st.t}</span>
                </div>
              );
            })}
          </div>
          <div className="section-tag" style={{ marginBottom: 10 }}>Top scorer</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 11, background: "var(--surface-2)" }}>
            <Crest code={u.topScorer.team} size={28} />
            <span style={{ fontWeight: 700, fontSize: 13.5, flex: 1 }}>{u.topScorer.player}</span>
            <span className="muted" style={{ fontSize: 11.5 }}>{u.topScorer.note}</span>
            <span className="badge badge-good">{STAT[u.topScorer.status].t}</span>
          </div>
        </div>

        {/* accuracy + history */}
        <div className="grid" style={{ gap: 18 }}>
          <div className="card pad">
            <CardHead icon="target" tag="Trend" title="Accuracy Over Time" />
            <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
              <div className="num" style={{ fontSize: 48, color: "var(--accent)", lineHeight: 0.9 }}>{u.accuracy}<span style={{fontSize:22}}>%</span></div>
              <div style={{ flex: 1 }}><Sparkline data={u.accuracyTrend} w={220} h={56} color="var(--accent)" /></div>
            </div>
          </div>
          <div className="card pad">
            <CardHead icon="clock" tag="Recent results" title="Prediction History" />
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {u.history.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 4px", borderBottom: i < u.history.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, display: "grid", placeItems: "center", background: h.result === "hit" ? "rgba(var(--good-rgb),.16)" : "rgba(var(--bad-rgb),.16)", color: h.result === "hit" ? "var(--good)" : "var(--bad)" }}>
                    {h.result === "hit" ? ICONS.check({ size: 13 }) : ICONS.cross({ size: 13 })}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 13, width: 110 }}>{h.match}</span>
                  <span className="muted" style={{ fontSize: 12, flex: 1 }}>{h.pick} · {h.score}</span>
                  <span className="num" style={{ fontSize: 18, color: h.pts ? "var(--good)" : "var(--text-dim)" }}>+{h.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { NewsAlerts, PickTracker });
