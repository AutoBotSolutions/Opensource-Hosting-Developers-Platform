# User Management Guide

This comprehensive guide covers all aspects of user management in the HostingCo system, including user creation, roles, permissions, and administration procedures.

## User Management Overview

The HostingCo system implements a robust user management system with role-based access control (RBAC), comprehensive authentication, and detailed user lifecycle management.

### User Types and Roles
- **Super Admin** - Full system access and configuration
- **Admin** - User, server, and billing management
- **Support** - Customer support and ticket management
- **User** - Self-service server and billing management
- **Read Only** - View-only access to assigned resources

## 🔐 User Authentication

### Registration Process

#### Self-Registration
```bash
# API endpoint for user registration
POST /api/auth/register

# Request body
{
  "email": "newuser@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "company": "Acme Corp",
  "phone": "+1234567890"
}

# Response
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "newuser@example.com",
      "name": "John Doe",
      "role": "user",
      "isActive": true,
      "emailVerified": false
    }
  },
  "message": "User registered successfully. Please verify your email."
}
```

#### Admin-Created Users
```bash
# Admin creates user via API
POST /api/users
Authorization: Bearer <admin-token>

# Request body
{
  "email": "employee@company.com",
  "password": "TempPass123!",
  "name": "Jane Smith",
  "role": "admin",
  "permissions": ["user:read", "user:write", "server:read"],
  "settings": {
    "notifications": {
      "email": true,
      "push": false
    }
  }
}
```

### Email Verification
```javascript
// Backend email verification process
const sendVerificationEmail = async (user) => {
  const token = generateVerificationToken(user.id);
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  await emailService.send({
    to: user.email,
    subject: 'Verify your HostingCo account',
    template: 'email-verification',
    data: {
      userName: user.name,
      verificationUrl
    }
  });
};

// Frontend verification
const verifyEmail = async (token) => {
  try {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    const result = await response.json();
    if (result.success) {
      navigate('/login?message=email-verified');
    }
  } catch (error) {
    setError('Invalid or expired verification token');
  }
};
```

### Password Management

#### Password Reset Flow
```bash
# Request password reset
POST /api/auth/forgot-password

# Request body
{
  "email": "user@example.com"
}

# Reset password
POST /api/auth/reset-password

# Request body
{
  "token": "reset_token_here",
  "newPassword": "NewSecurePass123!"
}
```

#### Password Policy Enforcement
```javascript
// Password validation rules
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  maxAge: 90, // days
  historyCount: 5, // prevent reuse of last 5 passwords
  lockoutAttempts: 5,
  lockoutDuration: 15 // minutes
};

// Password strength validation
const validatePassword = (password, userInfo) => {
  const errors = [];
  
  if (password.length < passwordPolicy.minLength) {
    errors.push(`Password must be at least ${passwordPolicy.minLength} characters`);
  }
  
  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  
  if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  
  if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain number');
  }
  
  if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain special character');
  }
  
  // Check against user info
  if (passwordPolicy.preventUserInfo && userInfo) {
    const userInfoStrings = [
      userInfo.name?.toLowerCase(),
      userInfo.email?.split('@')[0].toLowerCase(),
      userInfo.company?.toLowerCase()
    ].filter(Boolean);
    
    for (const info of userInfoStrings) {
      if (password.toLowerCase().includes(info)) {
        errors.push('Password cannot contain personal information');
        break;
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculatePasswordStrength(password)
  };
};
```

## 🎭 Role-Based Access Control (RBAC)

### Role Definitions and Permissions

#### Super Admin Role
```javascript
const SUPER_ADMIN_PERMISSIONS = [
  // System permissions
  'system:read', 'system:write', 'system:admin',
  
  // User management
  'user:read', 'user:write', 'user:delete', 'user:admin',
  
  // Server management
  'server:read', 'server:write', 'server:delete', 'server:admin',
  
  // Billing management
  'billing:read', 'billing:write', 'billing:delete', 'billing:admin',
  
  // Support management
  'support:read', 'support:write', 'support:delete', 'support:admin',
  
  // Configuration
  'config:read', 'config:write', 'config:admin'
];
```

