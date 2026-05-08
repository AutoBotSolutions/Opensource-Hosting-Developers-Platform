# Development Guide

This comprehensive guide covers development best practices, coding standards, and workflows for the HostingCo system.

## Development Environment Setup

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL 15+
- Redis 7+
- Git
- VS Code (recommended)

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/your-org/hostingco-system.git
cd hostingco-system
```

#### 2. Install Dependencies
```bash
# Use the automated setup script (recommended)
./scripts/setup.sh development

# Or install manually
npm run install:all

# Or install individually
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../shared && npm install
```

#### 3. Environment Configuration
```bash
# The setup script automatically creates environment files
./scripts/setup.sh development --skip-deps

# Or create manually
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit configuration
nano .env
nano backend/.env
nano frontend/.env
```

#### 4. Database Setup
```bash
# Use automated database setup (recommended)
./scripts/db-migrate.sh development
./scripts/db-seed.sh development

# Or set up manually
# Create test database
createdb hostingco_test

# Run migrations
cd backend
npm run migrate

# Seed database
npm run seed
```

#### 5. Start Development Servers
```bash
# Use automated development startup (recommended)
./scripts/dev.sh

# Or start with individual scripts
./scripts/dev-backend.sh    # Backend on port 3003
./scripts/dev-frontend.sh   # Frontend on port 3000

# Or use npm scripts
npm run dev

# Or start individually with npm
npm run dev:backend  # Backend on port 3003
npm run dev:frontend # Frontend on port 3000
```

## 📁 Project Structure

```
hostingco-system/
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utility functions
│   │   └── types/           # TypeScript types
│   ├── migrations/          # Database migrations
│   ├── seeds/               # Database seeds
│   ├── tests/               # Test files
│   └── package.json
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   ├── tests/               # Test files
│   └── package.json
├── shared/                  # Shared code
│   ├── src/
│   │   ├── types/           # Shared types
│   │   ├── constants/       # Shared constants
│   │   └── utils/           # Shared utilities
│   └── package.json
├── scripts/                 # Automation and utility scripts
│   ├── db-*.sh             # Database management scripts
│   ├── dev-*.sh            # Development server scripts
│   ├── build.sh            # Build automation
│   ├── deploy.sh           # Deployment automation
│   ├── test-*.sh           # Testing automation
│   ├── docker-*.sh         # Docker utilities
│   ├── clean.sh            # Cleanup utilities
│   ├── setup.sh            # Initial setup
│   └── health-check.sh     # Health monitoring
├── docs/                    # Documentation
├── docker-compose.yml      # Docker configuration
└── package.json            # Root package.json
```

## 📝 Coding Standards

### TypeScript Standards

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

// Use enums for fixed sets of values
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  SUPPORT = 'support',
  USER = 'user',
  READ_ONLY = 'read_only'
}

// Use generic types for reusable components
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}
```

#### Function Typing
```typescript
// Use explicit function signatures
const createUser = async (
  userData: CreateUserRequest
): Promise<User> => {
  // Implementation
};

// Use generic functions for reusable logic
const findById = <T>(
  id: string,
  repository: Repository<T>
): Promise<T | null> => {
  return repository.findById(id);
};
```

#### Error Handling
```typescript
// Use custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Use Result pattern for operations that can fail
type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

const safeParseJson = <T>(json: string): Result<T> => {
  try {
    const data = JSON.parse(json);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
};
```

### Naming Conventions

#### Files and Directories
- Use kebab-case for files: `user-service.ts`
- Use PascalCase for React components: `UserCard.tsx`
- Use camelCase for variables and functions: `userName`
- Use PascalCase for classes and interfaces: `UserService`
- Use UPPER_SNAKE_CASE for constants: `MAX_FILE_SIZE`

#### Variables and Functions
```typescript
// Good naming
const maxRetryAttempts = 3;
const getUserById = async (userId: string): Promise<User> => {
  // Implementation
};

// Bad naming
const x = 3;
const getData = async (id: string) => {
  // Implementation
};
```

#### Components and Hooks
```typescript
// Component naming
const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      <button onClick={() => onEdit(user)}>Edit</button>
    </div>
  );
};

// Hook naming
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  // Implementation
  return { user, login, logout };
};
```

### Code Organization

