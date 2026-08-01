export type DocumentType = 'receipt' | 'bill' | 'business_card' | 'handwritten_note' | 'other';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface DynamicField {
  key: string;
  label: string;
  value: string;
}

export interface ExtractedDocumentData {
  document_type: DocumentType;
  document_title?: string | null;
  vendor_or_sender: string | null;
  date: string | null;
  amount: number | null;
  currency: string | null;
  due_date: string | null;
  category: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  note_summary: string | null;
  dynamic_fields?: DynamicField[];
  raw_text: string;
  confidence: ConfidenceLevel;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  plan?: 'free' | 'pro' | 'enterprise';
  workspaceOwnerEmail?: string;
  workspaceRole?: string;
  isWorkspaceMember?: boolean;
  tempPassword?: string;
}

export interface ExtractionRecord {
  id: string;
  userId?: string;
  fileName: string;
  fileSize?: number;
  imageUrl: string;
  timestamp: string;
  data: ExtractedDocumentData;
  userNotes?: string;
  isSharedWithTeam?: boolean;
}
