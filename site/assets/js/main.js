// HostingCo Website - Main JavaScript
// No AI-generated content - Handcrafted JavaScript

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeNavigation();
    initializeSearch();
    initializeScrollEffects();
    initializeCodeBlocks();
    initializeTooltips();
    initializeModals();
    initializeTabs();
    initializeAccordions();
});

// Theme System
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const html = document.documentElement;
    
    // Check for saved theme preference or default to dark theme
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    
    // Apply theme (dark by default)
    if (savedTheme === 'light') {
        html.setAttribute('data-theme', 'light');
    } else if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
    } else if (systemPrefersLight) {
        html.setAttribute('data-theme', 'light');
    } else {
        // Default to dark theme
        html.setAttribute('data-theme', 'dark');
    }
    
    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Add animation class
            themeToggle.classList.add('theme-toggle-animate');
            setTimeout(() => {
                themeToggle.classList.remove('theme-toggle-animate');
            }, 300);
            
            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('themechange', {
                detail: { theme: newTheme }
            }));
        });
    }
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            // Only apply system preference if user hasn't manually set a theme
            const newTheme = e.matches ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            
            window.dispatchEvent(new CustomEvent('themechange', {
                detail: { theme: newTheme }
            }));
        }
    });
    
    // Listen for theme changes and update UI
    window.addEventListener('themechange', (e) => {
        updateThemeUI(e.detail.theme);
    });
    
    // Initial UI update
    const currentTheme = html.getAttribute('data-theme') || 'light';
    updateThemeUI(currentTheme);
}

function updateThemeUI(theme) {
    // Update any UI elements that depend on theme
    const themeIcons = document.querySelectorAll('.theme-icon');
    themeIcons.forEach(icon => {
        if (theme === 'dark') {
            icon.style.color = '#60a5fa'; // Lighter blue for dark theme
        } else {
            icon.style.color = ''; // Reset to default
        }
    });
    
    // Update any theme-dependent text or elements
    const themeTexts = document.querySelectorAll('[data-theme-text]');
    themeTexts.forEach(element => {
        const lightText = element.getAttribute('data-theme-light');
        const darkText = element.getAttribute('data-theme-dark');
        if (theme === 'dark' && darkText) {
            element.textContent = darkText;
        } else if (lightText) {
            element.textContent = lightText;
        }
    });
}

// Navigation System
function initializeNavigation() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-toggle')) {
            navMenu.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        }
    });
    
    // Active navigation highlighting
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
            link.classList.add('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.site-header').offsetHeight;
                const targetPosition = target.offsetTop - headerHeight - 20;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Search Functionality
function initializeSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    const searchClose = document.getElementById('searchClose');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchToggle || !searchOverlay) return;
    
    // Open search overlay
    searchToggle.addEventListener('click', function() {
        searchOverlay.classList.add('active');
        searchInput.focus();
    });
    
    // Close search overlay
    function closeSearch() {
        searchOverlay.classList.remove('active');
        searchInput.value = '';
        searchResults.innerHTML = '';
    }
    
    searchClose.addEventListener('click', closeSearch);
    
    searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) {
            closeSearch();
        }
    });
    
    // Escape key to close search
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            closeSearch();
        }
    });
    
    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();
        
        if (query.length < 2) {
            searchResults.innerHTML = '';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
}

// Search Implementation
function performSearch(query) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    // Search data - in a real implementation, this would come from a search index
    const searchData = [
        {
            title: 'Quick Start Guide',
            url: 'docs/quick-start.html',
            content: 'Get HostingCo running in minutes with our step-by-step installation guide',
            category: 'Getting Started'
        },
        {
            title: 'API Reference',
            url: 'docs/api-reference.html',
            content: 'Complete API documentation with examples and interactive testing tools',
            category: 'API'
        },
        {
            title: 'Installation Guide',
            url: 'docs/installation.html',
            content: 'Detailed installation instructions for various environments',
            category: 'Getting Started'
        },
        {
            title: 'System Architecture',
            url: 'docs/architecture.html',
            content: 'Understanding the system architecture, components, and design principles',
            category: 'Architecture'
        },
        {
            title: 'Security Guide',
            url: 'docs/security.html',
            content: 'Security best practices, authentication, and protection mechanisms',
            category: 'Security'
        },
        {
            title: 'System Operations',
            url: 'docs/system-operations.html',
            content: 'Day-to-day operations, monitoring, maintenance, and troubleshooting',
            category: 'Operations'
        },
        {
            title: 'Data Management',
            url: 'docs/data-management.html',
            content: 'Seed data, configuration, and database operations',
            category: 'Data'
        },
        {
            title: 'Deployment Guide',
            url: 'docs/deployment.html',
            content: 'Production deployment strategies, Docker setup, and CI/CD pipelines',
            category: 'Deployment'
        },
        {
            title: 'Troubleshooting',
            url: 'docs/troubleshooting.html',
            content: 'Common issues and solutions for the HostingCo system',
            category: 'Support'
        }
    ];
    
    // Perform search
    const results = searchData.filter(item => {
        const searchQuery = query.toLowerCase();
        return item.title.toLowerCase().includes(searchQuery) ||
               item.content.toLowerCase().includes(searchQuery) ||
               item.category.toLowerCase().includes(searchQuery);
    });
    
    // Display results
    if (results.length === 0) {
        searchResults.innerHTML = `
            <div class="search-empty">
                <p>No results found for "${query}"</p>
            </div>
        `;
        return;
    }
    
    const resultsHTML = results.map(result => `
        <div class="search-result">
            <div class="search-result-category">${result.category}</div>
            <h4 class="search-result-title">
                <a href="${result.url}">${result.title}</a>
            </h4>
            <p class="search-result-content">${result.content}</p>
        </div>
    `).join('');
    
    searchResults.innerHTML = resultsHTML;
}