#### Admin Role
```javascript
const ADMIN_PERMISSIONS = [
  'user:read', 'user:write', 'user:delete',
  'server:read', 'server:write', 'server:delete',
  'billing:read', 'billing:write',
  'support:read', 'support:write',
  'system:read'
];
```

#### Support Role
```javascript
const SUPPORT_PERMISSIONS = [
  'user:read',
  'server:read', 'server:write',
  'support:read', 'support:write',
  'billing:read'
];
```

#### User Role
```javascript
const USER_PERMISSIONS = [
  'user:read', 'user:write', // self only
  'server:read', 'server:write', // own servers only
  'billing:read', // own billing only
  'support:read', 'support:write' // own tickets only
];
```

### Permission Implementation
```javascript
// Permission middleware
const requirePermission = (permission, resourceOwnership = false) => {
  return async (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTHENTICATION_ERROR', message: 'Authentication required' }
      });
    }
    
    // Check if user has permission
    const hasPermission = await checkUserPermission(user.id, permission);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: { code: 'AUTHORIZATION_ERROR', message: 'Insufficient permissions' }
      });
    }
    
    // Check resource ownership if required
    if (resourceOwnership) {
      const resourceId = req.params.id || req.params.userId;
      const ownsResource = await checkResourceOwnership(user.id, resourceId, req.resourceType);
      
      if (!ownsResource && user.role !== 'admin' && user.role !== 'super_admin') {
        return res.status(403).json({
          success: false,
          error: { code: 'AUTHORIZATION_ERROR', message: 'Access denied to this resource' }
        });
      }
    }
    
    next();
  };
};

// Permission checking function
const checkUserPermission = async (userId, permission) => {
  const user = await getUserById(userId);
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  
  return userPermissions.includes(permission);
};
```

## User Lifecycle Management

### User Creation Workflow

#### Admin User Creation
```bash
# Step 1: Create user account
curl -X POST http://localhost:3003/api/users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@company.com",
    "password": "TempPass123!",
    "name": "John Doe",
    "role": "user",
    "company": "Acme Corp",
    "phone": "+1234567890"
  }'

# Step 2: Assign initial permissions (if custom)
curl -X PUT http://localhost:3003/api/users/user_123/permissions \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["server:read", "server:write", "billing:read"]
  }'

# Step 3: Send welcome email
# This is automatically triggered by the system
```

#### Bulk User Creation
```javascript
// Bulk user creation via CSV upload
const createBulkUsers = async (csvData) => {
  const results = {
    success: [],
    errors: []
  };
  
  for (const row of csvData) {
    try {
      const user = await createUser({
        email: row.email,
        password: generateTemporaryPassword(),
        name: row.name,
        role: row.role || 'user',
        company: row.company,
        phone: row.phone
      });
      
      await sendWelcomeEmail(user);
      results.success.push({ email: row.email, userId: user.id });
    } catch (error) {
      results.errors.push({ 
        email: row.email, 
        error: error.message 
      });
    }
  }
  
  return results;
};
```

### User Updates and Modifications

#### Profile Management
```bash
# Update user profile
PUT /api/users/user_123
Authorization: Bearer <user-token>

# Request body
{
  "name": "John Updated",
  "company": "New Company",
  "phone": "+1234567890",
  "settings": {
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false,
      "sms": false
    },
    "preferences": {
      "language": "en",
      "timezone": "America/New_York",
      "dateFormat": "MM/DD/YYYY",
      "currency": "USD"
    }
  }
}
```

#### Role Changes
```bash
# Admin changes user role
PUT /api/users/user_123/role
Authorization: Bearer <admin-token>

# Request body
{
  "role": "admin",
  "reason": "Promotion to system administrator"
}

# System automatically logs role change
await logActivity({
  userId: 'user_123',
  action: 'role_changed',
  resource: 'user',
  resourceId: 'user_123',
  details: {
    oldRole: 'user',
    newRole: 'admin',
    changedBy: 'admin_456',
    reason: 'Promotion to system administrator'
  }
});
```

### User Deactivation and Deletion

