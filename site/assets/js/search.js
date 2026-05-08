// HostingCo Website - Search Functionality
// No AI-generated content - Handcrafted JavaScript

// Search Index Builder
class SearchIndex {
    constructor() {
        this.documents = [];
        this.index = {};
    }
    
    addDocument(doc) {
        const id = this.documents.length;
        this.documents.push(doc);
        this.indexDocument(doc, id);
    }
    
    indexDocument(doc, id) {
        const words = this.tokenize(doc.title + ' ' + doc.content + ' ' + doc.category);
        words.forEach(word => {
            if (!this.index[word]) {
                this.index[word] = [];
            }
            this.index[word].push(id);
        });
    }
    
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 1);
    }
    
    search(query) {
        const words = this.tokenize(query);
        const results = new Map();
        
        words.forEach(word => {
            const docIds = this.index[word] || [];
            docIds.forEach(id => {
                const score = results.get(id) || 0;
                results.set(id, score + 1);
            });
        });
        
        return Array.from(results.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([id, score]) => ({ ...this.documents[id], score }));
    }
}

// Search Manager
class SearchManager {
    constructor() {
        this.searchIndex = new SearchIndex();
        this.searchInput = null;
        this.searchResults = null;
        this.searchOverlay = null;
        this.isInitialized = false;
    }
    
    init() {
        this.searchInput = document.getElementById('searchInput');
        this.searchResults = document.getElementById('searchResults');
        this.searchOverlay = document.getElementById('searchOverlay');
        
        if (!this.searchInput || !this.searchResults || !this.searchOverlay) {
            return;
        }
        
        this.buildSearchIndex();
        this.bindEvents();
        this.isInitialized = true;
    }
    
    buildSearchIndex() {
        // Search data - in production, this would be generated from actual content
        const searchData = [
            {
                title: 'Quick Start Guide',
                url: 'docs/quick-start.html',
                content: 'Get HostingCo running in minutes with our step-by-step installation guide Clone repository Install dependencies Start development servers Frontend Backend API Health check verification',
                category: 'Getting Started',
                keywords: ['quick', 'start', 'installation', 'setup', 'begin', 'guide', 'tutorial']
            },
            {
                title: 'API Reference',
                url: 'docs/api-reference.html',
                content: 'Complete API documentation with examples and interactive testing tools REST endpoints Authentication JWT tokens Health check Dashboard stats Hosting plans Servers Billing Support tickets',
                category: 'API',
                keywords: ['api', 'reference', 'documentation', 'endpoints', 'rest', 'authentication', 'jwt']
            },
            {
                title: 'Installation Guide',
                url: 'docs/installation.html',
                content: 'Detailed installation instructions for various environments Manual setup Docker installation Prerequisites Node.js npm PostgreSQL Redis Environment configuration Build and start',
                category: 'Getting Started',
                keywords: ['installation', 'setup', 'install', 'docker', 'manual', 'environment', 'dependencies']
            },
            {
                title: 'System Architecture',
                url: 'docs/architecture.html',
                content: 'Understanding the system architecture components and design principles Frontend React TypeScript Backend Node.js Express Database PostgreSQL Redis Cache Microservices Monorepo structure',
                category: 'Architecture',
                keywords: ['architecture', 'design', 'components', 'structure', 'system', 'overview', 'technical']
            },
            {
                title: 'Security Guide',
                url: 'docs/security.html',
                content: 'Security best practices authentication and protection mechanisms JWT authentication Rate limiting CORS Helmet DDoS protection Password security Access control Audit logging',
                category: 'Security',
                keywords: ['security', 'authentication', 'protection', 'jwt', 'rate limiting', 'cors', 'safety']
            },
            {
                title: 'System Operations',
                url: 'docs/system-operations.html',
                content: 'Day-to-day operations monitoring maintenance and troubleshooting Startup shutdown procedures Health checks Log monitoring Performance optimization Database maintenance Backup operations Emergency procedures',
                category: 'Operations',
                keywords: ['operations', 'monitoring', 'maintenance', 'troubleshooting', 'health', 'logs', 'performance']
            },
            {
                title: 'Data Management',
                url: 'docs/data-management.html',
                content: 'Seed data configuration and database operations Users servers invoices support tickets Hosting plans configuration Database migrations Data operations Security considerations Backup and recovery',
                category: 'Data',
                keywords: ['data', 'database', 'seed', 'configuration', 'migrations', 'backup', 'recovery', 'operations']
            },
            {
                title: 'Deployment Guide',
                url: 'docs/deployment.html',
                content: 'Production deployment strategies Docker setup and CI/CD pipelines Docker Compose Nginx reverse proxy SSL certificates Environment variables Monitoring Logging Performance optimization',
                category: 'Deployment',
                keywords: ['deployment', 'production', 'docker', 'nginx', 'ssl', 'ci', 'cd', 'pipeline']
            },
            {
                title: 'Troubleshooting',
                url: 'docs/troubleshooting.html',
                content: 'Common issues and solutions for the HostingCo system Port conflicts Authentication issues Missing dependencies Services already running Database connection errors Performance issues Debug mode',
                category: 'Support',
                keywords: ['troubleshooting', 'issues', 'problems', 'solutions', 'debug', 'errors', 'fix', 'help']
            },
            {
                title: 'Database Design',
                url: 'docs/database.html',
                content: 'Database schema design and relationships PostgreSQL tables Users servers invoices support tickets Activity logs Payment methods Database migrations Performance optimization Indexes',
                category: 'Database',
                keywords: ['database', 'schema', 'postgresql', 'tables', 'relationships', 'migrations', 'indexes']
            },
            {
                title: 'Configuration Management',
                url: 'docs/configuration.html',
                content: 'System configuration and settings Environment variables Configuration files Security settings Database configuration Email settings Notification preferences',
                category: 'Configuration',
                keywords: ['configuration', 'settings', 'environment', 'variables', 'config', 'preferences']
            },
            {
                title: 'Testing Guide',
                url: 'docs/testing.html',
                content: 'Testing strategies and best practices Unit tests Integration tests End-to-end tests Test automation Code coverage CI/CD testing Performance testing Security testing',
                category: 'Testing',
                keywords: ['testing', 'tests', 'unit', 'integration', 'e2e', 'automation', 'coverage']
            }
        ];
        
        // Add documents to search index
        searchData.forEach(doc => {
            this.searchIndex.addDocument(doc);
        });
    }
    
