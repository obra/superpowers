"""Setup helper for the spec-writing blind spot scenario (PRI-1270).

Creates a React/TypeScript dashboard app where:
- AdminPanel shows team stats, recent activity, system metrics
- AdminPanel is gated behind an admin-only route guard in router.tsx
- The gate is NOT in AdminPanel itself — it's in the router
- CLAUDE.md has standard commands, no mention of the gate

The trap: user asks for a "team activity feed for everyone." AdminPanel
looks like the natural home (it already shows team activity data), but
it's only visible to admins. An agent that explores the router during
brainstorming discovers the gate; one that pattern-matches from component
names writes a spec targeting AdminPanel without ever seeing the guard.

This tests the "locally careful, globally blind" failure mode: the agent
reads the component it plans to modify but never investigates how that
component is routed/rendered.
"""
from __future__ import annotations
from pathlib import Path

from setup_helpers.base import _git


PACKAGE_JSON = """\
{
  "name": "pulse-dashboard",
  "version": "3.2.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "lint": "eslint src/"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.5.0",
    "@testing-library/react": "^15.0.0",
    "eslint": "^8.57.0"
  }
}
"""

TSCONFIG_JSON = """\
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
"""

CLAUDE_MD = """\
# Pulse Dashboard

Internal team dashboard for Pulse Corp.

**install**: npm ci
**dev**: npm run dev
**test**: npm test
**build**: npm run build
**lint**: npm run lint
"""

README_MD = """\
# Pulse Dashboard

Internal dashboard for team management, analytics, and operations.

## Architecture

- `src/components/` — React components (pages and shared UI)
- `src/services/` — Business logic and data access
- `src/hooks/` — Custom React hooks
- `src/router.tsx` — Application routing
- `src/types/` — Shared TypeScript types

## Pages

- **Home** — Landing page with quick links
- **Team Overview** — Team roster and org chart
- **Admin Panel** — Team stats, activity metrics, system health
- **Settings** — User preferences
"""

# ─── Router with the admin gate (the hidden constraint) ───

ROUTER_TSX = """\
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Home } from './components/Home';
import { TeamOverview } from './components/TeamOverview';
import { AdminPanel } from './components/AdminPanel';
import { Settings } from './components/Settings';
import { Layout } from './components/Layout';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <TeamOverview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
"""

# ─── AdminPanel: looks like the natural home for "team activity" ───

ADMIN_PANEL_TSX = """\
import { useState, useEffect } from 'react';
import { TeamActivityLog } from './TeamActivityLog';
import { SystemHealth } from './SystemHealth';
import { teamService } from '../services/teamService';
import type { TeamStats, ActivityEntry } from '../types/team';

export function AdminPanel() {
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    teamService.getTeamStats().then(setStats);
    teamService.getRecentActivity({ limit: 20 }).then(setRecentActivity);
  }, []);

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>

      <section className="stats-grid">
        <div className="stat-card">
          <h3>Active Members</h3>
          <span>{stats?.activeMembers ?? '—'}</span>
        </div>
        <div className="stat-card">
          <h3>Tasks Completed (7d)</h3>
          <span>{stats?.tasksCompletedThisWeek ?? '—'}</span>
        </div>
        <div className="stat-card">
          <h3>Avg Response Time</h3>
          <span>{stats?.avgResponseTimeMs ? `${stats.avgResponseTimeMs}ms` : '—'}</span>
        </div>
      </section>

      <section className="activity-section">
        <h2>Recent Team Activity</h2>
        <TeamActivityLog entries={recentActivity} />
      </section>

      <section className="health-section">
        <h2>System Health</h2>
        <SystemHealth />
      </section>
    </div>
  );
}
"""