#### Soft Delete (Deactivation)
```bash
# Deactivate user account
DELETE /api/users/user_123
Authorization: Bearer <admin-token>

# Response
{
  "success": true,
  "message": "User deactivated successfully",
  "data": {
    "deactivatedAt": "2026-05-08T03:14:24.942Z",
    "gracePeriod": "30 days"
  }
}
```

#### Permanent Deletion
```javascript
// Permanent user deletion (after grace period)
const permanentlyDeleteUser = async (userId) => {
  // Check grace period
  const user = await getUserById(userId);
  const gracePeriodDays = 30;
  const daysSinceDeactivation = Math.floor(
    (Date.now() - new Date(user.deactivatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceDeactivation < gracePeriodDays) {
    throw new Error(`User cannot be permanently deleted before ${gracePeriodDays - daysSinceDeactivation} days`);
  }
  
  // Archive user data
  await archiveUserData(userId);
  
  // Delete user and related data
  await knex.transaction(async (trx) => {
    // Delete user's servers
    await trx('servers').where({ user_id: userId }).del();
    
    // Delete user's invoices
    await trx('invoices').where({ user_id: userId }).del();
    
    // Delete user's support tickets
    await trx('support_tickets').where({ user_id: userId }).del();
    
    // Delete activity logs (retain for audit)
    await trx('activity_logs').where({ user_id: userId }).update({ 
      user_id: null,
      details: knex.raw("jsonb_set(details, '{deletedUserId}', to_jsonb(?))", [userId])
    });
    
    // Delete user
    await trx('users').where({ id: userId }).del();
  });
  
  // Log permanent deletion
  await logActivity({
    action: 'user_permanently_deleted',
    resource: 'user',
    resourceId: userId,
    details: { deletedAt: new Date().toISOString() }
  });
};
```

## 🔒 Security and Compliance

### Two-Factor Authentication (2FA)

#### 2FA Setup
```javascript
// Enable 2FA for user
const enableTwoFactorAuth = async (userId) => {
  const secret = speakeasy.generateSecret({
    name: `HostingCo (${process.env.FRONTEND_URL})`,
    issuer: 'HostingCo',
    user: userId
  });
  
  // Save secret to user record
  await knex('users')
    .where({ id: userId })
    .update({
      two_factor_secret: secret.base32,
      two_factor_enabled: false // Not enabled until verified
    });
  
  // Generate QR code
  const qrCodeUrl = qrcode.toDataURL(secret.otpauth_url);
  
  return {
    secret: secret.base32,
    qrCode: qrCodeUrl,
    backupCodes: generateBackupCodes()
  };
};

// Verify 2FA setup
const verifyTwoFactorSetup = async (userId, token) => {
  const user = await getUserById(userId);
  
  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: token,
    window: 2
  });
  
  if (verified) {
    await knex('users')
      .where({ id: userId })
      .update({ two_factor_enabled: true });
    
    return true;
  }
  
  return false;
};
```

#### 2FA Login Process
```javascript
// Login with 2FA
const loginWithTwoFactor = async (email, password, twoFactorToken) => {
  const user = await getUserByEmail(email);
  
  if (!user || !await verifyPassword(password, user.password_hash)) {
    throw new AuthenticationError('Invalid credentials');
  }
  
  if (user.two_factor_enabled) {
    if (!twoFactorToken) {
      return { requireTwoFactor: true };
    }
    
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: twoFactorToken,
      window: 2
    });
    
    if (!verified) {
      throw new AuthenticationError('Invalid two-factor token');
    }
  }
  
  const token = generateJWT(user);
  
  await logActivity({
    userId: user.id,
    action: 'login',
    resource: 'auth',
    details: { twoFactorUsed: user.two_factor_enabled }
  });
  
  return { token, user: sanitizeUser(user) };
};
```

### Session Management

