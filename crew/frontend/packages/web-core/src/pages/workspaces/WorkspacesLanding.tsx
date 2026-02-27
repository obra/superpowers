import { Navigate } from '@tanstack/react-router';

export function WorkspacesLanding() {
  return <Navigate to="/workspaces/create" replace />;
}
