/**
 * Represents which side of a diff (old/deletions or new/additions).
 * This matches the SplitSide enum from @git-diff-view/react (Old=0, New=1)
 * but allows us to decouple from that library.
 */
export enum DiffSide {
  Old = 0,
  New = 1,
}
