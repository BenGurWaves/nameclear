export type CheckStatus = "available" | "taken" | "unknown";

export interface DomainResult {
  tld: string;
  domain: string;
  status: CheckStatus;
  registerUrl: string | null;
  note?: string;
}

export interface AlternativeDomain {
  domain: string;
  status: CheckStatus;
  registerUrl: string | null;
}

export interface TrademarkResult {
  serialNumber: string;
  mark: string;
  owner: string;
  status: string;
  statusDate: string | null;
  classes: string[];
  registrationNumber: string | null;
  exact: boolean;
  usptoUrl: string;
}

export interface SocialResult {
  platform: string;
  handle: string;
  url: string;
  status: CheckStatus;
  variant?: boolean;
  note?: string;
}

export interface DomainsPayload {
  name: string;
  results: DomainResult[];
  alternatives?: AlternativeDomain[];
}

export interface TrademarkPayload {
  name: string;
  conflictsFound: boolean;
  unavailable?: string;
  results: TrademarkResult[];
}

export interface SocialPayload {
  name: string;
  results: SocialResult[];
}

export type CheckPart = "domains" | "trademark" | "social";

export interface CheckResultsJson {
  domains?: DomainsPayload;
  trademark?: TrademarkPayload;
  social?: SocialPayload;
}
