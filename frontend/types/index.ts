/** Shared frontend types — align with API DTOs as features land. */
export type SubmissionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'POSTED'
  | 'HIDDEN';

export interface AdminInfo {
  id: string;
  email: string;
  role: string;
}