#### Session Configuration
```javascript
// Session management with Redis
const sessionConfig = {
  store: redisStore,
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  }
};

// Session tracking
const trackSession = async (userId, sessionId, deviceInfo) => {
  await redis.hset(`sessions:${userId}`, sessionId, JSON.stringify({
    createdAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    deviceInfo,
    ipAddress: deviceInfo.ipAddress
  }));
  
  // Enforce maximum concurrent sessions
  const sessions = await redis.hkeys(`sessions:${userId}`);
  if (sessions.length > 3) {
    const oldestSession = sessions[0];
    await redis.hdel(`sessions:${userId}`, oldestSession);
    await redis.set(`blacklist:${oldestSession}`, 'revoked', 'EX', 86400);
  }
};
```

### Audit and Compliance

#### Activity Logging
```javascript
// Comprehensive activity logging
const logUserActivity = async (activity) => {
  const {
    userId,
    action,
    resource,
    resourceId,
    details = {},
    ipAddress,
    userAgent
  } = activity;
  
  // Log to database
  await knex('activity_logs').insert({
    user_id: userId,
    action,
    resource,
    resource_id: resourceId,
    details: JSON.stringify(details),
    ip_address: ipAddress,
    user_agent: userAgent,
    timestamp: new Date()
  });
  
  // Check for suspicious activity
  await detectSuspiciousActivity({
    userId,
    action,
    ipAddress,
    timestamp: new Date()
  });
  
  // Send to external audit system
  if (process.env.AUDIT_WEBHOOK_URL) {
    await sendAuditLog({
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent
    });
  }
};
```

#### Compliance Reporting
```javascript
// Generate compliance reports
const generateComplianceReport = async (startDate, endDate) => {
  const report = {
    period: { startDate, endDate },
    userActivity: await getUserActivityReport(startDate, endDate),
    accessPatterns: await getAccessPatternsReport(startDate, endDate),
    securityIncidents: await getSecurityIncidentsReport(startDate, endDate),
    dataAccess: await getDataAccessReport(startDate, endDate),
    complianceStatus: await getComplianceStatus()
  };
  
  return report;
};

const getUserActivityReport = async (startDate, endDate) => {
  return await knex('activity_logs')
    .whereBetween('timestamp', [startDate, endDate])
    .select(
      'action',
      knex.raw('COUNT(*) as count'),
      knex.raw('COUNT(DISTINCT user_id) as uniqueUsers')
    )
    .groupBy('action')
    .orderBy('count', 'desc');
};
```

## User Analytics and Reporting

### User Metrics
```javascript
// User analytics dashboard
const getUserAnalytics = async (period = '30d') => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - parseInt(period));
  
  const metrics = {
    overview: await getUserOverview(startDate, endDate),
    registration: await getRegistrationMetrics(startDate, endDate),
    engagement: await getEngagementMetrics(startDate, endDate),
    security: await getSecurityMetrics(startDate, endDate),
    retention: await getRetentionMetrics(startDate, endDate)
  };
  
  return metrics;
};

const getUserOverview = async (startDate, endDate) => {
  const [totalUsers, activeUsers, newUsers, churnedUsers] = await Promise.all([
    knex('users').count('* as total').first(),
    knex('users').where('last_login', '>=', startDate).count('* as active').first(),
    knex('users').whereBetween('created_at', [startDate, endDate]).count('* as new').first(),
    knex('users').where('is_active', false).whereBetween('updated_at', [startDate, endDate]).count('* as churned').first()
  ]);
  
  return {
    total: totalUsers.total,
    active: activeUsers.active,
    new: newUsers.new,
    churned: churnedUsers.churned,
    growthRate: ((newUsers.new / totalUsers.total) * 100).toFixed(2)
  };
};
```

### User Lifecycle Reports
```bash
# Generate user lifecycle report
GET /api/analytics/user-lifecycle?period=30d
Authorization: Bearer <admin-token>

# Response
{
  "success": true,
  "data": {
    "overview": {
      "total": 150,
      "active": 120,
      "new": 12,
      "churned": 3,
      "growthRate": "8.0"
    },
    "byRole": {
      "super_admin": 2,
      "admin": 8,
      "support": 15,
      "user": 125
    },
    "byStatus": {
      "active": 120,
      "inactive": 27,
      "suspended": 3
    },
    "registrationTrend": [
      { "date": "2026-04-08", "count": 2 },
      { "date": "2026-04-09", "count": 1 },
      { "date": "2026-04-10", "count": 3 }
    ]
  }
}
```

