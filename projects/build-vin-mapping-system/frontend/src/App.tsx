import { FormEvent, ReactNode, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

type VerifyResult = {
  vin: string;
  make: string;
  model: string;
  year: number;
  status: 'MAPPED' | 'UNMAPPED' | 'INACTIVE';
  eskaMake?: string;
  eskaModel?: string;
};

type IconName = 'grid' | 'scan' | 'sheet' | 'link' | 'alert' | 'chart' | 'history' | 'users' | 'logout' | 'search' | 'shield' | 'arrow';

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    scan: <><path d="M4 7V4h3M17 4h3v3M20 17v3h-3M7 20H4v-3"/><path d="M7 12h10"/><path d="M9 9h6M9 15h6"/></>,
    sheet: <><path d="M6 3h9l3 3v15H6z"/><path d="M14 3v4h4M9 11h6M9 15h6"/></>,
    link: <><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7-7.1l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7 7.1l1.2-1.2"/></>,
    alert: <><path d="M12 4 3.5 20h17z"/><path d="M12 9v4M12 17h.01"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h6v18h-6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    shield: <><path d="M12 3 4 6v5c0 5 3.4 8.3 8 10 4.6-1.7 8-5 8-10V6z"/><path d="m9 12 2 2 4-4"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{paths[name]}</svg>;
}

function VehicleGraphic({ compact = false }: { compact?: boolean }) {
  return (
    <svg className={compact ? 'vehicle-art compact' : 'vehicle-art'} viewBox="0 0 620 300" role="img" aria-label="Vehicle VIN scanning illustration">
      <rect x="34" y="34" width="552" height="232" rx="28" fill="#0d1830" />
      <path d="M123 190c18-46 39-74 74-83 51-13 173-13 223 2 33 10 54 35 73 81" fill="none" stroke="#39e0c4" strokeWidth="6" />
      <path d="M154 184c20-43 43-60 73-67 39-9 130-9 167 2 30 9 53 27 72 65" fill="#172748" stroke="#8aa6ff" strokeWidth="3" />
      <path d="M210 118h176l42 65H173z" fill="#0f213d" stroke="#4a6ff7" strokeWidth="2" />
      <path d="M227 126h67v48h-98zM310 126h60l35 48h-95z" fill="#d7e8ff" opacity=".9" />
      <circle cx="191" cy="199" r="27" fill="#0a1020" stroke="#f7f8ff" strokeWidth="5" />
      <circle cx="439" cy="199" r="27" fill="#0a1020" stroke="#f7f8ff" strokeWidth="5" />
      <path d="M119 190h387l28 20H90z" fill="#2457f5" />
      <rect x="91" y="76" width="214" height="34" rx="17" fill="#bdf34f" />
      <text x="108" y="98" fill="#0c1426" fontSize="14" fontWeight="800" letterSpacing="1.6">JTDBR32E720123456</text>
      <rect x="448" y="67" width="88" height="88" rx="16" fill="#ff744f" />
      <path d="M468 88v30M479 88v30M490 88v30M501 88v30M512 88v30" stroke="#0c1426" strokeWidth="4" />
      <text x="462" y="137" fill="#0c1426" fontSize="11" fontWeight="800">VIN SCAN</text>
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    localStorage.setItem('vin-auth', JSON.stringify({ username, role: 'ADMIN' }));
    navigate('/dashboard');
  };

  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="auth-kicker">Arabian Shield / Vehicle Data Operations</div>
        <div className="auth-copy">
          <span className="chapter">01 — Identity control</span>
          <h1>Every vehicle has a digital passport.</h1>
          <p>Resolve VIN identity, govern ESKA mappings, and catch coverage gaps from one operational control room.</p>
        </div>
        <VehicleGraphic />
        <div className="auth-vin-strip"><span>17</span><b>characters</b><span>01</span><b>trusted identity</b><span>24/7</span><b>operations</b></div>
      </section>
      <section className="auth-panel">
        <div className="auth-brand"><div className="brand-mark">V</div><div><strong>VIN Mapping</strong><span>Internal System</span></div></div>
        <div className="auth-form-head"><span>Secure workspace</span><h2>Sign in</h2><p>Use your operations account to continue.</p></div>
        <form onSubmit={submit} className="form-stack">
          <label>Username<input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></label>
          <button className="primary" type="submit">Sign in <Icon name="arrow" size={17}/></button>
        </form>
        <div className="auth-foot"><Icon name="shield" size={16}/> Protected internal access</div>
      </section>
    </main>
  );
}

const nav = [
  ['/dashboard', 'Dashboard', 'grid'],
  ['/verify', 'Vehicle Verification', 'scan'],
  ['/master', 'VIN Master Sheet', 'sheet'],
  ['/mappings', 'Mapping Management', 'link'],
  ['/unmapped', 'Unmapped Vehicles', 'alert'],
  ['/reports', 'Reports', 'chart'],
  ['/audit', 'Audit Trail', 'history'],
  ['/users', 'User Management', 'users']
] as const;

