# Testing Procedures Guide

This comprehensive guide covers all testing procedures for the HostingCo system, including unit testing, integration testing, end-to-end testing, and quality assurance processes.

## Testing Overview

The HostingCo system employs a multi-layered testing strategy to ensure code quality, functionality, and reliability across all components.

### Testing Pyramid
- **Unit Tests** - Individual function and component testing
- **Integration Tests** - API endpoint and database interaction testing
- **End-to-End Tests** - Full application workflow testing
- **Performance Tests** - Load testing and performance benchmarking
- **Security Tests** - Vulnerability scanning and security validation

### Automated Testing Scripts

The project includes comprehensive automation scripts for all testing operations:

```bash
# Run all tests with coverage
./scripts/test.sh all --coverage --report

# Run specific test suites
./scripts/test.sh backend
./scripts/test.sh frontend
./scripts/test.sh shared

# Watch mode for development
./scripts/test-watch.sh all

# Coverage analysis with threshold checking
./scripts/test-coverage.sh all --threshold 90 --compare

# Run tests with auto-fix for linting
./scripts/test.sh all --fix
```

For complete testing script documentation, see [Automation Scripts](./automation-scripts.md).

## 🔬 Unit Testing

### Backend Unit Testing

#### Test Configuration
```javascript
// backend/test/setup.js
const { knex } = require('../src/database/database');

// Test database configuration
const testConfig = {
  client: 'postgresql',
  connection: process.env.TEST_DATABASE_URL || 'postgresql://hostingco:password@localhost:5432/hostingco_test',
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
};

// Global test setup
beforeAll(async () => {
  // Set up test database
  await knex.migrate.latest();
  await knex.seed.run();
});

afterAll(async () => {
  // Clean up test database
  await knex.migrate.rollback();
  await knex.destroy();
});

// Reset database before each test
beforeEach(async () => {
  await knex('activity_logs').del();
  await knex('support_tickets').del();
  await knex('invoices').del();
  await knex('servers').del();
  await knex('users').del();
});
```

#### Model Testing
```javascript
// backend/test/models/user.test.js
const { User } = require('../../src/models/User');
const { createUser, getUserById, updateUser } = require('../../src/services/userService');

describe('User Model', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User',
        role: 'user'
      };
      
      const user = await createUser(userData);
      
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.id).toMatch(/^user_\w+$/);
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
    });
    
    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      await expect(createUser(userData)).rejects.toThrow('Invalid email format');
    });
    
    it('should throw error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      };
      
      await expect(createUser(userData)).rejects.toThrow('Password does not meet security requirements');
    });
    
    it('should hash password before saving', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      const user = await createUser(userData);
      
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.passwordHash).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash
    });
  });
  
  describe('getUserById', () => {
    it('should return user when found', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      const createdUser = await createUser(userData);
      const foundUser = await getUserById(createdUser.id);
      
      expect(foundUser).toBeDefined();
      expect(foundUser.id).toBe(createdUser.id);
      expect(foundUser.email).toBe(userData.email);
    });
    
    it('should return null when user not found', async () => {
      const user = await getUserById('nonexistent_id');
      expect(user).toBeNull();
    });
  });
  
  describe('updateUser', () => {
    it('should update user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      const user = await createUser(userData);
      const updateData = { name: 'Updated Name', company: 'New Company' };
      
      const updatedUser = await updateUser(user.id, updateData);
      
      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.company).toBe(updateData.company);
      expect(updatedUser.email).toBe(userData.email); // Unchanged
    });
  });
});
```

#### Service Testing
```javascript
// backend/test/services/authService.test.js
const { loginUser, registerUser, verifyToken } = require('../../src/services/authService');
const { createUser } = require('../../src/services/userService');

describe('Authentication Service', () => {
  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      await createUser(userData);
      
      const loginData = {
        email: userData.email,
        password: userData.password
      };
      
      const result = await loginUser(loginData);
      
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.passwordHash).toBeUndefined(); // Password hash should not be returned
    });
    
    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword'
      };
      
      await expect(loginUser(loginData)).rejects.toThrow('Invalid credentials');
    });
    
    it('should throw error for inactive user', async () => {
      const userData = {
        email: 'inactive@example.com',
        password: 'SecurePass123!',
        name: 'Inactive User'
      };
      
      const user = await createUser(userData);
      await knex('users').where({ id: user.id }).update({ is_active: false });
      
      const loginData = {
        email: userData.email,
        password: userData.password
      };
      
      await expect(loginUser(loginData)).rejects.toThrow('Account is inactive');
    });
  });
  
  describe('registerUser', () => {
    it('should register new user with valid data', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        name: 'New User'
      };
      
      const result = await registerUser(userData);
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(userData.email);
      expect(result.user.isActive).toBe(false); // Email verification required
    });
    
    it('should throw error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      await createUser(userData);
      
      await expect(registerUser(userData)).rejects.toThrow('Email already exists');
    });
  });
});
```