#### Single Responsibility Principle
```typescript
// Good: Each function has one responsibility
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const createUser = async (userData: CreateUserRequest): Promise<User> => {
  if (!validateEmail(userData.email)) {
    throw new ValidationError('Invalid email format', 'email', userData.email);
  }
  // Implementation
};

// Bad: One function doing multiple things
const createAndValidateUser = async (userData: CreateUserRequest): Promise<User> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    throw new ValidationError('Invalid email format');
  }
  // Implementation
};
```

#### Dependency Injection
```typescript
// Use dependency injection for testability
interface UserRepository {
  findById(id: string): Promise<User | null>;
  create(userData: CreateUserRequest): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

class UserService {
  constructor(private userRepository: UserRepository) {}
  
  async getUser(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}

// Test with mock repository
const mockRepository: UserRepository = {
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
};
const userService = new UserService(mockRepository);
```

## Backend Development

### API Development

#### Route Structure
```typescript
// routes/users.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { userController } from '../controllers/userController';
import { createUserSchema, updateUserSchema } from '../schemas/userSchemas';

const router = express.Router();

// GET /api/users
router.get('/', authenticateToken, userController.getUsers);

// GET /api/users/:id
router.get('/:id', authenticateToken, userController.getUserById);

// POST /api/users
router.post(
  '/',
  authenticateToken,
  validateRequest(createUserSchema),
  userController.createUser
);

// PUT /api/users/:id
router.put(
  '/:id',
  authenticateToken,
  validateRequest(updateUserSchema),
  userController.updateUser
);

export default router;
```

#### Controller Pattern
```typescript
// controllers/userController.ts
import { Request, Response } from 'express';
import { userService } from '../services/userService';
import { ApiResponse } from '../types/api';

export const userController = {
  getUsers: async (req: Request, res: Response) => {
    try {
      const users = await userService.getUsers(req.query);
      const response: ApiResponse<User[]> = {
        success: true,
        data: users,
        timestamp: new Date().toISOString()
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        },
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
};
```

#### Service Layer
```typescript
// services/userService.ts
import { User, CreateUserRequest } from '../types/user';
import { userRepository } from '../repositories/userRepository';
import { passwordService } from '../services/passwordService';
import { emailService } from '../services/emailService';

export class UserService {
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Validate email uniqueness
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ValidationError('Email already exists', 'email', userData.email);
    }
    
    // Hash password
    const passwordHash = await passwordService.hash(userData.password);
    
    // Create user
    const user = await userRepository.create({
      ...userData,
      passwordHash,
      isActive: false,
      emailVerified: false
    });
    
    // Send verification email
    await emailService.sendVerificationEmail(user);
    
    return user;
  }
  
  async getUsers(filters: UserFilters): Promise<PaginatedResult<User>> {
    return userRepository.findMany(filters);
  }
}

export const userService = new UserService();
```

#### Validation
```typescript
// schemas/userSchemas.ts
import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
  company: Joi.string().max(100).optional(),
  role: Joi.string().valid('user', 'admin', 'support').default('user')
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s\-\(\)]+$/).optional(),
  company: Joi.string().max(100).optional(),
  isActive: Joi.boolean().optional()
});
```

### Database Operations

#### Repository Pattern
```typescript
// repositories/userRepository.ts
import { knex } from '../database/database';
import { User, CreateUserRequest } from '../types/user';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    const result = await knex('users').where({ id }).first();
    return result || null;
  }
  
  async findByEmail(email: string): Promise<User | null> {
    const result = await knex('users').where({ email }).first();
    return result || null;
  }
  
  async create(userData: CreateUserRequest): Promise<User> {
    const [user] = await knex('users')
      .insert({
        ...userData,
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      })
      .returning('*');
    
    return user;
  }
  
  async update(id: string, data: Partial<User>): Promise<User> {
    const [user] = await knex('users')
      .where({ id })
      .update({
        ...data,
        updatedAt: new Date()
      })
      .returning('*');
    
    return user;
  }
  
  async findMany(filters: UserFilters): Promise<PaginatedResult<User>> {
    const query = knex('users');
    
    if (filters.search) {
      query.where(function() {
        this.where('name', 'ilike', `%${filters.search}%`)
          .orWhere('email', 'ilike', `%${filters.search}%`);
      });
    }
    
    if (filters.role) {
      query.where('role', filters.role);
    }
    
    if (filters.isActive !== undefined) {
      query.where('is_active', filters.isActive);
    }
    
    const total = await query.clone().count('* as total').first();
    const users = await query
      .limit(filters.limit || 20)
      .offset((filters.page || 1 - 1) * (filters.limit || 20))
      .orderBy('created_at', 'desc');
    
    return {
      items: users,
      total: parseInt(total.total),
      page: filters.page || 1,
      limit: filters.limit || 20
    };
  }
}

export const userRepository = new UserRepository();
```

