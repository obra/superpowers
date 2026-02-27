import React from 'react';
import { useLocation } from '@tanstack/react-router';

function getProjectIdFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  const projectIndex = segments.indexOf('projects');
  if (projectIndex === -1) {
    return 'unknown';
  }

  return segments[projectIndex + 1] ?? 'unknown';
}

export function ProjectFallbackPage() {
  const pathname = useLocation({
    select: (location) => location.pathname,
  });
  const projectId = getProjectIdFromPathname(pathname);

  return React.createElement(
    'div',
    { className: 'mx-auto min-h-screen w-full max-w-5xl px-double py-double' },
    React.createElement(
      'h1',
      { className: 'text-2xl font-semibold text-high' },
      'Project'
    ),
    React.createElement(
      'p',
      { className: 'mt-base text-normal' },
      `Project ID: ${projectId}`
    )
  );
}

export default ProjectFallbackPage;