#### Controller Testing
```javascript
// backend/test/controllers/userController.test.js
const request = require('supertest');
const app = require('../../src/app');
const { createUser } = require('../../src/services/userService');

describe('User Controller', () => {
  describe('GET /api/users', () => {
    it('should return users list for admin', async () => {
      // Create admin user
      const adminUser = await createUser({
        email: 'admin@example.com',
        password: 'SecurePass123!',
        name: 'Admin User',
        role: 'admin'
      });
      
      // Create regular users
      await createUser({
        email: 'user1@example.com',
        password: 'SecurePass123!',
        name: 'User One'
      });
      
      await createUser({
        email: 'user2@example.com',
        password: 'SecurePass123!',
        name: 'User Two'
      });
      
      // Login admin and get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminUser.email,
          password: 'SecurePass123!'
        });
      
      const token = loginResponse.body.data.token;
      
      // Get users list
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toHaveLength(3);
      expect(response.body.data.pagination.total).toBe(3);
    });
    
    it('should return 403 for non-admin user', async () => {
      const regularUser = await createUser({
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'Regular User',
        role: 'user'
      });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: regularUser.email,
          password: 'SecurePass123!'
        });
      
      const token = loginResponse.body.data.token;
      
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
    
    it('should return 401 without token', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });
});
```

### Frontend Unit Testing

#### Component Testing
```javascript
// frontend/src/components/__tests__/UserCard.test.tsx
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
  it('renders user information correctly', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
  });
  
  it('shows active status for active users', () => {
    render(<UserCard user={mockUser} />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Active')).toHaveClass('text-green-600');
  });
  
  it('shows inactive status for inactive users', () => {
    const inactiveUser = { ...mockUser, isActive: false };
    render(<UserCard user={inactiveUser} />);
    
    expect(screen.getByText('Inactive')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toHaveClass('text-red-600');
  });
  
  it('calls onEdit when edit button is clicked', () => {
    const mockOnEdit = jest.fn();
    render(<UserCard user={mockUser} onEdit={mockOnEdit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });
  
  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    render(<UserCard user={mockUser} onDelete={mockOnDelete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockUser);
  });
});
```

#### Hook Testing
```javascript
// frontend/src/hooks/__tests__/useAuth.test.ts
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth';
import { server } from '../../mocks/server';

// Mock server for API calls
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useAuth', () => {
  it('should initialize with null user', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });
  
  it('should login user successfully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      const loginResult = await result.current.login('test@example.com', 'password');
      expect(loginResult.success).toBe(true);
    });
    
    expect(result.current.user).toBeDefined();
    expect(result.current.user?.email).toBe('test@example.com');
    expect(result.current.isLoading).toBe(false);
  });
  
  it('should logout user successfully', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Login first
    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });
    
    expect(result.current.user).toBeDefined();
    
    // Then logout
    await act(async () => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
  });
  
  it('should handle login errors', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await act(async () => {
      const loginResult = await result.current.login('invalid@example.com', 'wrongpassword');
      expect(loginResult.success).toBe(false);
    });
    
    expect(result.current.user).toBeNull();
    expect(result.current.error).toBe('Invalid credentials');
  });
});
```

## 🔗 Integration Testing

### API Integration Testing

#### API Endpoint Testing
```javascript
// backend/test/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const { createUser } = require('../../src/services/userService');

describe('Authentication Integration', () => {
  describe('POST /api/auth/login', () => {
    it('should authenticate and return token', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      await createUser(userData);
      
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });
    
    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        })
        .expect(401);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTHENTICATION_ERROR');
    });
  });
  
  describe('Protected Routes', () => {
    let token;
    
    beforeEach(async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      await createUser(userData);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });
      
      token = loginResponse.body.data.token;
    });
    
    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });
    
    it('should reject protected route without token', async () => {
      await request(app)
        .get('/api/users/profile')
        .expect(401);
    });
    
    it('should reject protected route with invalid token', async () => {
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
```