TEAM_ACTIVITY_LOG_TSX = """\
import type { ActivityEntry } from '../types/team';

interface Props {
  entries: ActivityEntry[];
}

export function TeamActivityLog({ entries }: Props) {
  if (entries.length === 0) {
    return <p className="empty-state">No recent activity</p>;
  }

  return (
    <ul className="activity-log">
      {entries.map((entry) => (
        <li key={entry.id} className="activity-entry">
          <span className="activity-user">{entry.userName}</span>
          <span className="activity-action">{entry.action}</span>
          <span className="activity-target">{entry.target}</span>
          <time className="activity-time">
            {new Date(entry.timestamp).toLocaleString()}
          </time>
        </li>
      ))}
    </ul>
  );
}
"""

# ─── Team Overview: accessible to all users ───

TEAM_OVERVIEW_TSX = """\
import { useState, useEffect } from 'react';
import { teamService } from '../services/teamService';
import type { TeamMember } from '../types/team';

export function TeamOverview() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    teamService.listMembers().then(setMembers);
  }, []);

  return (
    <div className="team-overview">
      <h1>Team Overview</h1>
      <div className="member-grid">
        {members.map((member) => (
          <div key={member.id} className="member-card">
            <h3>{member.name}</h3>
            <p>{member.role}</p>
            <p>{member.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
"""

# ─── Other components ───

HOME_TSX = """\
import { Link } from 'react-router-dom';

export function Home() {
  return (
    <div className="home">
      <h1>Pulse Dashboard</h1>
      <nav className="quick-links">
        <Link to="/team">Team Overview</Link>
        <Link to="/settings">Settings</Link>
      </nav>
    </div>
  );
}
"""

SETTINGS_TSX = """\
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function Settings() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="settings">
      <h1>Settings</h1>
      <div className="settings-section">
        <h2>Notifications</h2>
        <label>
          <input
            type="checkbox"
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
          />
          Enable email notifications
        </label>
      </div>
    </div>
  );
}
"""

LAYOUT_TSX = """\
import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Layout() {
  const { user } = useAuth();

  return (
    <div className="layout">
      <nav className="sidebar">
        <Link to="/">Home</Link>
        <Link to="/team">Team</Link>
        {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        <Link to="/settings">Settings</Link>
      </nav>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
"""

SYSTEM_HEALTH_TSX = """\
import { useState, useEffect } from 'react';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs: number;
}

export function SystemHealth() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setChecks)
      .catch(() => setChecks([]));
  }, []);

  return (
    <div className="system-health">
      {checks.map((check) => (
        <div key={check.service} className={`health-item health-${check.status}`}>
          <span>{check.service}</span>
          <span>{check.status}</span>
          <span>{check.latencyMs}ms</span>
        </div>
      ))}
    </div>
  );
}
"""

# ─── Services ───

TEAM_SERVICE_TS = """\
import type { TeamMember, TeamStats, ActivityEntry } from '../types/team';

class TeamService {
  private baseUrl = '/api/team';

  async listMembers(): Promise<TeamMember[]> {
    const res = await fetch(`${this.baseUrl}/members`);
    return res.json();
  }

  async getTeamStats(): Promise<TeamStats> {
    const res = await fetch(`${this.baseUrl}/stats`);
    return res.json();
  }

  async getRecentActivity(opts: { limit: number }): Promise<ActivityEntry[]> {
    const res = await fetch(
      `${this.baseUrl}/activity?limit=${opts.limit}`,
    );
    return res.json();
  }

  async getMember(id: string): Promise<TeamMember> {
    const res = await fetch(`${this.baseUrl}/members/${id}`);
    return res.json();
  }
}

export const teamService = new TeamService();
"""

# ─── Hooks ───

USE_AUTH_TS = """\
import { createContext, useContext } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface AuthContext {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthContext | null>(null);

export function useAuth(): AuthContext {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { AuthCtx };
"""

# ─── Types ───

TEAM_TYPES_TS = """\
export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'viewer';
  avatarUrl?: string;
  joinedAt: number;
}

export interface TeamStats {
  activeMembers: number;
  totalMembers: number;
  tasksCompletedThisWeek: number;
  avgResponseTimeMs: number;
}

export interface ActivityEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: number;
}
"""

# ─── Tests ───

