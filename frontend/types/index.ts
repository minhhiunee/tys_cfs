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

export interface Media {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  storageKey: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface Submission {
  id: string;
  content: string;
  status: SubmissionStatus;
  createdAt: string;
  socialCaption?: string | null;
  moderationNote?: string | null;
  media: Media[];
}

