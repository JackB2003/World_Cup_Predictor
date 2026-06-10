/* ===========================================================
   APP SHELL — sidebar nav, topbar, routing, tweaks
   =========================================================== */

const NAV = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "picks",    label: "Today's Picks", icon: "pitch", badge: 5 },
  { id: "outlook",  label: "Tournament Outlook", icon: "trophy" },
  { id: "scorer",   label: "Top Scorer Watch", icon: "boot" },
  { id: "news",     label: "News & Alerts", icon: "bell", badge: 2 },
  { id: "tracker",  label: "Pick Tracker", icon: "target" },
];

const PAGE_META = {
  overview: { title: "Command Center", sub: "Your daily AI prediction briefing" },
  picks:    { title: "Today's Picks", sub: "AI match predictions for all of today's fixtures" },
  outlook:  { title: "Tournament Outlook", sub: "Championship odds & projected finishers · 10,000 simulations" },
  scorer:   { title: "Top Scorer Watch", sub: "Golden Boot projections & the scoring race" },
  news:     { title: "News & Injury Alerts", sub: "Latest injury, suspension & roster intel that moves the model" },
  tracker:  { title: "Pick Tracker", sub: "Your selections, accuracy & points" },
};

const ACCENTS = {
  lime:    { c: "#C6FF3D", rgb: "198, 255, 61" },
  cyan:    { c: "#36D1FF", rgb: "54, 209, 255" },
  magenta: { c: "#FF3D7F", rgb: "255, 61, 127" },
  violet:  { c: "#9B7BFF", rgb: "155, 123, 255" },
  amber:   { c: "#FFB23D", rgb: "255, 178, 61" },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "lime",
  "theme": "dark",
  "showReasoning": true,
  "density": "regular"
}/*EDITMODE-END*/;

function App() {
  const [tab, setTab] = React.useState("overview");
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // apply theme + accent to :root
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", t.theme);
    const a = ACCENTS[t.accent] || ACCENTS.lime;
    root.style.setProperty("--accent", a.c);
    root.style.setProperty("--accent-rgb", a.rgb);
    const id = setTimeout(() => root.classList.remove("theme-switching"), 80);
    return () => clearTimeout(id);
  }, [t.theme, t.accent]);

  const go = (id) => { setTab(id); document.querySelector(".main").scrollTo({ top: 0 }); };
  const meta = PAGE_META[tab];

  const screens = {
    overview: <Overview go={go} />,
    picks: <TodaysPicks />,
    outlook: <TournamentOutlook />,
    scorer: <TopScorer />,
    news: <NewsAlerts />,
    tracker: <PickTracker />,
  };

  return (
    <div className="app" data-density={t.density}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">{ICONS.ball({ size: 24 })}</div>
          <div className="brand-text">
            <div className="brand-name">PITCH<span>IQ</span></div>
            <div className="brand-sub">WC26 Predictor</div>
          </div>
        </div>

        <div className="nav-label">Dashboard</div>
        {NAV.map(n => (
          <button key={n.id} className={"nav-item" + (tab === n.id ? " active" : "")} onClick={() => go(n.id)}>
            {ICONS[n.icon]({ size: 19 })}
            <span>{n.label}</span>
            {n.badge && <span className="nav-badge">{n.badge}</span>}
          </button>
        ))}

        <div className="sidebar-foot">
          <div className="minicard">
            <div className="mc-top">Model accuracy</div>
            <div className="mc-big">71%</div>
            <div className="mc-sub">across 128 graded picks</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <header className="topbar">
          <div className="page-title">
            <h1>{meta.title}</h1>
            <p>{meta.sub}</p>
          </div>
          <div className="topbar-spacer" />
          <div className="searchbox">{ICONS.search({ size: 16 })}<span>Search teams, players…</span></div>
          <div className="sync-chip" title="Pre-match predictions — refreshed on a schedule, not live">
            <span className="sync-dot" /> Updated {WC.meta.lastUpdate} <span className="sync-sub">· next {WC.meta.nextRefresh}</span>
          </div>
          <button className="pill-btn" onClick={() => location.reload()}>{ICONS.refresh({ size: 16 })} Refresh</button>
          <div className="avatar">AM</div>
        </header>

        <div className="page" key={tab}>
          {screens[tab]}
        </div>
      </main>

      {/* TWEAKS */}
      <TweaksPanel>
        <TweakSection label="Accent color" />
        <TweakColor label="Accent" value={(ACCENTS[t.accent]||ACCENTS.lime).c}
          options={Object.values(ACCENTS).map(a => a.c)}
          onChange={(v) => {
            const key = Object.keys(ACCENTS).find(k => ACCENTS[k].c === v) || "lime";
            setTweak("accent", key);
          }} />
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={["dark", "light"]} onChange={(v) => setTweak("theme", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density} options={["compact", "regular", "comfy"]} onChange={(v) => setTweak("density", v)} />
        <TweakToggle label="Show AI reasoning hints" value={t.showReasoning} onChange={(v) => setTweak("showReasoning", v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