## User Management Tools

### Administrative Tools

#### User Management CLI
```bash
# Create user
npm run user:create -- --email=user@example.com --name="John Doe" --role=user

# Update user
npm run user:update -- --id=user_123 --role=admin

# Deactivate user
npm run user:deactivate -- --id=user_123

# Reset password
npm run user:reset-password -- --email=user@example.com

# List users
npm run user:list -- --role=admin --active=true

# User analytics
npm run user:analytics -- --period=30d
```

#### Bulk Operations
```javascript
// Bulk user operations
const bulkUserOperations = {
  importUsers: async (csvFile) => {
    const users = await parseCSV(csvFile);
    return await createBulkUsers(users);
  },
  
  exportUsers: async (filters = {}) => {
    const users = await getUsersWithFilters(filters);
    return await generateCSV(users);
  },
  
  bulkUpdate: async (userIds, updates) => {
    return await knex('users')
      .whereIn('id', userIds)
      .update(updates);
  },
  
  bulkDeactivate: async (userIds, reason) => {
    await knex.transaction(async (trx) => {
      await trx('users')
        .whereIn('id', userIds)
        .update({ 
          is_active: false, 
          deactivated_at: new Date(),
          deactivation_reason: reason
        });
      
      // Log bulk deactivation
      for (const userId of userIds) {
        await logActivity({
          userId,
          action: 'bulk_deactivated',
          resource: 'user',
          resourceId: userId,
          details: { reason }
        });
      }
    });
  }
};
```

### User Self-Service Tools

#### Profile Management Interface
```typescript
// Frontend user profile component
interface UserProfile {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  role: string;
  settings: UserSettings;
  createdAt: string;
  lastLogin: string;
}

const UserProfileComponent = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadUserProfile();
  }, []);
  
  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };
  
  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.data);
        showSuccess('Profile updated successfully');
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!profile) return <NoDataMessage />;
  
  return (
    <div className="user-profile">
      <ProfileForm profile={profile} onUpdate={updateProfile} />
      <PasswordChangeForm />
      <TwoFactorSetup />
      <SessionManagement />
    </div>
  );
};
```

## User Management Procedures

### Daily Procedures
- [ ] Review new user registrations
- [ ] Monitor failed login attempts
- [ ] Check for suspicious activity patterns
- [ ] Process user deletion requests

### Weekly Procedures
- [ ] Review user access logs
- [ ] Update user roles as needed
- [ ] Generate user activity reports
- [ ] Audit user permissions

### Monthly Procedures
- [ ] Comprehensive user audit
- [ ] Review inactive accounts
- [ ] Update security policies
- [ ] Generate compliance reports

### Annual Procedures
- [ ] Complete security audit
- [ ] Review user lifecycle policies
- [ ] Update role definitions
- [ ] Conduct access review

## Common Issues and Solutions

### User Creation Issues
```bash
# Issue: Email already exists
# Solution: Check for soft-deleted users
SELECT * FROM users WHERE email = 'user@example.com' AND is_active = false;

# Issue: Invalid role
# Solution: Verify role exists in system
SELECT DISTINCT role FROM users;

# Issue: Password policy violation
# Solution: Check password requirements
npm run user:password-policy -- --email=user@example.com
```

### Authentication Issues
```bash
# Issue: User cannot login
# Solution: Check account status and reset password
npm run user:status -- --email=user@example.com
npm run user:reset-password -- --email=user@example.com

# Issue: 2FA not working
# Solution: Reset 2FA secret
npm run user:reset-2fa -- --id=user_123

# Issue: Session expired
# Solution: Clear session cache
npm run session:clear -- --user=user_123
```

### Permission Issues
```bash
# Issue: Access denied
# Solution: Check user permissions
npm run user:permissions -- --id=user_123

# Issue: Role not recognized
# Solution: Verify role configuration
npm run roles:list

# Issue: Resource access denied
# Solution: Check resource ownership
npm run resource:check -- --user=user_123 --resource=server_456
```

---

*Last updated: $(date)*
