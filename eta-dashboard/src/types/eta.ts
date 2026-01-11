export type ComparisonFlag =
  | "Similar"
  | "Underestimate"
  | "Overestimate";

export interface EtaRecord {
  runId: string;
  uid: string;
  city: string;

  mapplsETA: number;
  googleETA: number;
  oauth2RouteDuration?: number;

  etaDifference: number;
  comparisonFlag: ComparisonFlag;
  
  sourceType?: string;
  sourceName?: string;
}