#### Database Integration Testing
```javascript
// backend/test/integration/database.test.js
const { knex } = require('../../src/database/database');
const { createUser, getUserById, updateUser } = require('../../src/services/userService');

describe('Database Integration', () => {
  describe('User Operations', () => {
    it('should create and retrieve user from database', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      const createdUser = await createUser(userData);
      const retrievedUser = await getUserById(createdUser.id);
      
      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.id).toBe(createdUser.id);
      expect(retrievedUser.email).toBe(userData.email);
      
      // Verify data is actually in database
      const dbUser = await knex('users').where({ id: createdUser.id }).first();
      expect(dbUser).toBeDefined();
      expect(dbUser.email).toBe(userData.email);
    });
    
    it('should update user in database', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      const user = await createUser(userData);
      const updateData = { name: 'Updated Name' };
      
      await updateUser(user.id, updateData);
      
      const updatedUser = await getUserById(user.id);
      expect(updatedUser.name).toBe(updateData.name);
      
      // Verify update in database
      const dbUser = await knex('users').where({ id: user.id }).first();
      expect(dbUser.name).toBe(updateData.name);
    });
    
    it('should handle database constraints', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        name: 'Test User'
      };
      
      await createUser(userData);
      
      // Try to create user with same email
      await expect(createUser(userData)).rejects.toThrow();
      
      // Verify constraint in database
      const users = await knex('users').where({ email: userData.email });
      expect(users).toHaveLength(1);
    });
  });
});
```

## End-to-End Testing

### E2E Test Setup

#### Cypress Configuration
```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    env: {
      apiUrl: 'http://localhost:3003/api'
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    }
  }
});
```

#### Custom Commands
```javascript
// cypress/support/e2e.js
import { faker } from '@faker-js/faker';

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env().apiUrl}/auth/login`,
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('token', response.body.data.token);
    window.localStorage.setItem('user', JSON.stringify(response.body.data.user));
  });
});

