import { useMutation } from '@tanstack/react-query';
import { approvalsApi } from '@/shared/lib/api';
import type { QuestionAnswer } from 'shared/types';

interface ApproveParams {
  approvalId: string;
  executionProcessId: string;
}

interface DenyParams extends ApproveParams {
  reason?: string;
}

interface AnswerParams extends ApproveParams {
  answers: QuestionAnswer[];
}

export function useApprovalMutation() {
  const approveMutation = useMutation({
    mutationFn: ({ approvalId, executionProcessId }: ApproveParams) =>
      approvalsApi.respond(approvalId, {
        execution_process_id: executionProcessId,
        status: { status: 'approved' },
      }),
    onError: (err) => {
      console.error('Failed to approve:', err);
    },
  });

  const denyMutation = useMutation({
    mutationFn: ({ approvalId, executionProcessId, reason }: DenyParams) =>
      approvalsApi.respond(approvalId, {
        execution_process_id: executionProcessId,
        status: {
          status: 'denied',
          reason: reason || 'User denied this request.',
        },
      }),
    onError: (err) => {
      console.error('Failed to deny:', err);
    },
  });

  const answerMutation = useMutation({
    mutationFn: ({ approvalId, executionProcessId, answers }: AnswerParams) =>
      approvalsApi.respond(approvalId, {
        execution_process_id: executionProcessId,
        status: { status: 'answered', answers },
      }),
    onError: (err) => {
      console.error('Failed to answer:', err);
    },
  });

  return {
    approve: approveMutation.mutate,
    approveAsync: approveMutation.mutateAsync,
    deny: denyMutation.mutate,
    denyAsync: denyMutation.mutateAsync,
    answer: answerMutation.mutate,
    answerAsync: answerMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    isDenying: denyMutation.isPending,
    isAnswering: answerMutation.isPending,
    isResponding:
      approveMutation.isPending ||
      denyMutation.isPending ||
      answerMutation.isPending,
    approveError: approveMutation.error,
    denyError: denyMutation.error,
    answerError: answerMutation.error,
    reset: () => {
      approveMutation.reset();
      denyMutation.reset();
      answerMutation.reset();
    },
  };
}