// Scroll Effects
function initializeScrollEffects() {
    const header = document.querySelector('.site-header');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', function() {
        const currentScrollY = window.scrollY;
        
        // Header background opacity
        if (currentScrollY > 50) {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
        
        lastScrollY = currentScrollY;
    });
    
    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.feature-card, .doc-card, .tech-category').forEach(el => {
        observer.observe(el);
    });
}

// Code Blocks
function initializeCodeBlocks() {
    // Add copy functionality to code blocks
    document.querySelectorAll('pre code').forEach(block => {
        const button = document.createElement('button');
        button.className = 'code-copy';
        button.textContent = 'Copy';
        button.onclick = function() {
            navigator.clipboard.writeText(block.textContent).then(() => {
                button.textContent = 'Copied!';
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.classList.remove('copied');
                }, 2000);
            });
        };
        
        const pre = block.parentElement;
        if (pre && !pre.querySelector('.code-copy')) {
            pre.style.position = 'relative';
            pre.appendChild(button);
        }
    });
    
    // Add language labels to code blocks
    document.querySelectorAll('pre code').forEach(block => {
        const classes = block.className.split(' ');
        const languageClass = classes.find(cls => cls.startsWith('language-'));
        
        if (languageClass) {
            const language = languageClass.replace('language-', '');
            const pre = block.parentElement;
            
            if (pre && !pre.querySelector('.code-header')) {
                const header = document.createElement('div');
                header.className = 'code-header';
                header.innerHTML = `
                    <span class="code-language">${language}</span>
                `;
                pre.insertBefore(header, block);
            }
        }
    });
}

// Tooltips
function initializeTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip-popup';
            tooltip.textContent = this.getAttribute('data-tooltip');
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.position = 'fixed';
            tooltip.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
            tooltip.style.left = (rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            
            setTimeout(() => tooltip.classList.add('visible'), 10);
        });
        
        element.addEventListener('mouseleave', function() {
            const tooltip = document.querySelector('.tooltip-popup');
            if (tooltip) {
                tooltip.remove();
            }
        });
    });
}

// Modals
function initializeModals() {
    document.querySelectorAll('[data-modal]').forEach(trigger => {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
    });
}

// Tabs
function initializeTabs() {
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', function() {
            const tabContainer = this.closest('.tabs');
            const targetId = this.getAttribute('data-tab');
            const targetTab = document.getElementById(targetId);
            
            if (!tabContainer || !targetTab) return;
            
            // Remove active class from all buttons and content
            tabContainer.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('active');
            });
            tabContainer.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active class to clicked button and target content
            this.classList.add('active');
            targetTab.classList.add('active');
        });
    });
}

// Accordions
function initializeAccordions() {
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', function() {
            const accordionItem = this.closest('.accordion-item');
            const content = this.nextElementSibling;
            
            if (!accordionItem || !content) return;
            
            // Toggle current accordion
            accordionItem.classList.toggle('active');
            
            // Close other accordions in the same container
            const accordionContainer = this.closest('.accordion');
            if (accordionContainer) {
                accordionContainer.querySelectorAll('.accordion-item').forEach(item => {
                    if (item !== accordionItem && item.classList.contains('active')) {
                        item.classList.remove('active');
                    }
                });
            }
        });
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Form Validation (if needed)
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

// Loading States
function showLoading(element) {
    element.disabled = true;
    element.dataset.originalText = element.textContent;
    element.innerHTML = '<span class="spinner"></span> Loading...';
}

function hideLoading(element) {
    element.disabled = false;
    element.textContent = element.dataset.originalText;
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('visible'), 10);
    
    setTimeout(() => {
        notification.classList.remove('visible');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Export functions for external use
window.HostingCo = {
    showNotification,
    showLoading,
    hideLoading,
    validateForm,
    debounce,
    throttle
};
