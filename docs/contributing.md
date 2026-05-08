# Contributing Guidelines

This guide covers how to contribute to the HostingCo system, including development setup, coding standards, and the contribution process.

## Welcome!

Thank you for your interest in contributing to HostingCo! This document provides guidelines and standards for contributing to the project.

## Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- PostgreSQL 15+
- Redis 7+
- Git
- Basic knowledge of TypeScript, React, and Node.js

### First-Time Setup

#### 1. Fork the Repository
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/hostingco-system.git
cd hostingco-system
```

#### 2. Set Up Development Environment
```bash
# Install dependencies
npm run install:all

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Set up database
createdb hostingco_test
cd backend && npm run migrate && npm run seed
```

#### 3. Start Development
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend  # Backend on port 3003
npm run dev:frontend # Frontend on port 3000
```

## Contribution Types

### Bug Reports
- Use the issue tracker for bug reports
- Provide detailed reproduction steps
- Include system information and error logs
- Use the bug report template

### Feature Requests
- Open an issue to discuss large features
- Provide clear use cases and requirements
- Consider impact on existing functionality

### Documentation
- Improve existing documentation
- Add missing documentation
- Fix typos and grammatical errors
- Add code examples and tutorials

### Code Contributions
- Fix bugs and implement features
- Improve code quality and performance
- Add tests and improve coverage
- Refactor code for better maintainability

## Development Workflow

### Branch Strategy

#### Main Branches
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical fixes

#### Creating Branches
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b bugfix/issue-number-description

# Create hotfix branch
git checkout -b hotfix/critical-fix-description
```

### Commit Guidelines

#### Commit Message Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD related changes

#### Examples
```
feat(auth): Add two-factor authentication

Implement TOTP-based two-factor authentication for enhanced security.
Users can now enable 2FA in their security settings.

Closes #123

fix(api): Handle null values in user service

Prevent crashes when user data contains null values.
Add proper null checks and default values.

fixes #456

docs(readme): Update installation instructions

Add Docker installation method and update Node.js version requirements.
Include troubleshooting section for common issues.
```

### Code Style

#### TypeScript/JavaScript Standards
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Use interfaces for object shapes

#### React Component Standards
- Use functional components with hooks
- Use TypeScript interfaces for props
- Use React.memo for performance optimization
- Follow single responsibility principle
- Use proper accessibility attributes

#### Backend API Standards
- Use proper HTTP status codes
- Validate all inputs
- Use consistent error handling
- Add comprehensive logging
- Write comprehensive tests

## Testing

### Testing Requirements
- All new features must include tests
- Maintain minimum 80% code coverage
- Write unit tests for all functions
- Write integration tests for API endpoints
- Write E2E tests for critical user flows

### Test Structure
```
backend/src/
├── controllers/
│   └── __tests__/
│       └── userController.test.ts
├── services/
│   └── __tests__/
│       └── userService.test.ts
└── utils/
    └── __tests__/
        └── validation.test.ts

frontend/src/
├── components/
│   └── __tests__/
│       └── UserCard.test.tsx
├── hooks/
│   └── __tests__/
│       └── useAuth.test.ts
└── utils/
    └── __tests__/
        └── helpers.test.ts
```

### Running Tests
```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Documentation

### Code Documentation
- Add JSDoc comments for public APIs
- Include usage examples
- Document complex algorithms
- Add inline comments for unclear logic

### README Updates
- Update README.md for new features
- Add installation instructions for new dependencies
- Update configuration examples
- Add troubleshooting information

### API Documentation
- Update API reference for new endpoints
- Include request/response examples
- Document error codes and messages
- Add authentication requirements

## Pull Request Process

### Before Submitting PR
1. **Update Documentation**: Ensure all documentation is updated
2. **Run Tests**: All tests must pass locally
3. **Code Style**: Follow all coding standards
4. **Self-Review**: Review your own changes
5. **Update Changelog**: Add entry to CHANGELOG.md

### Creating Pull Request
1. **Push to Fork**: Push changes to your fork
2. **Create PR**: Create pull request to main branch
3. **Fill Template**: Complete the PR template
4. **Request Review**: Request review from maintainers
5. **Address Feedback**: Make requested changes

### PR Template
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
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass locally
- [ ] No merge conflicts
- [ ] Changelog updated

## Breaking Changes
[ ] This PR includes breaking changes
[ ] Migration instructions provided
[ ] Backward compatibility considered

## Additional Context
Any additional context about the changes
```

### Review Process
1. **Automated Checks**: CI/CD runs tests and checks
2. **Code Review**: Maintainers review code quality
3. **Functional Review**: Test functionality and edge cases
4. **Documentation Review**: Ensure documentation is accurate
5. **Approval**: PR approved and merged to main

## 🐛 Bug Reports

### Bug Report Template
```markdown
**Bug Description**
Clear and concise description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen

**Actual Behavior**
What actually happened

