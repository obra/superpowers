import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';

export const projectSearchSchema = z.object({
  statusId: z.string().optional(),
  priority: z.string().optional(),
  assignees: z.string().optional(),
  parentIssueId: z.string().optional(),
  mode: z.string().optional(),
  orgId: z.string().optional(),
});

export type ProjectSearch = z.infer<typeof projectSearchSchema>;

export const projectSearchValidator = zodValidator(projectSearchSchema);
