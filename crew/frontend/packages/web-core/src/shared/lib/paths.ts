export const paths = {
  projects: () => '/workspaces',
  projectTasks: (projectId: string) => `/projects/${projectId}`,
  task: (projectId: string, taskId: string) => {
    void taskId;
    return `/projects/${projectId}`;
  },
  attempt: (projectId: string, taskId: string, attemptId: string) => {
    void taskId;
    void attemptId;
    return `/projects/${projectId}`;
  },
  attemptFull: (projectId: string, taskId: string, attemptId: string) => {
    void taskId;
    void attemptId;
    return `/projects/${projectId}`;
  },
};