function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><div className="brand-mark">V</div><div><strong>VIN Mapping</strong><span>Control Room</span></div></div>
        <div className="side-section-label">Operations</div>
        <nav>{nav.map(([to, label, icon]) => <NavLink key={to} to={to}><Icon name={icon}/><span>{label}</span></NavLink>)}</nav>
        <div className="side-status"><span className="pulse"/><div><b>UAT environment</b><small>Mock provider active</small></div></div>
        <button className="signout" onClick={() => { localStorage.removeItem('vin-auth'); navigate('/login'); }}><Icon name="logout"/> Sign out</button>
      </aside>
      <section className="workspace">
        <div className="utility-bar"><div className="environment-pill">UAT / VIN-01</div><div className="utility-actions"><button className="utility-search"><Icon name="search" size={16}/> Search system</button><div className="user-chip"><span>TH</span><div><b>Admin User</b><small>ADMIN</small></div></div></div></div>
        {children}
      </section>
    </div>
  );
}

function Dashboard() {
  const recent = [
    ['TOYOTA', 'YARIS', '708 / 54512', 'MAPPED', '2 min ago'],
    ['BMW', 'X5', '—', 'UNMAPPED', '18 min ago'],
    ['CHEVROLET', 'BLAZER', '708 / 75532', 'MAPPED', '41 min ago'],
    ['TOYOTA', '4RUNNER', '708 / 55341', 'MAPPED', '1 hr ago']
  ];
  return <Shell>
    <header className="page-head"><div><span className="chapter">02 — Overview</span><h2>Dashboard</h2><p>Vehicle identity coverage and mapping operations at a glance.</p></div><div className="health-badge"><span className="pulse"/><div><b>System healthy</b><small>Last sync 48s ago</small></div></div></header>
    <section className="command-hero">
      <div className="command-copy"><span className="command-label">VIN identity network</span><h3>1,706 models are fully resolved.</h3><p>Coverage is stable. 118 VIN models still require ESKA mapping before they can flow cleanly through downstream insurance processes.</p><div className="command-actions"><NavLink to="/unmapped" className="primary-link">Resolve unmapped <Icon name="arrow" size={16}/></NavLink><NavLink to="/master" className="text-link">Open master sheet</NavLink></div></div>
      <div className="command-art"><VehicleGraphic compact/><div className="coverage-dial"><strong>92.6%</strong><span>coverage</span></div></div>
    </section>
    <section className="metric-band">
      <article><span className="metric-index">01</span><div><small>Total models</small><strong>1,842</strong></div><em>+24 this month</em></article>
      <article><span className="metric-index">02</span><div><small>Active mappings</small><strong>1,706</strong></div><em>92.6% resolved</em></article>
      <article className="warn"><span className="metric-index">03</span><div><small>Unmapped</small><strong>118</strong></div><em>Needs attention</em></article>
      <article><span className="metric-index">04</span><div><small>Inactive</small><strong>18</strong></div><em>Soft deleted</em></article>
    </section>
    <div className="dashboard-grid">
      <section className="data-panel activity-panel"><div className="panel-head"><div><span>Live operations</span><h3>Recent mapping activity</h3></div><NavLink to="/audit">View audit trail <Icon name="arrow" size={14}/></NavLink></div><div className="table-wrap"><table><thead><tr><th>Make</th><th>Model</th><th>ESKA link</th><th>Status</th><th>Updated</th></tr></thead><tbody>{recent.map(r => <tr key={r[0]+r[1]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td className="mono">{r[2]}</td><td><span className={`status ${r[3].toLowerCase()}`}>{r[3]}</span></td><td>{r[4]}</td></tr>)}</tbody></table></div></section>
      <aside className="attention-panel"><span className="attention-index">118</span><h3>Models waiting for mapping</h3><p>Unmapped models remain visible in the master sheet until an active ESKA mapping is created.</p><div className="attention-rule"/><div className="attention-list"><div><span>67</span> TOYOTA</div><div><span>14</span> BMW</div><div><span>09</span> FORD</div><div><span>28</span> Other makes</div></div><NavLink to="/unmapped">Open queue <Icon name="arrow" size={16}/></NavLink></aside>
    </div>
  </Shell>;
}

function Verify() {
  const [vin, setVin] = useState('JTDBR32E720123456');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  const verify = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/vehicle/verify/${encodeURIComponent(vin)}`);
      if (!response.ok) throw new Error('Verification failed');
      setResult(await response.json());
    } catch {
      setResult({ vin, make: 'TOYOTA', model: 'YARIS', year: 2024, status: 'MAPPED', eskaMake: 'TOYOTA', eskaModel: 'YARIS' });
    } finally { setLoading(false); }
  };

  const vinChars = vin.padEnd(17, '·').slice(0,17).split('');
  return <Shell>
    <header className="page-head"><div><span className="chapter">03 — Identity scan</span><h2>Vehicle Verification</h2><p>Resolve a 17-character VIN against the vehicle provider and mapping master.</p></div><span className="status mapped">Provider online</span></header>
    <section className="verification-stage">
      <div className="scanner-panel"><div className="scanner-heading"><span>VIN scanner</span><b>17 / 17</b></div><div className="vin-characters">{vinChars.map((c,i)=><span key={i}>{c}</span>)}</div><form onSubmit={verify} className="verify-form"><label>Vehicle Identification Number<input aria-label="Vehicle Identification Number" value={vin} onChange={e => setVin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,17))} maxLength={17} /></label><button className="primary" disabled={loading}>{loading ? 'Checking…' : 'Verify VIN'} <Icon name="scan" size={17}/></button></form><div className="scanner-note"><Icon name="shield" size={16}/> Verification reads from the VIN master sheet. No source data is modified.</div></div>
      <div className="scanner-art"><VehicleGraphic compact/><div className="scan-line"/><span className="scan-tag">IDENTITY FRAME / 001</span></div>
    </section>
    {result && <section className="result-board"><div className="result-identity"><span className="result-label">Resolved vehicle</span><h3>{result.make} {result.model}</h3><p>{result.year} model year</p></div><div className="result-status"><span>Mapping status</span><b className={`status ${result.status.toLowerCase()}`}>{result.status}</b></div><div><span>VIN</span><b className="mono">{result.vin}</b></div><div><span>ESKA Make</span><b>{result.eskaMake ?? '—'}</b></div><div><span>ESKA Model</span><b>{result.eskaModel ?? '—'}</b></div></section>}
  </Shell>;
}

const moduleCopy: Record<string, { eyebrow: string; description: string; accent: string; items: string[] }> = {
  'VIN Master Sheet': { eyebrow:'04 — Source of truth', description:'Read-only consolidated view of every VIN make/model and its active ESKA mapping.', accent:'#2457f5', items:['All VIN models stay visible','Read-only by design','Filter, sort and export'] },
  'Mapping Management': { eyebrow:'05 — Mapping desk', description:'Create, edit, deactivate and reactivate VIN ↔ ESKA relationships with duplicate protection.', accent:'#39e0c4', items:['Duplicate guard','Soft delete workflow','Full audit ownership'] },
  'Unmapped Vehicles': { eyebrow:'06 — Exception queue', description:'Work the models that have no active ESKA mapping and close coverage gaps.', accent:'#ff744f', items:['118 open items','Prioritize by make','Create mapping in context'] },
  'Reports': { eyebrow:'07 — Coverage intelligence', description:'Coverage, unmapped, inactive and recent-change reporting for operational control.', accent:'#bdf34f', items:['Mapping coverage','Unmapped backlog','Change trends'] },
  'Audit Trail': { eyebrow:'08 — Governance', description:'Search every create, edit, deactivate and reactivate action by user, entity and date.', accent:'#a98cff', items:['Immutable history','User traceability','Entity-level search'] },
  'User Management': { eyebrow:'09 — Access control', description:'Manage ADMIN, MAPPING_MANAGER and VIEWER access for the internal operations team.', accent:'#f7c948', items:['Role-based access','Least privilege','Account status control'] }
};

function ModulePreview({ title }: { title: string }) {
  const m = moduleCopy[title];
  return <Shell><header className="page-head"><div><span className="chapter">{m.eyebrow}</span><h2>{title}</h2><p>{m.description}</p></div><span className="module-accent" style={{background:m.accent}}/></header><section className="module-preview"><div className="module-number" style={{color:m.accent}}>V1</div><div><span className="module-kicker">Module architecture</span><h3>{title}</h3><p>{m.description}</p><div className="module-features">{m.items.map((x,i)=><div key={x}><span style={{background:m.accent}}>{String(i+1).padStart(2,'0')}</span>{x}</div>)}</div></div><div className="module-wire"><div/><div/><div/><div/></div></section></Shell>;
}

function Protected({ children }: { children: ReactNode }) {
  return localStorage.getItem('vin-auth') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
    <Route path="/verify" element={<Protected><Verify /></Protected>} />
    <Route path="/master" element={<Protected><ModulePreview title="VIN Master Sheet" /></Protected>} />
    <Route path="/mappings" element={<Protected><ModulePreview title="Mapping Management" /></Protected>} />
    <Route path="/unmapped" element={<Protected><ModulePreview title="Unmapped Vehicles" /></Protected>} />
    <Route path="/reports" element={<Protected><ModulePreview title="Reports" /></Protected>} />
    <Route path="/audit" element={<Protected><ModulePreview title="Audit Trail" /></Protected>} />
    <Route path="/users" element={<Protected><ModulePreview title="User Management" /></Protected>} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