#### Database Transactions
```typescript
// services/transactionService.ts
import { knex } from '../database/database';

export class TransactionService {
  async transferOwnership(serverId: string, newUserId: string): Promise<void> {
    await knex.transaction(async (trx) => {
      // Update server ownership
      await trx('servers')
        .where({ id: serverId })
        .update({ user_id: newUserId });
      
      // Log activity
      await trx('activity_logs').insert({
        action: 'server_ownership_transferred',
        resource: 'server',
        resource_id: serverId,
        details: { newUserId },
        timestamp: new Date()
      });
      
      // Send notification
      await this.sendOwnershipNotification(serverId, newUserId);
    });
  }
}
```

## 🎨 Frontend Development

### Component Development

#### Component Structure
```typescript
// components/UserCard.tsx
import React from 'react';
import { User } from '../types/user';

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  className?: string;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  onDelete,
  className = ''
}) => {
  return (
    <div className={`user-card ${className}`}>
      <div className="user-card__header">
        <h3 className="user-card__name">{user.name}</h3>
        <span className={`user-card__status user-card__status--${user.isActive ? 'active' : 'inactive'}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <div className="user-card__body">
        <p className="user-card__email">{user.email}</p>
        <p className="user-card__role">{user.role}</p>
        {user.company && (
          <p className="user-card__company">{user.company}</p>
        )}
      </div>
      
      <div className="user-card__actions">
        {onEdit && (
          <button
            onClick={() => onEdit(user)}
            className="user-card__button user-card__button--edit"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(user)}
            className="user-card__button user-card__button--delete"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
```

#### Custom Hooks
```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react';
import { ApiResponse } from '../types/api';

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const useApi = <T>(
  url: string,
  options: UseApiOptions<T> = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const execute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      const result: ApiResponse<T> = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        options.onSuccess?.(result.data);
      } else {
        throw new Error(result.error?.message || 'Request failed');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, []);
  
  return { data, loading, error, execute };
};
```

#### State Management
```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/user';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          const result = await response.json();
          
          if (result.success) {
            set({
              user: result.data.user,
              token: result.data.token,
              isAuthenticated: true
            });
          } else {
            throw new Error(result.error?.message || 'Login failed');
          }
        } catch (error) {
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      setUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user, token: state.token })
    }
  )
);
```

## Testing

### Unit Testing

#### Backend Testing
```typescript
// test/services/userService.test.ts
import { UserService } from '../../src/services/userService';
import { userRepository } from '../../src/repositories/userRepository';
import { ValidationError } from '../../src/utils/errors';

jest.mock('../../src/repositories/userRepository');
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;

describe('UserService', () => {
  let userService: UserService;
  
  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });
  
  describe('createUser', () => {
    it('should create user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue({
        id: 'user_123',
        ...userData,
        isActive: false,
        emailVerified: false,
        createdAt: new Date()
      });
      
      const result = await userService.createUser(userData);
      
      expect(result.email).toBe(userData.email);
      expect(result.isActive).toBe(false);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.create).toHaveBeenCalled();
    });
    
    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      const existingUser = { id: 'user_123', email: userData.email };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser);
      
      await expect(userService.createUser(userData)).rejects.toThrow(ValidationError);
    });
  });
});
```

#### Frontend Testing
```typescript
// components/__tests__/UserCard.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from '../UserCard';
import { User } from '../../types/user';

const mockUser: User = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  isActive: true,
  createdAt: '2026-05-08T03:14:24.942Z'
};

describe('UserCard', () => {
  it('renders user information', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
  
  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByText('Edit'));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });
});
```

## Git Workflow

### Branch Strategy

#### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical fixes

#### Commit Convention
```bash
# Format: <type>(<scope>): <description>

# Types
feat: New feature
fix: Bug fix
docs: Documentation
style: Code style
refactor: Code refactoring
test: Test
chore: Maintenance

