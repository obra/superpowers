import { applyPatch, type Operation } from 'rfc6902';

export function applyUpsertPatch(target: object, ops: Operation[]): void {
  ops.forEach((op) => {
    const [error] = applyPatch(target, [op]);

    if (op.op === 'replace' && error?.name === 'MissingError') {
      applyPatch(target, [{ ...op, op: 'add' }]);
    }
  });
}
