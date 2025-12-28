
export type DocumentationType = 'SOAP' | 'SBAR' | 'ProgressNote' | 'ShiftSummary' | 'DischargeSummary';

export interface DocumentationResult {
  title: string;
  content: string;
  type: DocumentationType;
  timestamp: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  error: string | null;
  result: DocumentationResult | null;
}
