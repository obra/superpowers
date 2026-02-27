import { useQuery } from '@tanstack/react-query';
import { organizationsApi } from '@/shared/lib/api';
import type { OrganizationMemberWithProfile } from 'shared/types';
import { organizationKeys } from '@/shared/hooks/organizationKeys';

export function useOrganizationMembers(organizationId?: string) {
  return useQuery<OrganizationMemberWithProfile[]>({
    queryKey: organizationKeys.members(organizationId ?? ''),
    queryFn: () => {
      if (!organizationId) {
        throw new Error('No organization ID available');
      }
      return organizationsApi.getMembers(organizationId);
    },
    enabled: Boolean(organizationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