**Screenshots**
If applicable, add screenshots

**Environment**
- OS: [e.g. Ubuntu 20.04]
- Browser: [e.g. Chrome 91]
- Version: [e.g. v1.2.3]
- Node.js: [e.g. 18.0.0]

**Additional Context**
Add any other context about the problem
```

### Reporting Security Issues
- Do not open public issues for security vulnerabilities
- Email security@hostingco.com with details
- Include steps to reproduce
- We'll respond within 48 hours

## 💡 Feature Requests

### Feature Request Template
```markdown
**Feature Description**
Clear and concise description of the feature

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this feature to work?

**Alternatives Considered**
What other approaches did you consider?

**Additional Context**
Add any other context about the feature request
```

## Code Review Guidelines

### Review Criteria
- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code well-written and maintainable?
- **Performance**: Are there any performance concerns?
- **Security**: Are there any security vulnerabilities?
- **Testing**: Are tests comprehensive and appropriate?
- **Documentation**: Is the code well-documented?

### Review Process
1. **Automated Checks**: Ensure CI/CD passes
2. **Code Review**: Review code quality and structure
3. **Functional Review**: Test functionality manually
4. **Documentation Review**: Check documentation accuracy
5. **Approval**: Approve or request changes

### Giving Feedback
- Be constructive and specific
- Provide examples and suggestions
- Explain reasoning behind feedback
- Be respectful and professional
- Focus on code, not the person

## 🏆 Recognition

### Contributor Recognition
- Contributors listed in README.md
- Annual contributor awards
- Special recognition for significant contributions
- GitHub contribution statistics

### Contribution Types
- **Code**: Bug fixes, features, refactoring
- **Documentation**: Guides, tutorials, API docs
- **Testing**: Test cases, test improvements
- **Design**: UI/UX improvements, graphics
- **Community**: Support, feedback, discussions

## Resources

### Learning Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)

### Development Tools
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)

### Communication Channels
- [GitHub Discussions](https://github.com/your-org/hostingco-system/discussions)
- [Discord Server](https://discord.gg/your-invite)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/hostingco)

## Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Be patient and understanding
- Report inappropriate behavior

### Communication Guidelines
- Use clear and concise language
- Be professional and courteous
- Provide helpful and constructive feedback
- Ask questions when unsure
- Share knowledge and experience

## Release Process

### Release Schedule
- **Major Releases**: Quarterly (x.x.0)
- **Minor Releases**: Monthly (x.y.0)
- **Patch Releases**: As needed (x.y.z)

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Changelog updated
- [ ] Version number updated
- [ ] Tag created
- [ ] Release notes prepared

### Version Numbers
Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

## Getting Help

### Where to Ask
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: General questions and discussions
- **Discord**: Real-time chat and help
- **Email**: Private questions and security issues

### Common Issues
- **Setup Problems**: Check installation guide
- **Build Errors**: Check dependencies and versions
- **Test Failures**: Check test configuration
- **Deployment Issues**: Check deployment guide

### Troubleshooting Steps
1. Check documentation
2. Search existing issues
3. Ask in discussions
4. Create issue with details

## Contribution Checklist

### Before Starting
- [ ] Read contributing guidelines
- [ ] Set up development environment
- [ ] Understand project structure
- [ ] Check existing issues and PRs

### During Development
- [ ] Follow coding standards
- [ ] Write comprehensive tests
- [ ] Update documentation
- [ ] Test thoroughly

### Before Submitting
- [ ] Run all tests
- [ ] Check code style
- [ ] Update changelog
- [ ] Self-review changes

### After Submission
- [ ] Respond to feedback promptly
- [ ] Make requested changes
- [ ] Keep PR updated
- [ ] Celebrate contribution!

## Contribution Ideas

### Good First Issues
- Bug fixes with clear reproduction steps
- Documentation improvements
- Test coverage improvements
- Small feature additions

### Advanced Contributions
- Major feature development
- Architecture improvements
- Performance optimizations
- Security enhancements

### Non-Code Contributions
- User experience improvements
- Accessibility enhancements
- Internationalization support
- Community building

## 📈 Impact Metrics

### Contribution Metrics
- Number of contributors
- Pull requests merged
- Issues resolved
- Documentation improvements
- Test coverage improvements

### Quality Metrics
- Code review turnaround time
- Bug fix resolution time
- Test coverage percentage
- Documentation completeness
- User satisfaction

## Future Plans

### Roadmap
- [ ] Mobile app development
- [ ] Advanced analytics
- [ ] Multi-tenant support
- [ ] API versioning
- [ ] Performance improvements

### Community Goals
- [ ] Increase contributor diversity
- [ ] Improve documentation
- [ ] Enhance developer experience
- [ ] Expand community resources
- [ ] Build contributor recognition

---

Thank you for contributing to HostingCo! Your contributions help make this project better for everyone.

*Last updated: $(date)*