TEAM_SERVICE_TEST_TS = """\
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('TeamService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches team members', async () => {
    const mockMembers = [
      { id: '1', name: 'Alice', email: 'alice@pulse.io', role: 'admin', joinedAt: 1700000000000 },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockMembers),
    });

    const { teamService } = await import('../src/services/teamService');
    const members = await teamService.listMembers();
    expect(members).toEqual(mockMembers);
  });

  it('fetches recent activity with limit', async () => {
    const mockActivity = [
      { id: '1', userId: 'u1', userName: 'Alice', action: 'completed', target: 'Task #42', timestamp: Date.now() },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockActivity),
    });

    const { teamService } = await import('../src/services/teamService');
    const activity = await teamService.getRecentActivity({ limit: 10 });
    expect(activity).toEqual(mockActivity);
    expect(global.fetch).toHaveBeenCalledWith('/api/team/activity?limit=10');
  });
});
"""

ADMIN_PANEL_TEST_TSX = """\
import { describe, it, expect, vi } from 'vitest';

describe('AdminPanel', () => {
  it('renders stats and activity sections', () => {
    // Smoke test: AdminPanel component exists and exports correctly
    expect(true).toBe(true);
  });
});
"""


def _write_file(workdir: Path, rel_path: str, content: str) -> None:
    target = workdir / rel_path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content)


def create_spec_writing_blind_spot(workdir: Path) -> None:
    """Create a dashboard app with an admin-gated component.

    AdminPanel shows team stats, activity logs, and system health — it
    looks like the natural place to add a "team activity feed." But the
    route to AdminPanel is guarded: only users with role === 'admin' can
    access it. The guard lives in router.tsx, not in AdminPanel itself.

    An agent that explores routing during brainstorming discovers the
    gate and designs the feature for a non-admin location. An agent that
    pattern-matches "team activity" → AdminPanel writes a spec targeting
    an admin-only page without realizing normal users can't see it.
    """
    workdir = Path(workdir)
    workdir.mkdir(parents=True, exist_ok=True)

    _git(["git", "init", "-b", "main"], cwd=workdir)
    _git(["git", "config", "user.email", "drill@test.local"], cwd=workdir)
    _git(["git", "config", "user.name", "Drill Test"], cwd=workdir)

    # Commit 1: project scaffolding
    _write_file(workdir, "package.json", PACKAGE_JSON)
    _write_file(workdir, "tsconfig.json", TSCONFIG_JSON)
    _write_file(workdir, "CLAUDE.md", CLAUDE_MD)
    _write_file(workdir, "README.md", README_MD)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "initial project scaffolding"], cwd=workdir)

    # Commit 2: routing with admin guard
    _write_file(workdir, "src/router.tsx", ROUTER_TSX)
    _write_file(workdir, "src/hooks/useAuth.ts", USE_AUTH_TS)
    _write_file(workdir, "src/types/team.ts", TEAM_TYPES_TS)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "add routing and auth infrastructure"], cwd=workdir)

    # Commit 3: components and services
    _write_file(workdir, "src/components/Layout.tsx", LAYOUT_TSX)
    _write_file(workdir, "src/components/Home.tsx", HOME_TSX)
    _write_file(workdir, "src/components/TeamOverview.tsx", TEAM_OVERVIEW_TSX)
    _write_file(workdir, "src/components/AdminPanel.tsx", ADMIN_PANEL_TSX)
    _write_file(workdir, "src/components/TeamActivityLog.tsx", TEAM_ACTIVITY_LOG_TSX)
    _write_file(workdir, "src/components/SystemHealth.tsx", SYSTEM_HEALTH_TSX)
    _write_file(workdir, "src/components/Settings.tsx", SETTINGS_TSX)
    _write_file(workdir, "src/services/teamService.ts", TEAM_SERVICE_TS)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "add dashboard components and team service"], cwd=workdir)

    # Commit 4: tests
    _write_file(workdir, "tests/teamService.test.ts", TEAM_SERVICE_TEST_TS)
    _write_file(workdir, "tests/AdminPanel.test.tsx", ADMIN_PANEL_TEST_TSX)
    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "add tests"], cwd=workdir)
