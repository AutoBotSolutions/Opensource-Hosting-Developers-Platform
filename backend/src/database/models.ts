// Database models and interfaces for the HostingCo application

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  company?: string;
  role: 'admin' | 'user' | 'support';
  permissions: string[];
  settings: UserSettings;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export interface UserSettings {
  personal: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    timezone: string;
    language: string;
  };
  notifications: {
    email: {
      billing: boolean;
      serverAlerts: boolean;
      maintenance: boolean;
      security: boolean;
      marketing: boolean;
    };
    push: {
      billing: boolean;
      serverAlerts: boolean;
      maintenance: boolean;
      security: boolean;
      marketing: boolean;
    };
    sms: {
      billing: boolean;
      serverAlerts: boolean;
      maintenance: boolean;
      security: boolean;
      marketing: boolean;
    };
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: string;
    ipWhitelist: string[];
    apiKeys: ApiKey[];
  };
  preferences: {
    theme: 'light' | 'dark';
    dateFormat: string;
    timeFormat: '12h' | '24h';
    currency: string;
    defaultPage: string;
  };
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  isActive: boolean;
}

export interface Server {
  id: string;
  name: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended' | 'stopped';
  location: string;
  ip: string;
  userId: string;
  specs: ServerSpecs;
  uptime: number;
  load: number[];
  createdAt: Date;
  updatedAt: Date;
  settings: ServerSettings;
  statistics: ServerStatistics;
}

export interface ServerSpecs {
  cpu: number;
  ram: string;
  storage: string;
  bandwidth: string;
}

export interface ServerSettings {
  hostname: string;
  firewall: boolean;
  backups: boolean;
  monitoring: boolean;
  ssl: boolean;
}

export interface ServerStatistics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  processes: number;
  connections: number;
}

export interface HostingPlan {
  id: string;
  name: string;
  type: 'shared' | 'vps' | 'dedicated';
  price: number;
  specs: ServerSpecs;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  number: string;
  userId: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  description: string;
  items: InvoiceItem[];
  billingAddress: BillingAddress;
  paymentMethod?: PaymentMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  description?: string;
}

export interface BillingAddress {
  name: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: 'credit_card' | 'bank_account' | 'paypal';
  isDefault: boolean;
  cardInfo?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  bankInfo?: {
    bankName: string;
    last4: string;
  };
  paypalInfo?: {
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  assignedTo?: string;
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  sender: 'user' | 'support';
  content: string;
  timestamp: Date;
  isInternal?: boolean;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'suspended';
  servers: string[];
  billing: ClientBilling;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientBilling {
  totalSpent: number;
  nextBillingDate: Date;
  paymentMethod?: string;
  billingCycle: 'monthly' | 'yearly';
}

export interface SystemSettings {
  general: {
    siteName: string;
    siteUrl: string;
    supportEmail: string;
    timezone: string;
    dateFormat: string;
    currency: string;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: string;
    sessionTimeout: string;
    passwordMinLength: number;
    require2FA: boolean;
  };
  notifications: {
    emailProvider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smsProvider: string;
    pushEnabled: boolean;
  };
  backup: {
    enabled: boolean;
    frequency: string;
    retentionDays: number;
    storageLocation: string;
  };
}

export interface BillingSettings {
  general: {
    currency: string;
    taxRate: number;
    lateFee: number;
    gracePeriod: number;
    billingCycle: string;
  };
  payment: {
    acceptedMethods: string[];
    autoPayEnabled: boolean;
    retryAttempts: number;
    retryInterval: string;
  };
  notifications: {
    invoiceSent: boolean;
    paymentReceived: boolean;
    paymentFailed: boolean;
    overdueReminder: boolean;
    subscriptionExpiring: boolean;
  };
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface DashboardStats {
  servers: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
  };
  clients: {
    total: number;
    active: number;
    new: number;
  };
  billing: {
    totalRevenue: number;
    pendingInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
  };
  support: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
  };
  recentActivity: ActivityLog[];
}

// Database operation interfaces
export interface DatabaseOperations {
  // User operations
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  getUserById(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Server operations
  createServer(server: Omit<Server, 'id' | 'createdAt' | 'updatedAt'>): Promise<Server>;
  getServerById(id: string): Promise<Server | null>;
  getServersByUserId(userId: string): Promise<Server[]>;
  updateServer(id: string, updates: Partial<Server>): Promise<Server>;
  deleteServer(id: string): Promise<void>;
  
  // Invoice operations
  createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice>;
  getInvoiceById(id: string): Promise<Invoice | null>;
  getInvoicesByUserId(userId: string): Promise<Invoice[]>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  
  // Support ticket operations
  createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket>;
  getTicketById(id: string): Promise<SupportTicket | null>;
  getTicketsByUserId(userId: string): Promise<SupportTicket[]>;
  updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket>;
  
  // Activity logging
  logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void>;
  getActivitiesByUserId(userId: string, limit?: number): Promise<ActivityLog[]>;
  
  // Settings operations
  getUserSettings(userId: string): Promise<UserSettings | null>;
  updateUserSettings(userId: string, settings: UserSettings): Promise<UserSettings>;
  getSystemSettings(): Promise<SystemSettings>;
  updateSystemSettings(settings: SystemSettings): Promise<SystemSettings>;
}
