/* ===========================================================
   SCREEN: Overview Hub
   =========================================================== */

function Countdown({ to }) {
  const calc = () => {
    const diff = Math.max(0, to - new Date());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff / 3600000) % 24),
      m: Math.floor((diff / 60000) % 60),
      s: Math.floor((diff / 1000) % 60),
    };
  };
  const [t, setT] = React.useState(calc);
  React.useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, []);
  const Box = ({ v, l }) => (
    <div style={{ textAlign: "center" }}>
      <div className="num" style={{ fontSize: 38, lineHeight: 0.9, color: "#07090F" }}>{String(v).padStart(2, "0")}</div>
      <div style={{ fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 800, color: "rgba(7,9,15,0.65)", marginTop: 3 }}>{l}</div>
    </div>
  );
  return (
    <div style={{ display: "flex", gap: 18 }}>
      <Box v={t.d} l="Days" /><Box v={t.h} l="Hrs" /><Box v={t.m} l="Min" /><Box v={t.s} l="Sec" />
    </div>
  );
}

function Overview({ go }) {
  const meta = window.WC.meta;
  const teams = [...window.WC.teams].sort((a, b) => b.titleProb - a.titleProb).slice(0, 5);
  const maxT = teams[0].titleProb;
  const topMatch = window.WC.matches[1]; // France high confidence
  const sc = window.WC.scorers.slice(0, 4);
  const maxS = Math.max(...sc.map(s => s.prob));
  const alerts = window.WC.news.filter(n => n.sev === "high");

  return (
    <div className="fade-in grid" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 18, alignItems: "start" }}>
      {/* HERO */}
      <div className="card" style={{ gridColumn: "1 / -1", padding: 0, overflow: "hidden", background: "linear-gradient(110deg, var(--accent), #9be63a 60%, var(--accent-3))", color: "#07090F" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 30, padding: "28px 32px", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.12, backgroundImage: "repeating-linear-gradient(135deg, #07090F 0 2px, transparent 2px 22px)" }} />
          <div style={{ position: "relative", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase" }}>
              {ICONS.flag({ size: 14 })} {meta.hosts}
            </div>
            <div className="display" style={{ fontSize: 40, lineHeight: 1, margin: "10px 0 6px", letterSpacing: "-0.03em" }}>Kickoff in</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.7 }}>FIFA World Cup 2026 · {meta.simRuns.toLocaleString()} simulations refreshed daily</div>
          </div>
          <div style={{ position: "relative" }}><Countdown to={meta.kickoff} /></div>
          <div style={{ position: "relative", borderLeft: "1px solid rgba(7,9,15,0.2)", paddingLeft: 28 }}>
            <div className="num" style={{ fontSize: 52, lineHeight: 0.85 }}>{meta.matchesToday}</div>
            <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.7 }}>Matches today</div>
            <button onClick={() => go("picks")} style={{ marginTop: 12, background: "#07090F", color: "var(--accent)", padding: "8px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              View today's picks {ICONS.chevR({ size: 13 })}
            </button>
          </div>
        </div>
      </div>

      {/* Top pick spotlight */}
      <div className="card pad">
        <CardHead icon="bolt" tag="Highest-confidence pick" title="Lock of the Day" more="All matches" onMore={() => go("picks")} />
        <MatchCardLite m={topMatch} go={go} />
      </div>

      {/* Title race mini */}
      <div className="card pad">
        <CardHead icon="trophy" tag="Championship odds" title="Title Race" more="Outlook" onMore={() => go("outlook")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {teams.map((t, i) => {
            const c = t.color === "#FFFFFF" ? "#cfd6e2" : t.color;
            return (
              <div key={t.code} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <Crest code={t.code} size={26} />
                <span style={{ width: 74, fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                <div style={{ flex: 1 }}><ProbBar value={(t.titleProb / maxT) * 100} color={c} height={8} delay={i * 50} /></div>
                <span className="num" style={{ width: 44, textAlign: "right", fontSize: 18 }}>{t.titleProb}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top scorer mini */}
      <div className="card pad">
        <CardHead icon="boot" tag="Golden Boot watch" title="Top Scorer Race" more="Watch" onMore={() => go("scorer")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sc.map((s, i) => {
            const t = window.WC.teamMap[s.team];
            const c = t.color === "#FFFFFF" ? "#cfd6e2" : t.color;
            return (
              <div key={s.player} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                <span className="num muted" style={{ width: 16, fontSize: 16 }}>{i + 1}</span>
                <Crest code={s.team} size={26} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.player}</span>
                <div style={{ width: 70 }}><ProbBar value={(s.prob / maxS) * 100} color={c} height={7} delay={i * 50} /></div>
                <span className="num" style={{ width: 40, textAlign: "right", fontSize: 17, color: "var(--accent)" }}>{s.proj}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts mini */}
      <div className="card pad">
        <CardHead icon="bell" tag="Needs your attention" title="High-Impact Alerts" more="All news" onMore={() => go("news")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {alerts.map((n, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "10px 12px", borderRadius: 11, background: "var(--surface-2)" }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, flexShrink: 0, display: "grid", placeItems: "center", background: "rgba(var(--bad-rgb),.16)", color: "var(--bad)" }}>
                {ICONS[TYPE_ICON[n.type]]({ size: 14 })}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>{n.title}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{n.impact} · {n.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// compact match card used in overview spotlight
function MatchCardLite({ m, go }) {
  const home = window.WC.teamMap[m.home], away = window.WC.teamMap[m.awayCode];
  const homeColor = home.color === "#FFFFFF" ? "#cfd6e2" : home.color;
  const awayColor = away.color === "#FFFFFF" ? "#cfd6e2" : away.color;
  const pickLabel = m.pickKind === "draw" ? "Draw" : window.WC.teamMap[m.pick].name + " Win";
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}><Crest code={m.home} size={36} /><b style={{ fontSize: 14 }}>{home.name}</b></div>
        <div className="num" style={{ fontSize: 30, textAlign: "center", whiteSpace: "nowrap" }}>{m.score[0]}<span className="muted" style={{ margin: "0 5px" }}>–</span>{m.score[1]}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexDirection: "row-reverse" }}><Crest code={m.awayCode} size={36} /><b style={{ fontSize: 14 }}>{away.name}</b></div>
      </div>
      <TriBar winH={m.winH} draw={m.draw} winA={m.winA} homeColor={homeColor} awayColor={awayColor} />
      <div style={{ display: "flex", alignItems: "center", marginTop: 14, gap: 12 }}>
        <span className="badge badge-accent">{ICONS.bolt({ size: 12 })}&nbsp; {pickLabel}</span>
        <span className="muted" style={{ fontSize: 12 }}>{m.stage}</span>
        <span style={{ marginLeft: "auto", display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="num" style={{ fontSize: 26, color: "var(--good)", lineHeight: 1 }}>{m.conf}%</span>
          <span className="section-tag">conf</span>
        </span>
      </div>
    </div>
  );
}

Object.assign(window, { Overview, Countdown, MatchCardLite });
