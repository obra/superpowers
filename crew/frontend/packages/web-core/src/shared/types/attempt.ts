import type { Workspace, Session } from 'shared/types';

/**
 * WorkspaceWithSession includes the latest Session for the workspace.
 * Provides access to session.id, session.executor, etc.
 */
export type WorkspaceWithSession = Workspace & {
  session: Session | undefined;
};

/**
 * Create a WorkspaceWithSession from a Workspace and Session.
 */
export function createWorkspaceWithSession(
  workspace: Workspace,
  session: Session | undefined
): WorkspaceWithSession {
  return {
    ...workspace,
    session,
  };
}
