import { FormEvent, useState } from 'react';
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
      <section className="auth-panel">
        <div className="eyebrow">Arabian Shield · Internal Operations</div>
        <h1>VIN Mapping System</h1>
        <p className="muted">Verify VIN data, maintain ESKA mappings, and monitor mapping coverage from one operational workspace.</p>
        <form onSubmit={submit} className="form-stack">
          <label>Username<input value={username} onChange={e => setUsername(e.target.value)} /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>
          <button className="primary" type="submit">Sign in</button>
        </form>
      </section>
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">VIN Mapping</div>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/verify">Vehicle Verification</NavLink>
          <NavLink to="/master">VIN Master Sheet</NavLink>
          <NavLink to="/mappings">Mapping Management</NavLink>
          <NavLink to="/unmapped">Unmapped Vehicles</NavLink>
          <NavLink to="/reports">Reports</NavLink>
          <NavLink to="/audit">Audit Trail</NavLink>
        </nav>
        <button className="ghost" onClick={() => { localStorage.removeItem('vin-auth'); navigate('/login'); }}>Sign out</button>
      </aside>
      <section className="workspace">{children}</section>
    </div>
  );
}

function Dashboard() {
  const metrics = [
    ['Total Models', '1,842'],
    ['Active Mappings', '1,706'],
    ['Unmapped', '118'],
    ['Coverage', '92.6%']
  ];
  return <Shell><header className="page-head"><div><div className="eyebrow">Operational overview</div><h2>Dashboard</h2></div><span className="status mapped">System healthy</span></header><div className="metric-grid">{metrics.map(([k,v]) => <article className="metric" key={k}><span>{k}</span><strong>{v}</strong></article>)}</div><section className="panel"><div className="panel-head"><h3>Recent mapping activity</h3><span className="muted">Latest changes</span></div><div className="empty-state">Audit feed will be connected to Oracle in the next milestone.</div></section></Shell>;
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
    } finally {
      setLoading(false);
    }
  };

  return <Shell><header className="page-head"><div><div className="eyebrow">VIN workflow</div><h2>Vehicle Verification</h2></div></header><section className="panel verify-panel"><form onSubmit={verify} className="verify-form"><label>Vehicle Identification Number<input value={vin} onChange={e => setVin(e.target.value.toUpperCase())} maxLength={17} /></label><button className="primary" disabled={loading}>{loading ? 'Checking…' : 'Verify VIN'}</button></form>{result && <div className="result-grid"><div><span className="muted">VIN</span><strong>{result.vin}</strong></div><div><span className="muted">Vehicle</span><strong>{result.make} · {result.model} · {result.year}</strong></div><div><span className="muted">Status</span><span className={`status ${result.status.toLowerCase()}`}>{result.status}</span></div><div><span className="muted">ESKA mapping</span><strong>{result.eskaMake ?? '—'} / {result.eskaModel ?? '—'}</strong></div></div>}</section></Shell>;
}

function Placeholder({ title }: { title: string }) { return <Shell><header className="page-head"><div><div className="eyebrow">VIN Mapping System</div><h2>{title}</h2></div></header><section className="panel"><div className="empty-state">Module scaffolded. Data integration follows in V1.1.</div></section></Shell>; }

function Protected({ children }: { children: React.ReactNode }) {
  return localStorage.getItem('vin-auth') ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
    <Route path="/verify" element={<Protected><Verify /></Protected>} />
    <Route path="/master" element={<Protected><Placeholder title="VIN Master Sheet" /></Protected>} />
    <Route path="/mappings" element={<Protected><Placeholder title="Mapping Management" /></Protected>} />
    <Route path="/unmapped" element={<Protected><Placeholder title="Unmapped Vehicles" /></Protected>} />
    <Route path="/reports" element={<Protected><Placeholder title="Reports" /></Protected>} />
    <Route path="/audit" element={<Protected><Placeholder title="Audit Trail" /></Protected>} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
