// HostingCo Website - Navigation System
// No AI-generated content - Handcrafted JavaScript

// Navigation Controller
class NavigationController {
    constructor() {
        this.header = null;
        this.navLinks = null;
        this.mobileMenuToggle = null;
        this.navMenu = null;
        this.searchToggle = null;
        this.searchOverlay = null;
        this.lastScrollY = 0;
        this.scrollThreshold = 100;
        this.isInitialized = false;
    }
    
    init() {
        this.header = document.querySelector('.site-header');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.navMenu = document.querySelector('.nav-menu');
        this.searchToggle = document.getElementById('searchToggle');
        this.searchOverlay = document.getElementById('searchOverlay');
        
        if (!this.header) return;
        
        this.bindEvents();
        this.initializeActiveStates();
        this.initializeScrollEffects();
        this.isInitialized = true;
    }
    
    bindEvents() {
        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMobileMenu();
            });
        }
        
        // Search toggle
        if (this.searchToggle && this.searchOverlay) {
            this.searchToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSearch();
            });
        }
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.navMenu && !e.target.closest('.nav-menu') && !e.target.closest('.mobile-menu-toggle')) {
                this.closeMobileMenu();
            }
        });
        
        // Close search when clicking overlay
        if (this.searchOverlay) {
            this.searchOverlay.addEventListener('click', (e) => {
                if (e.target === this.searchOverlay) {
                    this.closeSearch();
                }
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
        
        // Scroll events
        window.addEventListener('scroll', () => {
            this.handleScroll();
        }, { passive: true });
        
        // Resize events
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }
    
    initializeActiveStates() {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            // Check exact path match
            if (href === currentPath.split('/').pop()) {
                link.classList.add('active');
                return;
            }
            
            // Check hash match
            if (currentHash && href === currentHash) {
                link.classList.add('active');
                return;
            }
            
            // Check parent path match
            if (currentPath.includes(href) && href !== '/') {
                link.classList.add('active');
            }
        });
    }
    
    initializeScrollEffects() {
        this.updateHeaderState();
    }
    
    handleScroll() {
        const currentScrollY = window.scrollY;
        
        // Update header appearance
        this.updateHeaderState();
        
        // Hide/show header on scroll
        if (currentScrollY > this.scrollThreshold) {
            if (currentScrollY > this.lastScrollY) {
                // Scrolling down
                this.header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                this.header.style.transform = 'translateY(0)';
            }
        } else {
            this.header.style.transform = 'translateY(0)';
        }
        
        this.lastScrollY = currentScrollY;
    }
    
    updateHeaderState() {
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            this.header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
            this.header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            this.header.style.backdropFilter = 'blur(12px)';
        } else {
            this.header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            this.header.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            this.header.style.backdropFilter = 'blur(10px)';
        }
    }
    
    handleKeyboardNavigation(e) {
        // Escape key
        if (e.key === 'Escape') {
            if (this.searchOverlay && this.searchOverlay.classList.contains('active')) {
                this.closeSearch();
            } else if (this.navMenu && this.navMenu.classList.contains('active')) {
                this.closeMobileMenu();
            }
        }
        
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            this.openSearch();
        }
        
        // Ctrl/Cmd + / for search (alternative)
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            this.openSearch();
        }
    }
    
    handleResize() {
        // Close mobile menu on resize to desktop
        if (window.innerWidth > 768 && this.navMenu && this.navMenu.classList.contains('active')) {
            this.closeMobileMenu();
        }
    }
    
    toggleMobileMenu() {
        if (!this.navMenu || !this.mobileMenuToggle) return;
        
        const isActive = this.navMenu.classList.contains('active');
        
        if (isActive) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }
    
    openMobileMenu() {
        if (!this.navMenu || !this.mobileMenuToggle) return;
        
        this.navMenu.classList.add('active');
        this.mobileMenuToggle.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first link
        const firstLink = this.navMenu.querySelector('.nav-link');
        if (firstLink) {
            firstLink.focus();
        }
    }
    
    closeMobileMenu() {
        if (!this.navMenu || !this.mobileMenuToggle) return;
        
        this.navMenu.classList.remove('active');
        this.mobileMenuToggle.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    openSearch() {
        if (!this.searchOverlay || !window.HostingCoSearch) return;
        
        this.searchOverlay.classList.add('active');
        window.HostingCoSearch.openSearch();
    }
    
    closeSearch() {
        if (!this.searchOverlay || !window.HostingCoSearch) return;
        
        this.searchOverlay.classList.remove('active');
        window.HostingCoSearch.closeSearch();
    }
    
    // Smooth scroll to anchor
    scrollToAnchor(anchorId, offset = 80) {
        const target = document.getElementById(anchorId);
        if (!target) return;
        
        const targetPosition = target.offsetTop - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
        
        // Update URL hash
        if (history.pushState) {
            history.pushState(null, null, `#${anchorId}`);
        }
    }
    
    // Update active navigation based on scroll position
    updateActiveOnScroll() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                this.navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
    
    // Add breadcrumb navigation
    createBreadcrumb() {
        const breadcrumbContainer = document.querySelector('.breadcrumb');
        if (!breadcrumbContainer) return;
        
        const pathParts = window.location.pathname.split('/').filter(part => part);
        const breadcrumbHTML = [
            '<li><a href="/">Home</a></li>'
        ];
        
        let currentPath = '';
        pathParts.forEach((part, index) => {
            currentPath += '/' + part;
            const isLast = index === pathParts.length - 1;
            
            if (isLast) {
                breadcrumbHTML.push(`<li class="current">${this.formatBreadcrumbTitle(part)}</li>`);
            } else {
                breadcrumbHTML.push(`<li><a href="${currentPath}">${this.formatBreadcrumbTitle(part)}</a></li>`);
            }
        });
        
        breadcrumbContainer.innerHTML = breadcrumbHTML.join('');
    }
    
    formatBreadcrumbTitle(part) {
        // Convert URL part to readable title
        return part
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
    
    // Progress indicator for long pages
    createProgressIndicator() {
        const progressBar = document.createElement('div');
        progressBar.className = 'reading-progress';
        progressBar.innerHTML = '<div class="progress-bar"></div>';
        document.body.appendChild(progressBar);
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.querySelector('.progress-bar').style.width = scrollPercent + '%';
        });
    }
    
    // Table of contents highlighting
    updateTOCOnScroll() {
        const tocLinks = document.querySelectorAll('.docs-toc-link');
        const sections = document.querySelectorAll('section[id], h2[id], h3[id]');
        
        if (tocLinks.length === 0 || sections.length === 0) return;
        
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                tocLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }
}

// Initialize navigation when DOM is ready
let navigationController;

document.addEventListener('DOMContentLoaded', function() {
    navigationController = new NavigationController();
    navigationController.init();
    
    // Initialize additional features
    navigationController.createBreadcrumb();
    navigationController.createProgressIndicator();
    
    // Update active states on scroll
    window.addEventListener('scroll', () => {
        navigationController.updateActiveOnScroll();
        navigationController.updateTOCOnScroll();
    }, { passive: true });
});

// Make navigation controller available globally
window.HostingCoNavigation = navigationController;