    bindEvents() {
        let searchTimeout;
        
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                this.clearResults();
                return;
            }
            
            searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, 300);
        });
        
        // Keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.searchOverlay.classList.contains('active')) {
                this.closeSearch();
            }
        });
    }
    
    performSearch(query) {
        const results = this.searchIndex.search(query);
        this.displayResults(results, query);
    }
    
    displayResults(results, query) {
        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="search-empty">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                        <path d="M8 11h6"></path>
                    </svg>
                    <p>No results found for "<strong>${query}</strong>"</p>
                    <p class="search-suggestion">Try searching for: quick start, api, installation, security</p>
                </div>
            `;
            return;
        }
        
        const resultsHTML = results.map((result, index) => `
            <div class="search-result" data-index="${index}">
                <div class="search-result-category">${result.category}</div>
                <h4 class="search-result-title">
                    <a href="${result.url}">${this.highlightMatch(result.title, query)}</a>
                </h4>
                <p class="search-result-content">${this.highlightMatch(result.content, query)}</p>
                <div class="search-result-meta">
                    <span class="search-score">Score: ${result.score}</span>
                    <span class="search-shortcut">Press ${index + 1}</span>
                </div>
            </div>
        `).join('');
        
        this.searchResults.innerHTML = resultsHTML;
        
        // Add click handlers for results
        this.searchResults.querySelectorAll('.search-result a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.href = link.getAttribute('href');
                this.closeSearch();
            });
        });
    }
    
    highlightMatch(text, query) {
        if (!query) return text;
        
        const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    handleKeyNavigation(e) {
        const results = this.searchResults.querySelectorAll('.search-result');
        if (results.length === 0) return;
        
        let currentIndex = -1;
        const currentResult = this.searchResults.querySelector('.search-result.selected');
        if (currentResult) {
            currentIndex = parseInt(currentResult.dataset.index);
            currentResult.classList.remove('selected');
        }
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, results.length - 1);
                results[currentIndex].classList.add('selected');
                results[currentIndex].scrollIntoView({ block: 'nearest' });
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, 0);
                results[currentIndex].classList.add('selected');
                results[currentIndex].scrollIntoView({ block: 'nearest' });
                break;
                
            case 'Enter':
                e.preventDefault();
                if (currentIndex >= 0) {
                    const link = results[currentIndex].querySelector('a');
                    if (link) {
                        window.location.href = link.getAttribute('href');
                        this.closeSearch();
                    }
                }
                break;
                
            default:
                // Number keys 1-9 for quick navigation
                if (e.key >= '1' && e.key <= '9') {
                    const index = parseInt(e.key) - 1;
                    if (index < results.length) {
                        const link = results[index].querySelector('a');
                        if (link) {
                            window.location.href = link.getAttribute('href');
                            this.closeSearch();
                        }
                    }
                }
        }
    }
    
    clearResults() {
        this.searchResults.innerHTML = '';
    }
    
    closeSearch() {
        if (this.searchOverlay) {
            this.searchOverlay.classList.remove('active');
        }
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        this.clearResults();
    }
    
    openSearch() {
        if (this.searchOverlay) {
            this.searchOverlay.classList.add('active');
            this.searchInput.focus();
        }
    }
}

// Initialize search when DOM is ready
let searchManager;

document.addEventListener('DOMContentLoaded', function() {
    searchManager = new SearchManager();
    searchManager.init();
});

// Make search manager available globally
window.HostingCoSearch = searchManager;