# Examples
feat(auth): Add two-factor authentication
fix(api): Handle null values in user service
docs(readme): Update installation instructions
```

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
```

## Development Tools

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-jest",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-docker"
  ]
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd backend && npm run build",
    "build:frontend": "cd frontend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "test:watch": "npm run test:backend -- --watch & npm run test:frontend -- --watch",
    "lint": "npm run lint:backend && npm run lint:frontend",
    "lint:fix": "npm run lint:backend:fix && npm run lint:frontend:fix",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install && cd ../shared && npm install"
  }
}
```

### Automation Scripts

The project includes comprehensive automation scripts for all development and deployment tasks:

```bash
# Quick start with automation
./scripts/setup.sh development    # Complete setup
./scripts/dev.sh                   # Start development
./scripts/test.sh                  # Run tests
./scripts/build.sh production      # Build for production
./scripts/deploy.sh staging        # Deploy to staging

# Database management
./scripts/db-migrate.sh development
./scripts/db-seed.sh development
./scripts/db-reset.sh development

# Docker operations
./scripts/docker-build.sh production
./scripts/docker-up.sh production
./scripts/docker-down.sh

# Health monitoring
./scripts/health-check.sh --detailed
./scripts/health-check.sh --watch

# Cleanup
./scripts/clean.sh --all
```

For complete script documentation, see [Automation Scripts](./automation-scripts.md).

## Performance Optimization

### Backend Optimization

#### Database Queries
```typescript
// Use specific fields instead of SELECT *
const users = await knex('users')
  .select('id', 'name', 'email', 'role')
  .where('is_active', true);

// Use indexes for frequently queried fields
// Add index to users.email for login queries

// Use pagination for large datasets
const users = await knex('users')
  .limit(20)
  .offset((page - 1) * 20);

// Use transactions for multiple operations
await knex.transaction(async (trx) => {
  await trx('users').insert(userData);
  await trx('activity_logs').insert(logData);
});
```

#### Caching Strategy
```typescript
// Cache frequently accessed data
const getUserById = async (id: string): Promise<User | null> => {
  const cacheKey = `user:${id}`;
  
  // Try cache first
  let user = await redis.get(cacheKey);
  if (user) {
    return JSON.parse(user);
  }
  
  // Fetch from database
  user = await userRepository.findById(id);
  
  // Cache result
  if (user) {
    await redis.setex(cacheKey, 3600, JSON.stringify(user)); // 1 hour
  }
  
  return user;
};
```

### Frontend Optimization

#### Component Optimization
```typescript
// Use React.memo for expensive components
export const UserCard = React.memo<UserCardProps>(({ user, onEdit, onDelete }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.user.id === nextProps.user.id &&
         prevProps.user.updatedAt === nextProps.user.updatedAt;
});

// Use useMemo for expensive calculations
const ExpensiveComponent: React.FC<{ data: any[] }> = ({ data }) => {
  const processedData = useMemo(() => {
    return data.map(item => expensiveCalculation(item));
  }, [data]);
  
  return <div>{/* Render processed data */}</div>;
};

// Use useCallback for event handlers
const UserList: React.FC<{ users: User[] }> = ({ users }) => {
  const handleEdit = useCallback((user: User) => {
    // Handle edit
  }, []);
  
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} onEdit={handleEdit} />
      ))}
    </div>
  );
};
```

## 🔒 Security Best Practices

### Backend Security

#### Input Validation
```typescript
// Validate all inputs
const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(100).required()
});

// Sanitize user input
const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html);
};
```

#### Authentication
```typescript
// Use secure password hashing
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Use JWT with expiration
const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};
```

### Frontend Security

#### XSS Prevention
```typescript
// Use React's built-in XSS protection
// Never use dangerouslySetInnerHTML with untrusted data

// Validate user input
const validateInput = (input: string): boolean => {
  return /^[a-zA-Z0-9\s]+$/.test(input);
};
```

## Development Checklist

### Before Committing
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] No console errors
- [ ] Documentation updated
- [ ] Self-review completed

### Before Creating PR
- [ ] Branch is up to date with main
- [ ] All tests pass
- [ ] Code coverage maintained
- [ ] No merge conflicts
- [ ] PR description filled out

### Code Review Checklist
- [ ] Code is readable and maintainable
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Documentation is accurate

---

*Last updated: $(date)*