// Create test user command
Cypress.Commands.add('createTestUser', (overrides = {}) => {
  const userData = {
    email: faker.internet.email(),
    password: 'SecurePass123!',
    name: faker.name.fullName(),
    role: 'user',
    ...overrides
  };
  
  return cy.request({
    method: 'POST',
    url: `${Cypress.env().apiUrl}/auth/register`,
    body: userData
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
});

// API request command with authentication
Cypress.Commands.add('apiRequest', (method, url, body = {}) => {
  const token = window.localStorage.getItem('token');
  
  return cy.request({
    method,
    url: `${Cypress.env().apiUrl}${url}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body
  });
});
```

### E2E Test Scenarios

#### User Authentication Flow
```javascript
// cypress/e2e/auth.cy.js
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });
  
  it('should login with valid credentials', () => {
    // Create test user
    cy.createTestUser({
      email: 'test@example.com',
      password: 'SecurePass123!'
    });
    
    // Fill login form
    cy.get('[data-cy=email-input]').type('test@example.com');
    cy.get('[data-cy=password-input]').type('SecurePass123!');
    cy.get('[data-cy=login-button]').click();
    
    // Verify successful login
    cy.url().should('not.include', '/login');
    cy.get('[data-cy=user-menu]').should('contain', 'Test User');
    cy.get('[data-cy=dashboard-title]').should('be.visible');
  });
  
  it('should show error for invalid credentials', () => {
    cy.get('[data-cy=email-input]').type('invalid@example.com');
    cy.get('[data-cy=password-input]').type('wrongpassword');
    cy.get('[data-cy=login-button]').click();
    
    // Verify error message
    cy.get('[data-cy=error-message]').should('be.visible');
    cy.get('[data-cy=error-message]').should('contain', 'Invalid credentials');
    cy.url().should('include', '/login');
  });
  
  it('should logout successfully', () => {
    // Login first
    cy.login('test@example.com', 'SecurePass123!');
    cy.visit('/dashboard');
    
    // Logout
    cy.get('[data-cy=user-menu]').click();
    cy.get('[data-cy=logout-button]').click();
    
    // Verify logout
    cy.url().should('include', '/login');
    cy.get('[data-cy=user-menu]').should('not.exist');
  });
  
  it('should redirect to login when accessing protected route', () => {
    cy.visit('/dashboard');
    
    // Should redirect to login
    cy.url().should('include', '/login');
    cy.get('[data-cy=login-form]').should('be.visible');
  });
});
```

#### User Management Flow
```javascript
// cypress/e2e/user-management.cy.js
describe('User Management', () => {
  beforeEach(() => {
    // Login as admin
    cy.login('admin@example.com', 'SecurePass123!');
    cy.visit('/users');
  });
  
  it('should display users list', () => {
    cy.get('[data-cy=users-table]').should('be.visible');
    cy.get('[data-cy=user-row]').should('have.length.greaterThan', 0);
    
    // Check table headers
    cy.get('[data-cy=table-header-email]').should('contain', 'Email');
    cy.get('[data-cy=table-header-name]').should('contain', 'Name');
    cy.get('[data-cy=table-header-role]').should('contain', 'Role');
    cy.get('[data-cy=table-header-status]').should('contain', 'Status');
  });
  
  it('should create new user', () => {
    cy.get('[data-cy=add-user-button]').click();
    
    // Fill user form
    cy.get('[data-cy=user-email]').type(faker.internet.email());
    cy.get('[data-cy=user-name]').type(faker.name.fullName());
    cy.get('[data-cy=user-password]').type('SecurePass123!');
    cy.get('[data-cy=user-role]').select('user');
    
    // Submit form
    cy.get('[data-cy=save-button]').click();
    
    // Verify user created
    cy.get('[data-cy=success-message]').should('contain', 'User created successfully');
    cy.get('[data-cy=users-table]').should('contain', cy.get('[data-cy=user-name]').invoke('val'));
  });
  
  it('should edit existing user', () => {
    // Find first user and click edit
    cy.get('[data-cy=user-row]').first().within(() => {
      cy.get('[data-cy=edit-button]').click();
    });
    
    // Update user name
    const newName = faker.name.fullName();
    cy.get('[data-cy=user-name]').clear().type(newName);
    cy.get('[data-cy=save-button]').click();
    
    // Verify update
    cy.get('[data-cy=success-message]').should('contain', 'User updated successfully');
    cy.get('[data-cy=users-table]').should('contain', newName);
  });
  
  it('should delete user', () => {
    // Find first user and click delete
    cy.get('[data-cy=user-row]').first().within(() => {
      cy.get('[data-cy=delete-button]').click();
    });
    
    // Confirm deletion
    cy.get('[data-cy=confirm-delete]').click();
    
    // Verify deletion
    cy.get('[data-cy=success-message]').should('contain', 'User deleted successfully');
  });
});
```

#### Server Management Flow
```javascript
// cypress/e2e/server-management.cy.js
describe('Server Management', () => {
  beforeEach(() => {
    cy.login('user@example.com', 'SecurePass123!');
    cy.visit('/servers');
  });
  
  it('should display servers list', () => {
    cy.get('[data-cy=servers-grid]').should('be.visible');
    cy.get('[data-cy=server-card]').should('have.length.greaterThan', 0);
  });
  
  it('should create new server', () => {
    cy.get('[data-cy=add-server-button]').click();
    
    // Fill server form
    cy.get('[data-cy=server-name]').type('test-server');
    cy.get('[data-cy=server-plan]').select('pro');
    cy.get('[data-cy=server-location]').select('us-east-1');
    
    // Submit form
    cy.get('[data-cy=create-button]').click();
    
    // Verify server created
    cy.get('[data-cy=success-message]').should('contain', 'Server created successfully');
    cy.get('[data-cy=servers-grid]').should('contain', 'test-server');
  });
  
  it('should start server', () => {
    // Find first server and click start
    cy.get('[data-cy=server-card]').first().within(() => {
      cy.get('[data-cy=start-button]').click();
    });
    
    // Verify server status
    cy.get('[data-cy=server-status]').should('contain', 'Starting');
    
    // Wait for server to be active
    cy.get('[data-cy=server-status]', { timeout: 30000 }).should('contain', 'Active');
  });
  
  it('should view server details', () => {
    // Click on first server
    cy.get('[data-cy=server-card]').first().click();
    
    // Verify server details page
    cy.url().should('include', '/servers/');
    cy.get('[data-cy=server-details]').should('be.visible');
    cy.get('[data-cy=server-specs]').should('be.visible');
    cy.get('[data-cy=server-statistics]').should('be.visible');
  });
});
```

## Performance Testing

### Load Testing

#### Artillery Configuration
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3003'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Load test"
    - duration: 60
      arrivalRate: 100
      name: "Stress test"
  processor: "./artillery-processor.js"

scenarios:
  - name: "API Health Check"
    weight: 10
    flow:
      - get:
          url: "/api/health"
          
  - name: "User Authentication"
    weight: 20
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "SecurePass123!"
          capture:
            - json: "$.data.token"
              as: "token"
      - get:
          url: "/api/users/profile"
          headers:
            Authorization: "Bearer {{ token }}"
            
  - name: "Get Servers List"
    weight: 30
    flow:
      - get:
          url: "/api/servers"
          headers:
            Authorization: "Bearer {{ token }}"
            
  - name: "Create Support Ticket"
    weight: 15
    flow:
      - post:
          url: "/api/support/tickets"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            subject: "Test Ticket"
            description: "This is a test ticket"
            priority: "medium"
            category: "technical"
            
  - name: "Get Dashboard Stats"
    weight: 25
    flow:
      - get:
          url: "/api/dashboard/stats"
          headers:
            Authorization: "Bearer {{ token }}"
```

#### Performance Processor
```javascript
// artillery-processor.js
module.exports = {
  // Custom processor functions
  beforeRequest: (requestParams, context, ee, callback) => {
    // Add custom headers or modify request
    callback(null, requestParams);
  },
  
  afterResponse: (requestParams, response, context, ee, callback) => {
    // Process response data
    if (response.statusCode >= 400) {
      console.error(`Error response: ${response.statusCode}`);
    }
    callback(null, response);
  }
};
```

### Performance Benchmarks

#### Benchmark Testing
```javascript
// backend/test/performance/api-benchmark.test.js
const { performance } = require('perf_hooks');
const request = require('supertest');
const app = require('../../src/app');

describe('API Performance Benchmarks', () => {
  const benchmarks = [];
  
  const benchmark = async (name, testFn) => {
    const start = performance.now();
    await testFn();
    const end = performance.now();
    const duration = end - start;
    
    benchmarks.push({ name, duration });
    
    // Assert performance requirements
    expect(duration).toBeLessThan(1000); // 1 second max
    console.log(`${name}: ${duration.toFixed(2)}ms`);
  };
  
  it('should meet performance requirements for health check', async () => {
    await benchmark('Health Check', async () => {
      await request(app)
        .get('/api/health')
        .expect(200);
    });
  });
  
  it('should meet performance requirements for user login', async () => {
    await benchmark('User Login', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!'
        })
        .expect(200);
    });
  });
  
  it('should meet performance requirements for servers list', async () => {
    await benchmark('Servers List', async () => {
      await request(app)
        .get('/api/servers')
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
    });
  });
  
  afterAll(() => {
    console.log('\nPerformance Summary:');
    benchmarks.forEach(({ name, duration }) => {
      console.log(`${name}: ${duration.toFixed(2)}ms`);
    });
    
    const avgDuration = benchmarks.reduce((sum, { duration }) => sum + duration, 0) / benchmarks.length;
    console.log(`Average: ${avgDuration.toFixed(2)}ms`);
  });
});
```

## 🔒 Security Testing

### Security Test Suite

#### Authentication Security
```javascript
// backend/test/security/auth-security.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Authentication Security', () => {
  describe('Login Security', () => {
    it('should prevent brute force attacks', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };
      
      // Attempt multiple failed logins
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);
      }
      
      // Should be locked out after too many attempts
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword'
        })
        .expect(429); // Too Many Requests
    });
    
    it('should validate JWT tokens properly', async () => {
      // Test with malformed token
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);
      
      // Test with expired token
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
      
      await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });
    
    it('should prevent SQL injection in login', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: maliciousInput,
          password: 'password'
        })
        .expect(401);
      
      // Verify users table still exists
      const response = await request(app)
        .get('/api/health')
        .expect(200);
      
      expect(response.body.data.status).toBe('healthy');
    });
  });
});
```

#### Input Validation Security
```javascript
// backend/test/security/input-validation.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Input Validation Security', () => {
  describe('XSS Protection', () => {
    it('should sanitize XSS attempts in user input', async () => {
      const xssPayload = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .post('/api/support/tickets')
        .send({
          subject: xssPayload,
          description: xssPayload,
          priority: 'medium',
          category: 'technical'
        })
        .set('Authorization', 'Bearer valid-token')
        .expect(200);
      
      // Verify XSS payload is sanitized
      expect(response.body.data.subject).not.toContain('<script>');
      expect(response.body.data.description).not.toContain('<script>');
    });
  });
  
  describe('CSRF Protection', () => {
    it('should require CSRF token for state-changing operations', async () => {
      // Test without CSRF token
      await request(app)
        .post('/api/users/profile')
        .send({ name: 'Updated Name' })
        .set('Authorization', 'Bearer valid-token')
        .expect(403); // Forbidden
    });
  });
  
  describe('Rate Limiting', () => {
    it('should rate limit API requests', async () => {
      // Make many requests quickly
      const promises = Array(100).fill().map(() =>
        request(app)
          .get('/api/health')
      );
      
      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
```

## Test Coverage

### Coverage Configuration

#### Jest Coverage Setup
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/services/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**/*'
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.js']
};
```

#### Coverage Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:backend": "jest backend",
    "test:frontend": "jest frontend",
    "test:e2e": "cypress run",
    "test:performance": "artillery run artillery-config.yml",
    "test:security": "jest --testPathPattern=security"
  }
}
```

## Continuous Testing

### CI/CD Pipeline Testing

#### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_USER: hostingco
          POSTGRES_DB: hostingco_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: |
            backend/package-lock.json
            frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          npm run install:all
      
      - name: Run backend tests
        run: |
          cd backend
          npm run test:coverage
        env:
          DATABASE_URL: postgresql://hostingco:password@localhost:5432/hostingco_test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage/lcov.info
  
  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run frontend tests
        run: |
          cd frontend
          npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./frontend/coverage/lcov.info
  
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Start services
        run: |
          npm run start:all &
          sleep 30
      
      - name: Run E2E tests
        uses: cypress-io/github-action@v5
        with:
          working-directory: frontend
          wait-on: 'http://localhost:3000'
          wait-on-timeout: 120
      
      - name: Upload screenshots
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: frontend/cypress/screenshots
  
  performance-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm run install:all
      
      - name: Start services
        run: |
          npm run start:all &
          sleep 30
      
      - name: Install Artillery
        run: npm install -g artillery
      
      - name: Run performance tests
        run: artillery run artillery-config.yml
```

## Testing Procedures Checklist

### Pre-Release Testing
- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Performance benchmarks met
- [ ] Security tests passing
- [ ] Manual QA review completed
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness verified

### Automated Testing Commands
```bash
# Complete pre-release test suite
./scripts/test.sh all --coverage --report --threshold 80

# Performance testing
./scripts/test-performance.sh

# Security testing
./scripts/test-security.sh

# Cross-browser testing
./scripts/test-e2e.sh --browsers chrome,firefox,safari
```

### Daily Testing
- [ ] Run automated test suite
- [ ] Review test failures
- [ ] Update failing tests
- [ ] Monitor test coverage
- [ ] Check performance metrics

```bash
# Daily test run
./scripts/test.sh all --coverage --compare

# Watch mode during development
./scripts/test-watch.sh all
```

### Weekly Testing
- [ ] Run full test suite
- [ ] Review test coverage trends
- [ ] Update test documentation
- [ ] Review flaky tests
- [ ] Optimize slow tests

```bash
# Weekly comprehensive testing
./scripts/test.sh all --coverage --report --verbose

# Coverage analysis
./scripts/test-coverage.sh all --compare --html
```

### Monthly Testing
- [ ] Comprehensive test audit
- [ ] Review testing strategy
- [ ] Update test infrastructure
- [ ] Train team on testing best practices
- [ ] Review testing tools and frameworks

## Testing Troubleshooting

### Common Issues

#### Test Environment Issues
```bash
# Issue: Database connection failed
# Solution: Check test database status
sudo systemctl status postgresql
createdb hostingco_test

# Issue: Port conflicts
# Solution: Kill processes using test ports
lsof -ti:3000 | xargs kill -9
lsof -ti:3003 | xargs kill -9

# Issue: Test timeouts
# Solution: Increase timeout values
export CYPRESS_DEFAULT_COMMAND_TIMEOUT=10000
export CYPRESS_REQUEST_TIMEOUT=10000
```

#### Coverage Issues
```bash
# Issue: Low coverage
# Solution: Identify uncovered files
npm run test:coverage -- --coverageReporters=text

# Issue: Coverage threshold not met
# Solution: Review coverage report and add tests
open coverage/lcov-report/index.html
```

---

*Last updated: $(date)*
