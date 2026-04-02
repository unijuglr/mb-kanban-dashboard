/**
 * Agilitas Core Schemas - Ported from .NET Agilitas.Data
 * MB-047 Migration Track
 */

export enum TranscriptPartType {
  SystemPrompt = 'SystemPrompt',
  Agent = 'Agent',
  Customer = 'Customer'
}

export interface TranscriptPart {
  type: TranscriptPartType;
  text: string;
}

export interface TranscriptData {
  dateTime: Date | string;
  agent?: string | null;
  customer?: string | null;
  fullTranscript: string;
  customerTranscript: string;
  parts: TranscriptPart[];
}

export interface PainPointCategory {
  id: number;
  isPredefined: boolean | number;
  name: string;
  issues?: PainPointIssue[];
}

export interface PainPointIssue {
  id: number;
  isPredefined: boolean | number;
  name: string;
  categoryId: number;
  category?: PainPointCategory;
}
