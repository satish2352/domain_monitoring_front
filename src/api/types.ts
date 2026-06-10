export type Role = 'super_admin' | 'admin' | 'viewer';
export type HealthStatus = 'unknown' | 'up' | 'down' | 'warn';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  last_login_at: string | null;
  permissions: string[];
}

export interface Registrar {
  id: number;
  name: string;
  website: string | null;
  notes: string | null;
  created_at: string;
}

export interface Domain {
  id: number;
  domain_name: string;
  host_address: string | null;
  provider: string | null;
  registrar: string | null;
  domain_expiry: string | null;
  ssl_expiry: string | null;
  status: HealthStatus;
  monitoring_enabled: boolean;
  dkim_selectors: string | null;
  notes: string | null;
  last_checked: string | null;
  last_response_ms: number | null;
}

export interface Subdomain {
  id: number;
  domain_id: number;
  name: string;
  url: string | null;
  monitoring_enabled: boolean;
  last_status: HealthStatus;
  last_response_ms: number | null;
  ssl_expiry: string | null;
  last_checked: string | null;
}

export interface DomainDetail extends Domain {
  subdomains: Subdomain[];
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface ApiEndpoint {
  id: number;
  name: string;
  method: HttpMethod;
  url: string;
  headers: string | null;
  body: string | null;
  expected_status: number | null;
  expected_body: string | null;
  timeout_ms: number | null;
  monitoring_enabled: boolean;
  status: HealthStatus;
  last_status_code: number | null;
  last_response_ms: number | null;
  last_checked: string | null;
  notes: string | null;
}

export interface Alert {
  id: number;
  target_label: string | null;
  severity: 'info' | 'warning' | 'critical';
  type: string;
  message: string;
  resolved: boolean;
  created_at: string;
}

export interface MonitoringLog {
  id: number;
  target_label: string | null;
  check_type: string;
  status: HealthStatus;
  status_code: number | null;
  response_ms: number | null;
  message: string | null;
  created_at: string;
}

export interface DnsRecord {
  record_type: string;
  value: string;
  checked_at?: string;
}

export interface DashboardSummary {
  totals: { domains: number; subdomains: number; monitored: number };
  health: { up: number; down: number; warn: number };
  sslExpiringSoon: number;
  dnsIssues: number;
  openAlerts: number;
  avgResponseMs: number | null;
  uptimePct: number | null;
}
