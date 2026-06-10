/* ===========================================================
   SHARED COMPONENTS + ICONS
   =========================================================== */

// ---------- Icons (stroke-based, inherit currentColor) ----------
const Icon = ({ d, size, fill, sw = 1.8, children, vb = "0 0 24 24" }) => (
  <svg viewBox={vb} width={size} height={size} fill={fill || "none"}
    stroke={fill ? "none" : "currentColor"} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children || <path d={d} />}
  </svg>
);

const ICONS = {
  grid:   (p) => <Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Icon>,
  pitch:  (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14M3 9h3v6H3M21 9h-3v6h3"/><circle cx="12" cy="12" r="2.2"/></Icon>,
  trophy: (p) => <Icon {...p}><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3M9 14.5V18M15 14.5V18M8 20h8"/></Icon>,
  boot:   (p) => <Icon {...p}><path d="M4 6h6l2 5 6 1c2 .4 2 2 2 3v3H4V6Z"/><path d="M4 15h18"/></Icon>,
  bell:   (p) => <Icon {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M10.3 21a2 2 0 0 0 3.4 0"/></Icon>,
  target: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></Icon>,
  search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Icon>,
  refresh:(p) => <Icon {...p}><path d="M21 12a9 9 0 1 1-2.6-6.4M21 4v4h-4"/></Icon>,
  bolt:   (p) => <Icon {...p} fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></Icon>,
  chevR:  (p) => <Icon {...p}><path d="m9 6 6 6-6 6"/></Icon>,
  arrowUp:(p) => <Icon {...p}><path d="M12 19V5M6 11l6-6 6 6"/></Icon>,
  arrowDn:(p) => <Icon {...p}><path d="M12 5v14M6 13l6 6 6-6"/></Icon>,
  minus:  (p) => <Icon {...p}><path d="M5 12h14"/></Icon>,
  cross:  (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  check:  (p) => <Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>,
  card:   (p) => <Icon {...p}><rect x="6" y="3" width="12" height="18" rx="2" fill="currentColor" stroke="none"/></Icon>,
  rotate: (p) => <Icon {...p}><path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></Icon>,
  info:   (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></Icon>,
  trend:  (p) => <Icon {...p}><path d="M3 17l6-6 4 4 8-8M21 7v5h-5"/></Icon>,
  fire:   (p) => <Icon {...p}><path d="M12 3c2 3 .5 5 0 6 2-.5 3 1 3 3a3 3 0 0 1-6 0c0-1 .5-2 1-2.5C8 11 7 9 8 6c1 2 3 1 4-3Z"/></Icon>,
  clock:  (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  ball:   (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="m12 7 3 2-1 3.5h-4L9 9l3-2Z"/></Icon>,
  flag:   (p) => <Icon {...p}><path d="M5 21V4M5 4h12l-2 4 2 4H5"/></Icon>,
  users:  (p) => <Icon {...p}><circle cx="9" cy="8" r="3.2"/><path d="M3 20a6 6 0 0 1 12 0M16 5a3 3 0 0 1 0 6M21 20a6 6 0 0 0-5-5.9"/></Icon>,
  spark:  (p) => <Icon {...p}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></Icon>,
  dots:   (p) => <Icon {...p}><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none"/></Icon>,
  whistle:(p) => <Icon {...p}><path d="M3 11a5 5 0 0 0 5 5h2l8 3V8H10a5 5 0 0 0-7 3Z"/><circle cx="7" cy="11" r="1.4"/></Icon>,
};

// ---------- Team crest ----------
function Crest({ code, size = 36, radius }) {
  const t = (window.WC.teamMap[code]) || { color: "#444", txt: "#fff", code };
  return (
    <div className="crest" style={{
      width: size, height: size, background: t.color, color: t.txt || "#fff",
      fontSize: size * 0.36, borderRadius: radius != null ? radius : Math.max(7, size * 0.24),
    }}>
      <span style={{ position: "relative", zIndex: 1 }}>{t.code || code}</span>
    </div>
  );
}

// ---------- Probability bar ----------
function ProbBar({ value, color, height = 8, track, delay = 0 }) {
  const [w, setW] = React.useState(0);
  React.useEffect(() => { const id = setTimeout(() => setW(value), 60 + delay); return () => clearTimeout(id); }, [value]);
  return (
    <div className="probbar" style={{ height, background: track }}>
      <i style={{ width: w + "%", background: color || "var(--accent)" }} />
    </div>
  );
}

// ---------- Confidence ring (SVG donut) ----------
function ConfRing({ value, size = 92, stroke = 9, color, cap = "Confidence", showCap = true }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const [dash, setDash] = React.useState(0);
  React.useEffect(() => { const id = setTimeout(() => setDash(value), 80); return () => clearTimeout(id); }, [value]);
  const col = color || (value >= 65 ? "var(--good)" : value >= 50 ? "var(--accent)" : "var(--accent-warm)");
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--surface-2)" strokeWidth={stroke} fill="none" />
        <circle cx={size/2} cy={size/2} r={r} stroke={col} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={circ - (dash/100)*circ}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div className="ring-label">
        <div className="ring-pct" style={{ color: col }}>{value}<span style={{fontSize:'0.5em'}}>%</span></div>
        {showCap && <div className="ring-cap">{cap}</div>}
      </div>
    </div>
  );
}

// ---------- Form row (W/D/L) ----------
function FormRow({ form }) {
  return (
    <div className="form-row">
      {form.map((r, i) => <span key={i} className={"form-pill fp-" + r}>{r}</span>)}
    </div>
  );
}

// ---------- Sparkline ----------
function Sparkline({ data, w = 120, h = 36, color = "var(--accent)", fill = true }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => [ (i/(data.length-1))*w, h - ((d-min)/range)*(h-6) - 3 ]);
  const line = pts.map((p,i) => (i?"L":"M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L ${w} ${h} L 0 ${h} Z`;
  const gid = "sg" + Math.round(min*max*data.length) + data[0];
  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.28" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient></defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length-1][0]} cy={pts[pts.length-1][1]} r="2.6" fill={color} />
    </svg>
  );
}

// ---------- Trend delta ----------
function Delta({ trend, children }) {
  if (trend > 0) return <span className="delta up">{ICONS.arrowUp({ size: 12 })}{children}</span>;
  if (trend < 0) return <span className="delta down">{ICONS.arrowDn({ size: 12 })}{children}</span>;
  return <span className="delta flat">{ICONS.minus({ size: 12 })}{children}</span>;
}

// ---------- Card head ----------
function CardHead({ icon, title, tag, more, onMore }) {
  const I = ICONS[icon];
  return (
    <div className="card-head">
      {I && <div className="ch-icon">{I({ size: 17 })}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, minWidth: 0 }}>
        {tag && <div className="section-tag" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tag}</div>}
        <h3 style={{ lineHeight: 1 }}>{title}</h3>
      </div>
      {more && <button className="ch-more" onClick={onMore}>{more} {ICONS.chevR({ size: 13 })}</button>}
    </div>
  );
}

// ---------- Stat chip ----------
function Stat({ label, value, unit, accent, sub }) {
  return (
    <div>
      <div className="section-tag" style={{ marginBottom: 6 }}>{label}</div>
      <div className="kpi-num" style={{ fontSize: 38, color: accent ? "var(--accent)" : "var(--text)" }}>
        {value}<span style={{ fontSize: 18, color: "var(--text-dim)", marginLeft: 3 }}>{unit}</span>
      </div>
      {sub && <div className="mid" style={{ fontSize: 12.5, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

Object.assign(window, { ICONS, Icon, Crest, ProbBar, ConfRing, FormRow, Sparkline, Delta, CardHead, Stat });
