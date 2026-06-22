(function() {
    'use strict';

    // ==========================================================================
    // Utility Functions
    // ==========================================================================

    /**
     * Debounce function to limit how often a function can fire
     */
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

    /**
     * Check if element is in viewport
     */
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // ==========================================================================
    // Theme Toggle (Dark/Light Mode)
    // ==========================================================================

    const ThemeManager = {
        STORAGE_KEY: 'theme-preference',
        
        init() {
            this.toggleBtn = document.querySelector('.theme-toggle');
            if (!this.toggleBtn) return;
            
            // Check for saved preference or system preference
            const savedTheme = localStorage.getItem(this.STORAGE_KEY);
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            if (savedTheme) {
                this.setTheme(savedTheme);
            } else if (systemPrefersDark) {
                this.setTheme('dark');
            }
            
            // Listen for toggle click
            this.toggleBtn.addEventListener('click', () => this.toggle());
            
            // Listen for system theme changes
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                if (!localStorage.getItem(this.STORAGE_KEY)) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        },
        
        toggle() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
            localStorage.setItem(this.STORAGE_KEY, newTheme);
        },
        
        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            this.toggleBtn.setAttribute('aria-pressed', theme === 'dark');
        }
    };

    // ==========================================================================
    // Mobile Navigation
    // ==========================================================================

    const Navigation = {
        init() {
            this.toggleBtn = document.querySelector('.nav__toggle');
            this.menu = document.querySelector('.nav__menu');
            
            if (!this.toggleBtn || !this.menu) return;
            
            this.toggleBtn.addEventListener('click', () => this.toggle());
            
            // Close menu when clicking on a link
            const links = this.menu.querySelectorAll('.nav__link');
            links.forEach(link => {
                link.addEventListener('click', () => this.close());
            });
            
            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.menu.contains(e.target) && !this.toggleBtn.contains(e.target)) {
                    this.close();
                }
            });
            
            // Close menu on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen()) {
                    this.close();
                }
            });
        },
        
        toggle() {
            if (this.isOpen()) {
                this.close();
            } else {
                this.open();
            }
        },
        
        open() {
            this.menu.classList.add('nav__menu--open');
            this.toggleBtn.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        },
        
        close() {
            this.menu.classList.remove('nav__menu--open');
            this.toggleBtn.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        },
        
        isOpen() {
            return this.menu.classList.contains('nav__menu--open');
        }
    };

    // ==========================================================================
    // Smooth Scrolling for Anchor Links
    // ==========================================================================

    const SmoothScroll = {
        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const targetId = anchor.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        
                        // Update focus for accessibility
                        targetElement.setAttribute('tabindex', '-1');
                        targetElement.focus({ preventScroll: true });
                    }
                });
            });
        }
    };

    // ==========================================================================
    // Animated Counter for Statistics
    // ==========================================================================

    const AnimatedCounter = {
        init() {
            this.counters = document.querySelectorAll('.stat__number[data-count]');
            if (this.counters.length === 0) return;
            
            this.animated = new Set();
            this.checkVisibility();
            
            window.addEventListener('scroll', debounce(() => this.checkVisibility(), 100));
        },
        
        checkVisibility() {
            this.counters.forEach(counter => {
                if (this.animated.has(counter)) return;
                
                if (isInViewport(counter)) {
                    this.animate(counter);
                    this.animated.add(counter);
                }
            });
        },
        
        animate(counter) {
            const target = parseInt(counter.getAttribute('data-count'), 10);
            const duration = 2000; // 2 seconds
            const startTime = performance.now();
            const startValue = 0;
            
            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function (ease-out)
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentValue = Math.floor(startValue + (target - startValue) * easeOut);
                
                counter.textContent = currentValue.toLocaleString();
                
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString();
                }
            };
            
            requestAnimationFrame(updateCounter);
        }
    };

    // ==========================================================================
    // Publication Filtering
    // ==========================================================================

    const PublicationFilter = {
        init() {
            this.yearFilter = document.getElementById('filter-year');
            this.typeFilter = document.getElementById('filter-type');
            this.searchInput = document.getElementById('filter-search');
            this.clearBtn = document.getElementById('clear-filters');
            this.container = document.getElementById('publications-container');
            this.noResults = document.getElementById('no-results');
            
            if (!this.container) return;
            
            this.publications = Array.from(this.container.querySelectorAll('.publication'));
            
            // Bind events
            if (this.yearFilter) {
                this.yearFilter.addEventListener('change', () => this.filter());
            }
            if (this.typeFilter) {
                this.typeFilter.addEventListener('change', () => this.filter());
            }
            if (this.searchInput) {
                this.searchInput.addEventListener('input', debounce(() => this.filter(), 300));
            }
            if (this.clearBtn) {
                this.clearBtn.addEventListener('click', () => this.clear());
            }
            
            // Initialize citation toggles
            this.initCitationToggles();
        },
        
        filter() {
            const year = this.yearFilter ? this.yearFilter.value : 'all';
            const type = this.typeFilter ? this.typeFilter.value : 'all';
            const search = this.searchInput ? this.searchInput.value.toLowerCase().trim() : '';
            
            let visibleCount = 0;
            
            this.publications.forEach(pub => {
                const pubYear = pub.getAttribute('data-year');
                const pubType = pub.getAttribute('data-type');
                const pubText = pub.textContent.toLowerCase();
                
                const yearMatch = year === 'all' || 
                    (year === 'earlier' && parseInt(pubYear, 10) < 2020) || 
                    pubYear === year;
                const typeMatch = type === 'all' || pubType === type;
                const searchMatch = search === '' || pubText.includes(search);
                
                if (yearMatch && typeMatch && searchMatch) {
                    pub.style.display = '';
                    visibleCount++;
                } else {
                    pub.style.display = 'none';
                }
            });
            
            // Show/hide no results message
            if (this.noResults) {
                this.noResults.hidden = visibleCount > 0;
            }
        },
        
        clear() {
            if (this.yearFilter) this.yearFilter.value = 'all';
            if (this.typeFilter) this.typeFilter.value = 'all';
            if (this.searchInput) this.searchInput.value = '';
            this.filter();
        },
        
        initCitationToggles() {
            const citeButtons = document.querySelectorAll('.publication__cite-btn');
            
            citeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const targetId = btn.getAttribute('aria-controls');
                    const citation = document.getElementById(targetId);
                    
                    if (citation) {
                        const isHidden = citation.hidden;
                        citation.hidden = !isHidden;
                        btn.setAttribute('aria-expanded', isHidden);
                        btn.innerHTML = isHidden ? 
                            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> Hide Citation` : 
                            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> Cite`;
                    }
                });
            });
        }
    };

    // ==========================================================================
    // News Category Filtering
    // ==========================================================================

    const NewsFilter = {
        init() {
            this.buttons = document.querySelectorAll('.category-btn');
            this.newsItems = document.querySelectorAll('.news-item');
            
            if (this.buttons.length === 0) return;
            
            this.buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const category = btn.getAttribute('data-category');
                    this.filter(category);
                    this.updateActiveButton(btn);
                });
            });
        },
        
        filter(category) {
            this.newsItems.forEach(item => {
                if (category === 'all' || item.getAttribute('data-category') === category) {
                    item.style.display = '';
                } else {
                    item.style.display = 'none';
                }
            });
        },
        
        updateActiveButton(activeBtn) {
            this.buttons.forEach(btn => {
                btn.classList.remove('category-btn--active');
            });
            activeBtn.classList.add('category-btn--active');
        }
    };

    // ==========================================================================
    // Header Scroll Effect
    // ==========================================================================

    const HeaderScroll = {
        init() {
            this.header = document.querySelector('.header');
            if (!this.header) return;
            
            this.lastScroll = 0;
            this.scrollThreshold = 100;
            
            window.addEventListener('scroll', debounce(() => this.handleScroll(), 50));
        },
        
        handleScroll() {
            const currentScroll = window.pageYOffset;
            
            // Add shadow when scrolled
            if (currentScroll > this.scrollThreshold) {
                this.header.style.boxShadow = 'var(--shadow-md)';
            } else {
                this.header.style.boxShadow = 'none';
            }
            
            this.lastScroll = currentScroll;
        }
    };

    // ==========================================================================
    // Form Validation
    // ==========================================================================

    const FormValidation = {
        init() {
            this.forms = document.querySelectorAll('.contact-form');
            
            this.forms.forEach(form => {
                form.addEventListener('submit', (e) => this.validate(e));
            });
        },
        
        validate(e) {
            const form = e.target;
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                const errorSpan = field.parentElement.querySelector('.form-error');
                
                if (!field.value.trim()) {
                    isValid = false;
                    field.setAttribute('aria-invalid', 'true');
                    if (errorSpan) {
                        errorSpan.textContent = 'This field is required';
                    }
                } else if (field.type === 'email' && !this.isValidEmail(field.value)) {
                    isValid = false;
                    field.setAttribute('aria-invalid', 'true');
                    if (errorSpan) {
                        errorSpan.textContent = 'Please enter a valid email address';
                    }
                } else {
                    field.setAttribute('aria-invalid', 'false');
                    if (errorSpan) {
                        errorSpan.textContent = '';
                    }
                }
            });
            
            if (!isValid) {
                e.preventDefault();
            }
        },
        
        isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }
    };

    // ==========================================================================
    // Intersection Observer for Fade-in Animations
    // ==========================================================================

    const FadeInAnimation = {
        init() {
            // Check if IntersectionObserver is supported
            if (!('IntersectionObserver' in window)) return;
            
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            // Observe elements with fade-in class
            document.querySelectorAll('.research-card, .news-card, .publication, .course-card').forEach(el => {
                el.classList.add('fade-in');
                observer.observe(el);
            });
        }
    };

    // ==========================================================================
    // Keyboard Navigation Enhancement
    // ==========================================================================

    const KeyboardNavigation = {
        init() {
            // Add keyboard support for custom interactive elements
            document.querySelectorAll('[role="button"]').forEach(el => {
                el.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        el.click();
                    }
                });
            });
        }
    };

    // ==========================================================================
    // News Data Sync from Backend API
    // Assignment 2: Replaced localStorage with API fetch
    // ==========================================================================

    const NewsSync = {
        API_URL: 'api.php',

        chevronSVG: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline></svg>',

        init() {
            this.timelineList = document.querySelector('.timeline-list');
            if (!this.timelineList) return; // Not on news page

            // Set up Read More handler for hardcoded HTML items immediately
            this.setupReadMoreHandler();

            // Then try to fetch from API (will replace hardcoded items if successful)
            this.fetchAndRender();
            this.listenForChanges();
        },

        /**
         * Set up event delegation for Read More / Read Less buttons
         * Works for both hardcoded HTML items and API-rendered items
         */
        setupReadMoreHandler() {
            if (!this.timelineList) return;

            this._handleReadMoreClick = function(e) {
                const btn = e.target.closest('.news-item__read-more');
                if (!btn) return;

                const article = btn.closest('.news-item');
                if (!article) return;

                const expandable = article.querySelector('.news-item__expandable');
                if (!expandable) return;

                const isExpanded = expandable.classList.contains('news-item__expandable--expanded');

                if (isExpanded) {
                    expandable.classList.remove('news-item__expandable--expanded');
                    btn.classList.remove('news-item__read-more--expanded');
                    btn.setAttribute('aria-expanded', 'false');
                    btn.innerHTML = 'Read More ' + this.chevronSVG;
                } else {
                    // Close all other expanded items first (accordion behavior)
                    this.timelineList.querySelectorAll('.news-item__expandable--expanded').forEach(function(el) {
                        el.classList.remove('news-item__expandable--expanded');
                        var otherBtn = el.closest('.news-item').querySelector('.news-item__read-more');
                        if (otherBtn) {
                            otherBtn.classList.remove('news-item__read-more--expanded');
                            otherBtn.setAttribute('aria-expanded', 'false');
                            otherBtn.innerHTML = 'Read More ' + this.chevronSVG;
                        }
                    }.bind(this));

                    expandable.classList.add('news-item__expandable--expanded');
                    btn.classList.add('news-item__read-more--expanded');
                    btn.setAttribute('aria-expanded', 'true');
                    btn.innerHTML = 'Read Less ' + this.chevronSVG;

                    // Smooth scroll the expanded item into view
                    setTimeout(function() {
                        expandable.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 100);
                }
            }.bind(this);

            this.timelineList.addEventListener('click', this._handleReadMoreClick);
        },

        /**
         * Fetch documents from the API and render them into the timeline
         */
        async fetchAndRender() {
            try {
                const response = await fetch(this.API_URL);
                if (!response.ok) throw new Error('API error: ' + response.status);
                const documents = await response.json();

                if (!documents || documents.length === 0) return;

                // API already sorts by display_date DESC, but do a client-side sort too for safety
                documents.sort((a, b) => {
                    const dateA = a.displayDate ? new Date(a.displayDate + 'T00:00:00') : new Date(a.updatedAt || a.createdAt);
                    const dateB = b.displayDate ? new Date(b.displayDate + 'T00:00:00') : new Date(b.updatedAt || b.createdAt);
                    return dateB - dateA;
                });

                this.renderTimeline(documents);
            } catch (e) {
                console.error('NewsSync: Error fetching from API:', e);
                // Silently fall back to hardcoded items - they already have Read More
            }
            // Show a subtle indicator that we're using offline/hardcoded data
            this.showOfflineIndicator();
        },

        /**
         * Render documents into the timeline list
         */
        renderTimeline(documents) {
            if (!this.timelineList) return;

            const categoryLabels = {
                award: 'Award',
                talk: 'Invited Talk',
                collaboration: 'Collaboration',
                workshop: 'Workshop',
                research: 'Research'
            };

            this.timelineList.innerHTML = documents.map(doc => {
                const dateStr = doc.displayDate || (doc.updatedAt || doc.createdAt);
                const date = doc.displayDate ? new Date(doc.displayDate + 'T00:00:00') : new Date(dateStr);
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const month = monthNames[date.getMonth()];
                const day = date.getDate();
                const year = date.getFullYear();
                const category = doc.category || 'award';
                const categoryLabel = categoryLabels[category] || 'News';
                const content = doc.content || '';
                const details = doc.details || '';
                const imageUrl = doc.imageUrl || '';
                const title = this.escapeHTML(doc.title || 'Untitled');
                const categoryClass = 'news-item__category--' + category;
                const hasExpandable = !!(details || imageUrl);

                let html = '<article class="news-item" data-category="' + category + '">' +
                    '<div class="news-item__date">' +
                        '<span class="news-item__month">' + month + '</span>' +
                        '<span class="news-item__day">' + day + '</span>' +
                        '<span class="news-item__year">' + year + '</span>' +
                    '</div>' +
                    '<div class="news-item__content">' +
                        '<span class="news-item__category ' + categoryClass + '">' + categoryLabel + '</span>' +
                        '<h3 class="news-item__title">' + title + '</h3>' +
                        '<p class="news-item__excerpt">' + this.escapeHTML(content).replace(/\n/g, ' ') + '</p>';

                if (hasExpandable) {
                    html += '<div class="news-item__expandable">';

                    if (imageUrl) {
                        html += '<img class="news-item__image" src="' + this.escapeHTML(imageUrl) + '" alt="' + title + '" loading="lazy">';
                    }

                    if (details) {
                        html += '<p class="news-item__details-text">' + this.escapeHTML(details) + '</p>';
                    }

                    html += '</div>' +
                        '<button class="news-item__read-more" type="button" aria-expanded="false">' +
                            'Read More ' + this.chevronSVG +
                        '</button>';
                }

                html += '</div></article>';

                return html;
            }).join('');

            // Re-attach the Read More handler (already set up in init, but ensure it's fresh)
            // No need to remove/re-add since we're using the same handler reference
            // Re-initialize the NewsFilter for the new items
            if (typeof NewsFilter !== 'undefined' && NewsFilter.init) {
                NewsFilter.init();
            }
        },

        /**
         * Listen for changes from the editor via BroadcastChannel, then re-fetch from API
         */
        listenForChanges() {
            // BroadcastChannel for cross-tab real-time sync
            try {
                this.channel = new BroadcastChannel('news-sync');
                this.channel.onmessage = (event) => {
                    if (event.data && event.data.type === 'documents-updated') {
                        this.fetchAndRender();
                    }
                };
            } catch (e) {
                // BroadcastChannel not supported
            }

            // No storage event or localStorage polling needed —
            // all data comes from the API now
        },

        escapeHTML(str) {
            const div = document.createElement('div');
            div.appendChild(document.createTextNode(str));
            return div.innerHTML;
        }
    };

    // ==========================================================================
    // Scroll to Top Button
    // ==========================================================================

    const ScrollToTop = {
        init() {
            this.btn = document.getElementById('scroll-to-top');
            if (!this.btn) return;
            
            window.addEventListener('scroll', function() {
                if (window.pageYOffset > 400) {
                    ScrollToTop.btn.classList.add('scroll-to-top--visible');
                } else {
                    ScrollToTop.btn.classList.remove('scroll-to-top--visible');
                }
            });
            
            this.btn.addEventListener('click', function() {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    };

    // ==========================================================================
    // Initialize All Modules
    // ==========================================================================

    function init() {
        ThemeManager.init();
        Navigation.init();
        SmoothScroll.init();
        AnimatedCounter.init();
        PublicationFilter.init();
        NewsFilter.init();
        HeaderScroll.init();
        FormValidation.init();
        FadeInAnimation.init();
        KeyboardNavigation.init();
        NewsSync.init();
        ScrollToTop.init();
    }

    // Run initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
