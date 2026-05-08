export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface Server {
  id: string;
  name: string;
  type: 'shared' | 'vps' | 'dedicated';
  status: 'active' | 'inactive' | 'suspended';
  specs: {
    cpu: number;
    ram: number;
    storage: number;
    bandwidth: string;
  };
  price: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode?: number;
  };
}
