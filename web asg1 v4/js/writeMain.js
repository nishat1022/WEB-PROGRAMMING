/**
 * ============================================
 * News Editor - Main JavaScript
 * Assignment 1: Frontend Integration & Client-Side CRUD
 * ============================================
 * 
 * Architecture Notes:
 * - All CRUD operations use localStorage (replaceable with API calls for future assignments)
 * - Document structure: { id, title, content, details, category, displayDate, createdAt, updatedAt }
 * - AI functions are simulated with JavaScript (replaceable with real AI API for future assignments)
 * - Service layer (DocumentService) abstracts storage -> easy to swap localStorage for backend
 */

'use strict';

// ============================================
// Document Service Layer (CRUD Operations)
// Abstracts localStorage - can be replaced with API calls in future assignments
// ============================================
const DocumentService = {
    STORAGE_KEY: 'ai_writing_editor_documents',

    /**
     * Initialize with sample data if no documents exist
     */
    init() {
        const existing = localStorage.getItem(this.STORAGE_KEY);
        if (!existing) {
            const sampleDocuments = this.getSampleDocuments();
            this.saveAll(sampleDocuments);
        } else {
            // Migration: add displayDate to existing documents that don't have it
            try {
                const docs = JSON.parse(existing);
                let migrated = false;
                docs.forEach(doc => {
                    if (!doc.displayDate) {
                        doc.displayDate = (doc.createdAt || doc.updatedAt || '').split('T')[0];
                        migrated = true;
                    }
                });
                if (migrated) {
                    this.saveAll(docs);
                }
            } catch (e) {
                // If parsing fails, reset with sample data
                this.saveAll(this.getSampleDocuments());
            }
        }
    },

    /**
     * Get all documents
     * @returns {Array} Array of document objects
     */
    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading documents:', e);
            return [];
        }
    },

    /**
     * Get a single document by ID
     * @param {string} id - Document ID
     * @returns {Object|null} Document object or null
     */
    getById(id) {
        const documents = this.getAll();
        return documents.find(doc => doc.id === id) || null;
    },

    /**
     * CREATE - Add a new document
     * @param {Object} doc - Document data { title, content, category }
     * @returns {Object} Created document with generated ID and timestamps
     */
    create(doc) {
        const documents = this.getAll();
        const now = new Date().toISOString();
        const newDoc = {
            id: this.generateId(),
            title: doc.title || 'Untitled Document',
            content: doc.content || '',
            details: doc.details || '',
            category: doc.category || 'research',
            displayDate: doc.displayDate || now.split('T')[0],
            createdAt: now,
            updatedAt: now
        };
        documents.unshift(newDoc);
        this.saveAll(documents);
        return newDoc;
    },

    /**
     * UPDATE - Update an existing document
     * @param {string} id - Document ID
     * @param {Object} updates - Fields to update { title, content, category }
     * @returns {Object|null} Updated document or null if not found
     */
    update(id, updates) {
        const documents = this.getAll();
        const index = documents.findIndex(doc => doc.id === id);
        if (index === -1) return null;

        documents[index] = {
            ...documents[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        this.saveAll(documents);
        return documents[index];
    },

    /**
     * DELETE - Remove a document by ID
     * @param {string} id - Document ID
     * @returns {boolean} True if deleted, false if not found
     */
    delete(id) {
        const documents = this.getAll();
        const filtered = documents.filter(doc => doc.id !== id);
        if (filtered.length === documents.length) return false;
        this.saveAll(filtered);
        return true;
    },

    /**
     * Search documents by title or content
     * @param {string} query - Search query
     * @returns {Array} Filtered documents
     */
    search(query) {
        const documents = this.getAll();
        const lowerQuery = query.toLowerCase();
        return documents.filter(doc =>
            doc.title.toLowerCase().includes(lowerQuery) ||
            doc.content.toLowerCase().includes(lowerQuery) ||
            (doc.details && doc.details.toLowerCase().includes(lowerQuery))
        );
    },

    /**
     * Filter documents by category
     * @param {string} category - Category to filter by
     * @returns {Array} Filtered documents
     */
    filterByCategory(category) {
        if (category === 'all') return this.getAll();
        return this.getAll().filter(doc => doc.category === category);
    },

    /**
     * Get document count
     * @returns {number} Number of documents
     */
    count() {
        return this.getAll().length;
    },

    // --- Private Helper Methods ---

    /**
     * Save all documents to localStorage
     * @param {Array} documents - Array of document objects
     */
    saveAll(documents) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(documents));
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID string
     */
    generateId() {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    },

    /**
     * Sample documents for initial load
     * @returns {Array} Sample document objects
     */
    getSampleDocuments() {
        return [
            {
                id: this.generateId(),
                title: 'Best Paper Award at International Conference on HCI 2024',
                content: 'I am honored to receive the Best Paper Award at the International Conference on Human-Computer Interaction 2024 for our research on emotion-aware interface design. This recognition highlights the importance of affective computing in creating more responsive and empathetic technology.',
                details: 'The paper titled "A Framework for Emotion-Aware Dialogue Systems in Educational Contexts" was selected from over 200 submissions. The award was presented at the conference opening ceremony in Copenhagen, Denmark.\n\nOur research demonstrates how integrating emotion recognition into dialogue systems can significantly improve student engagement and learning outcomes in online educational platforms. The framework utilizes multimodal input including text sentiment analysis, voice tone detection, and facial expression recognition to adapt the system\'s responses in real-time.',
                category: 'award',
                displayDate: '2024-01-15',
                createdAt: '2024-01-15T10:00:00.000Z',
                updatedAt: '2024-01-15T10:00:00.000Z'
            },
            {
                id: this.generateId(),
                title: 'Partnership with Infinite Loop Media',
                content: 'We are excited to announce a new industry collaboration with Infinite Loop Media, a leading creative technology company. This partnership will focus on immersive user experience research and interactive media design projects.',
                details: 'The collaboration will involve joint research projects, student internships, and knowledge transfer programs. Initial projects will explore the application of emotion recognition technology in interactive storytelling and virtual reality experiences.\n\nKey objectives of this partnership include developing next-generation interactive media prototypes, establishing a shared research laboratory, and co-supervising postgraduate research students in the areas of HCI and interactive media design.',
                category: 'collaboration',
                displayDate: '2023-12-08',
                createdAt: '2023-12-08T14:00:00.000Z',
                updatedAt: '2023-12-08T14:00:00.000Z'
            },
            {
                id: this.generateId(),
                title: 'Keynote Speaker at Guangzhou KEO Summit',
                content: 'I was honored to deliver a keynote address at the Guangzhou KEO Summit on "The Future of AI-Driven Human-Computer Interaction" to an international audience of researchers, industry professionals, and policymakers.',
                details: 'The summit brought together over 500 participants from 30 countries. My presentation focused on emerging trends in AI-powered interfaces, the ethical considerations of emotion-aware systems, and the potential impact on education and healthcare sectors.\n\nKey themes discussed included the convergence of AI and UX design, privacy-preserving emotion recognition techniques, and the role of cultural context in designing affective computing systems for global audiences.',
                category: 'talk',
                displayDate: '2023-11-22',
                createdAt: '2023-11-22T09:00:00.000Z',
                updatedAt: '2023-11-22T09:00:00.000Z'
            },
            {
                id: this.generateId(),
                title: 'Workshop on UX Design for Accessibility',
                content: 'Conducted a two-day intensive workshop on designing accessible user interfaces at the Faculty of Computing, UTM. The workshop attracted 50 participants from academia and industry.',
                details: 'Participants learned practical techniques for designing inclusive digital experiences, including screen reader compatibility, keyboard navigation, color contrast considerations, and assistive technology integration.\n\nThe workshop featured hands-on exercises using real-world case studies, live usability testing sessions with participants who have disabilities, and collaborative design sprints to address common accessibility challenges in web and mobile applications.',
                category: 'workshop',
                displayDate: '2023-10-15',
                createdAt: '2023-10-15T08:30:00.000Z',
                updatedAt: '2023-10-15T08:30:00.000Z'
            },
            {
                id: this.generateId(),
                title: 'Excellence in Research Award from UTM',
                content: 'Received the Excellence in Research Award from Universiti Teknologi Malaysia in recognition of outstanding research output and impact in the field of Human-Computer Interaction.',
                details: 'The award acknowledges sustained research productivity, successful grant acquisitions, and significant contributions to the academic community through publications and collaborative research initiatives.\n\nOver the past five years, our research group has published more than 80 papers in top-tier journals and conference proceedings, secured research grants totaling over RM 2 million, and graduated 15 PhD students who now hold positions at universities and tech companies worldwide.',
                category: 'award',
                displayDate: '2023-09-05',
                createdAt: '2023-09-05T11:00:00.000Z',
                updatedAt: '2023-09-05T11:00:00.000Z'
            },
            {
                id: this.generateId(),
                title: 'AI in Education Workshop Series',
                content: 'Launched a workshop series on AI applications in education, bringing together educators, technologists, and policymakers to explore the potential of AI in transforming learning experiences.',
                details: 'The series includes hands-on sessions on implementing AI tools in classrooms, ethical considerations, and strategies for ensuring equitable access to AI-enhanced education.\n\nTopics covered in the series include automated grading and feedback systems, intelligent tutoring systems, adaptive learning platforms, and the use of natural language processing for educational content analysis and generation.',
                category: 'workshop',
                displayDate: '2023-05-20',
                createdAt: '2023-05-20T13:00:00.000Z',
                updatedAt: '2023-05-20T13:00:00.000Z'
            }
        ];
    }
};


// ============================================
// AI Mock Service
// Simulates AI writing assistance (no real API required)
// Replace with real AI API calls in future assignments
// ============================================
const AIService = {
    /**
     * Simulate "Improve Writing" AI function
     * Enhances the text by improving vocabulary, sentence structure, and flow
     * @param {string} text - Original text
     * @returns {Promise<Object>} { original, improved, changes }
     */
    async improveWriting(text) {
        // Simulate network delay
        await this.simulateDelay(1500, 2500);

        if (!text || text.trim().length === 0) {
            return { error: 'No content to improve. Please write some text first.' };
        }

        // Simulated AI improvements
        let improved = text;

        // Apply simulated improvements
        const improvements = [
            { pattern: /\bgood\b/gi, replacement: 'excellent' },
            { pattern: /\bbad\b/gi, replacement: 'suboptimal' },
            { pattern: /\bbig\b/gi, replacement: 'substantial' },
            { pattern: /\bsmall\b/gi, replacement: 'modest' },
            { pattern: /\bimportant\b/gi, replacement: 'significant' },
            { pattern: /\bvery\b/gi, replacement: '' },
            { pattern: /\breally\b/gi, replacement: '' },
            { pattern: /\ba lot of\b/gi, replacement: 'numerous' },
            { pattern: /\bmake sure\b/gi, replacement: 'ensure' },
            { pattern: /\bget\b/gi, replacement: 'obtain' },
            { pattern: /\bhelp\b/gi, replacement: 'facilitate' },
            { pattern: /\buse\b/gi, replacement: 'utilize' },
            { pattern: /\bshow\b/gi, replacement: 'demonstrate' },
            { pattern: /\bneed\b/gi, replacement: 'require' },
            { pattern: /\bstart\b/gi, replacement: 'commence' },
            { pattern: /\bend\b/gi, replacement: 'conclude' },
            { pattern: /\bbut\b/gi, replacement: 'however' },
            { pattern: /\balso\b/gi, replacement: 'furthermore' },
            { pattern: /\bso\b/gi, replacement: 'consequently' },
            { pattern: /\bbecause\b/gi, replacement: 'due to the fact that' },
            { pattern: /\bthink\b/gi, replacement: 'consider' },
            { pattern: /\bthings\b/gi, replacement: 'elements' },
            { pattern: /\bstuff\b/gi, replacement: 'components' },
            { pattern: /\bfind out\b/gi, replacement: 'discover' },
            { pattern: /\blook into\b/gi, replacement: 'investigate' },
            { pattern: /\bcome up with\b/gi, replacement: 'develop' },
            { pattern: /\bpoint out\b/gi, replacement: 'highlight' },
            { pattern: /\bgo through\b/gi, replacement: 'review' },
            { pattern: /\bset up\b/gi, replacement: 'establish' },
            { pattern: /\bwork on\b/gi, replacement: 'develop' },
            { pattern: /\bfind\b/gi, replacement: 'identify' },
            { pattern: /\bgive\b/gi, replacement: 'provide' },
            { pattern: /\btell\b/gi, replacement: 'inform' },
            { pattern: /\btry\b/gi, replacement: 'attempt' },
            { pattern: /\bwant\b/gi, replacement: 'intend' },
            { pattern: /\blet\b/gi, replacement: 'allow' },
            { pattern: /\bkeep\b/gi, replacement: 'maintain' },
            { pattern: /\bbe able to\b/gi, replacement: 'be capable of' },
            { pattern: /\bmore and more\b/gi, replacement: 'increasingly' },
            { pattern: /\bin order to\b/gi, replacement: 'to' },
        ];

        let changeCount = 0;
        improvements.forEach(({ pattern, replacement }) => {
            const matches = improved.match(pattern);
            if (matches) {
                changeCount += matches.length;
                improved = improved.replace(pattern, replacement);
            }
        });

        // Clean up double spaces
        improved = improved.replace(/\s+/g, ' ').trim();

        // Add AI signature line
        improved += '\n\n[AI Enhanced: ' + changeCount + ' improvements applied]';

        return {
            original: text,
            improved: improved,
            changes: changeCount
        };
    },

    /**
     * Simulate "Summarize" AI function
     * Generates a concise summary of the document content
     * @param {string} text - Original text
     * @returns {Promise<Object>} { original, summary, wordCounts }
     */
    async summarize(text) {
        // Simulate network delay
        await this.simulateDelay(1000, 2000);

        if (!text || text.trim().length === 0) {
            return { error: 'No content to summarize. Please write some text first.' };
        }

        // Simulated summarization logic
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

        let summary = '';

        if (sentences.length <= 3) {
            // Short text - return as is
            summary = text.trim();
        } else {
            // Take first sentence as topic sentence
            const topicSentence = sentences[0].trim();

            // Take sentences with key indicators
            const keyIndicators = [
                /\b(however|furthermore|moreover|additionally|significantly|importantly|notably|key|main|primary|crucial|essential|demonstrate|highlight|revealed|found|show)\b/i
            ];

            let keySentences = sentences.filter(s =>
                keyIndicators.some(pattern => pattern.test(s))
            );

            // If we don't have enough key sentences, add from middle
            if (keySentences.length < 2) {
                const middleIndex = Math.floor(sentences.length / 2);
                keySentences.push(sentences[middleIndex]);
            }

            // Build summary
            summary = topicSentence + '. ' + keySentences.slice(0, 3).map(s => s.trim()).join('. ') + '.';

            // If summary is longer than original, trim it
            if (summary.length > text.length * 0.6) {
                summary = topicSentence + '. ' + keySentences.slice(0, 2).map(s => s.trim()).join('. ') + '.';
            }

            summary = summary.replace(/\s+/g, ' ').trim();
        }

        const summaryWordCount = summary.split(/\s+/).filter(w => w.length > 0).length;
        const reduction = Math.round((1 - summaryWordCount / wordCount) * 100);

        return {
            original: text,
            summary: 'Summary:\n\n' + summary + '\n\n[AI Summary: Reduced from ' + wordCount + ' to ' + summaryWordCount + ' words (' + reduction + '% reduction)]',
            wordCounts: {
                original: wordCount,
                summary: summaryWordCount,
                reduction: reduction
            }
        };
    },

    /**
     * Simulate AI processing delay
     * @param {number} min - Minimum delay in ms
     * @param {number} max - Maximum delay in ms
     * @returns {Promise<void>}
     */
    async simulateDelay(min, max) {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        return new Promise(resolve => setTimeout(resolve, delay));
    }
};


// ============================================
// UI Controller
// Manages DOM interactions and state
// ============================================
const UIController = {
    currentDocumentId: null,
    currentCategory: 'all',
    currentSearch: '',
    isModified: false,
    isViewMode: false,
    deleteTargetId: null,
    aiPendingResult: null,
    aiResultType: null,

    /**
     * Initialize the application
     */
    init() {
        DocumentService.init();
        this.cacheDOMElements();
        this.bindEvents();
        this.renderDocumentList();
        this.updateDocumentCount();
        this.initTheme();
    },

    /**
     * Cache frequently accessed DOM elements
     */
    cacheDOMElements() {
        // Document List
        this.documentListEl = document.getElementById('document-list');
        this.emptyStateEl = document.getElementById('empty-state');
        this.documentCountEl = document.getElementById('document-count');
        this.searchInputEl = document.getElementById('search-input');

        // Editor
        this.editorPanel = document.getElementById('editor-panel');
        this.editorEmpty = document.getElementById('editor-empty');
        this.editorActive = document.getElementById('editor-active');
        this.editorStatus = document.getElementById('editor-status');
        this.docTitleInput = document.getElementById('doc-title');
        this.docCategorySelect = document.getElementById('doc-category');
        this.docContentTextarea = document.getElementById('doc-content');
        this.docDetailsTextarea = document.getElementById('doc-details');
        this.docDisplayDateInput = document.getElementById('doc-display-date');
        this.docCreatedEl = document.getElementById('doc-created');
        this.docModifiedEl = document.getElementById('doc-modified');

        // AI
        this.aiStatus = document.getElementById('ai-status');
        this.aiResult = document.getElementById('ai-result');
        this.aiResultTitle = document.getElementById('ai-result-title');
        this.aiResultBody = document.getElementById('ai-result-body');

        // View mode
        this.docView = document.getElementById('doc-view');
        this.viewTitle = document.getElementById('view-title');
        this.viewCategory = document.getElementById('view-category');
        this.viewDates = document.getElementById('view-dates');
        this.viewBody = document.getElementById('view-body');

        // Modals
        this.deleteModal = document.getElementById('delete-modal');
        this.aboutModal = document.getElementById('about-modal');
        this.deleteDocNameEl = document.getElementById('delete-doc-name');

        // Toast
        this.toastContainer = document.getElementById('toast-container');
    },

    /**
     * Bind all event listeners
     */
    bindEvents() {
        // New Document
        document.getElementById('btn-new-document').addEventListener('click', () => this.createNewDocument());
        document.getElementById('btn-empty-new').addEventListener('click', () => this.createNewDocument());

        // View / Edit mode toggle
        document.getElementById('btn-mode-view').addEventListener('click', () => this.setViewMode(true));
        document.getElementById('btn-mode-edit').addEventListener('click', () => this.setViewMode(false));

        // Back button
        document.getElementById('btn-back').addEventListener('click', () => this.closeEditor());

        // Save
        document.getElementById('btn-save').addEventListener('click', () => this.saveCurrentDocument());

        // Delete
        document.getElementById('btn-delete').addEventListener('click', () => this.showDeleteModal());

        // Delete modal
        document.getElementById('btn-cancel-delete').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('btn-cancel-delete-2').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('btn-confirm-delete').addEventListener('click', () => this.confirmDelete());

        // About modal
        document.getElementById('nav-about').addEventListener('click', (e) => { e.preventDefault(); this.showAboutModal(); });
        document.getElementById('btn-close-about').addEventListener('click', () => this.hideAboutModal());
        document.getElementById('btn-close-about-2').addEventListener('click', () => this.hideAboutModal());

        // AI buttons
        document.getElementById('btn-improve').addEventListener('click', () => this.handleImproveWriting());
        document.getElementById('btn-summarize').addEventListener('click', () => this.handleSummarize());
        document.getElementById('btn-apply-ai').addEventListener('click', () => this.applyAIResult());
        document.getElementById('btn-dismiss-ai').addEventListener('click', () => this.hideAIResult());
        document.getElementById('btn-close-ai-result').addEventListener('click', () => this.hideAIResult());

        // Search
        this.searchInputEl.addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.renderDocumentList();
        });

        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('category-btn--active'));
                e.target.classList.add('category-btn--active');
                this.currentCategory = e.target.dataset.category;
                this.renderDocumentList();
            });
        });

        // Track editor modifications
        this.docTitleInput.addEventListener('input', () => this.markModified());
        this.docCategorySelect.addEventListener('change', () => this.markModified());
        this.docContentTextarea.addEventListener('input', () => this.markModified());
        this.docDetailsTextarea.addEventListener('input', () => this.markModified());
        this.docDisplayDateInput.addEventListener('change', () => this.markModified());

        // Close modals on overlay click
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) this.hideDeleteModal();
        });
        this.aboutModal.addEventListener('click', (e) => {
            if (e.target === this.aboutModal) this.hideAboutModal();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                if (this.deleteModal.style.display !== 'none') this.hideDeleteModal();
                if (this.aboutModal.style.display !== 'none') this.hideAboutModal();
                if (this.aiResult.style.display !== 'none') this.hideAIResult();
            }
            // Ctrl+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.currentDocumentId) this.saveCurrentDocument();
            }
        });

        // Navigation toggle (mobile)
        document.querySelector('.nav__toggle').addEventListener('click', function () {
            const menu = document.getElementById('nav-menu');
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            menu.classList.toggle('nav__menu--open');
        });

        // Theme toggle
        document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());
    },

    // ==========================================
    // Document List Rendering
    // ==========================================

    /**
     * Render the document list based on current filters
     */
    renderDocumentList() {
        let documents;

        if (this.currentSearch) {
            documents = DocumentService.search(this.currentSearch);
        } else {
            documents = DocumentService.filterByCategory(this.currentCategory);
        }

        // Sort by updatedAt (newest first)
        documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

        // Show/hide empty state
        if (documents.length === 0) {
            this.documentListEl.style.display = 'none';
            this.emptyStateEl.classList.add('empty-state--visible');
            if (this.currentSearch) {
                this.emptyStateEl.querySelector('h3').textContent = 'No results found';
                this.emptyStateEl.querySelector('p').textContent = 'Try a different search term.';
            } else {
                this.emptyStateEl.querySelector('h3').textContent = 'No documents yet';
                this.emptyStateEl.querySelector('p').textContent = 'Click "New Document" to create your first document.';
            }
        } else {
            this.documentListEl.style.display = 'block';
            this.emptyStateEl.classList.remove('empty-state--visible');
        }

        // Render document cards
        this.documentListEl.innerHTML = documents.map(doc => `
            <div class="doc-card ${doc.id === this.currentDocumentId ? 'doc-card--active' : ''}"
                 role="listitem"
                 data-id="${doc.id}"
                 tabindex="0"
                 aria-label="${this.escapeHTML(doc.title)}">
                <div class="doc-card__header">
                    <h3 class="doc-card__title">${this.escapeHTML(doc.title)}</h3>
                    <span class="doc-card__category doc-card__category--${doc.category}">${this.getCategoryLabel(doc.category)}</span>
                </div>
                <p class="doc-card__excerpt">${this.escapeHTML(doc.content.substring(0, 120))}${doc.content.length > 120 ? '...' : ''}</p>
                <div class="doc-card__meta">
                    <span class="doc-card__date">
                        ${this.formatDisplayDate(doc.displayDate) || this.formatDate(doc.updatedAt)}
                    </span>
                    <span class="doc-card__dot"></span>
                    <span>${this.countWords(doc.content)} words</span>
                </div>
            </div>
        `).join('');

        // Bind click events on document cards
        this.documentListEl.querySelectorAll('.doc-card').forEach(card => {
            card.addEventListener('click', () => {
                this.openDocument(card.dataset.id);
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openDocument(card.dataset.id);
                }
            });
        });

        this.updateDocumentCount();
    },

    /**
     * Update the document count display
     */
    updateDocumentCount() {
        const count = DocumentService.count();
        this.documentCountEl.textContent = count + (count === 1 ? ' document' : ' documents');
    },

    // ==========================================
    // CRUD Operations (UI)
    // ==========================================

    /**
     * CREATE - Create a new document and open editor
     */
    createNewDocument() {
        const newDoc = DocumentService.create({
            title: 'Untitled Document',
            content: '',
            category: this.currentCategory !== 'all' ? this.currentCategory : 'research'
        });
        this.renderDocumentList();
        this.openDocument(newDoc.id);
        // Focus on title input
        setTimeout(() => {
            this.docTitleInput.focus();
            this.docTitleInput.select();
        }, 100);
        this.showToast('New document created', 'success');
        // Notify news.html page about the update
        try {
            const channel = new BroadcastChannel('news-sync');
            channel.postMessage({ type: 'documents-updated' });
            channel.close();
        } catch(e) { /* BroadcastChannel not supported */ }
    },

    /**
     * READ - Open a document in the editor
     * @param {string} id - Document ID
     */
    openDocument(id) {
        const doc = DocumentService.getById(id);
        if (!doc) return;

        this.currentDocumentId = id;
        this.isModified = false;
        this.isViewMode = false;

        // Populate editor
        this.docTitleInput.value = doc.title;
        this.docCategorySelect.value = doc.category;
        this.docContentTextarea.value = doc.content;
        this.docDetailsTextarea.value = doc.details || '';
        this.docDisplayDateInput.value = doc.displayDate || '';
        this.docCreatedEl.textContent = this.formatDateTime(doc.createdAt);
        this.docModifiedEl.textContent = this.formatDateTime(doc.updatedAt);

        // Show editor
        this.editorEmpty.style.display = 'none';
        this.editorActive.style.display = 'flex';
        this.setViewMode(false);

        // Update status
        this.editorStatus.textContent = 'Editing';
        this.editorStatus.className = 'editor-status';

        // Hide AI result
        this.hideAIResult();

        // Update document list active state
        this.renderDocumentList();

        // Close mobile nav
        document.getElementById('nav-menu').classList.remove('nav__menu--open');
    },

    /**
     * UPDATE - Save current document changes
     */
    saveCurrentDocument() {
        if (!this.currentDocumentId) return;

        const title = this.docTitleInput.value.trim();
        if (!title) {
            this.showToast('Title cannot be empty', 'danger');
            this.docTitleInput.focus();
            return;
        }

        const updated = DocumentService.update(this.currentDocumentId, {
            title: title,
            content: this.docContentTextarea.value,
            details: this.docDetailsTextarea.value,
            category: this.docCategorySelect.value,
            displayDate: this.docDisplayDateInput.value
        });

        if (updated) {
            this.isModified = false;
            this.docModifiedEl.textContent = this.formatDateTime(updated.updatedAt);
            this.editorStatus.textContent = 'Saved';
            this.editorStatus.className = 'editor-status';
            this.renderDocumentList();
            this.showToast('Document saved successfully', 'success');
            // Notify news.html page about the update
            try {
                const channel = new BroadcastChannel('news-sync');
                channel.postMessage({ type: 'documents-updated' });
                channel.close();
            } catch(e) { /* BroadcastChannel not supported */ }
        }
    },

    /**
     * DELETE - Show delete confirmation modal
     */
    showDeleteModal() {
        if (!this.currentDocumentId) return;
        const doc = DocumentService.getById(this.currentDocumentId);
        if (!doc) return;

        this.deleteTargetId = this.currentDocumentId;
        this.deleteDocNameEl.textContent = doc.title;
        this.deleteModal.style.display = 'flex';
        document.getElementById('btn-confirm-delete').focus();
    },

    /**
     * Confirm delete operation
     */
    confirmDelete() {
        if (!this.deleteTargetId) return;

        const success = DocumentService.delete(this.deleteTargetId);
        if (success) {
            this.hideDeleteModal();
            this.closeEditor();
            this.renderDocumentList();
            this.showToast('Document deleted', 'danger');
            this.deleteTargetId = null;
            // Notify news.html page about the update
            try {
                const channel = new BroadcastChannel('news-sync');
                channel.postMessage({ type: 'documents-updated' });
                channel.close();
            } catch(e) { /* BroadcastChannel not supported */ }
        }
    },

    /**
     * Hide delete confirmation modal
     */
    hideDeleteModal() {
        this.deleteModal.style.display = 'none';
        this.deleteTargetId = null;
    },

    /**
     * Close the editor and return to empty state
     */
    closeEditor() {
        if (this.isModified) {
            const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
            if (!confirmed) return;
        }

        this.currentDocumentId = null;
        this.isModified = false;
        this.editorEmpty.style.display = 'flex';
        this.editorActive.style.display = 'none';
        this.hideAIResult();
        this.renderDocumentList();
    },

    /**
     * Switch between View and Edit mode
     * @param {boolean} viewMode - true = view, false = edit
     */
    setViewMode(viewMode) {
        this.isViewMode = viewMode;

        const btnView = document.getElementById('btn-mode-view');
        const btnEdit = document.getElementById('btn-mode-edit');
        const btnSave = document.getElementById('btn-save');
        const btnDelete = document.getElementById('btn-delete');
        const aiToolbar = document.getElementById('ai-toolbar');

        if (viewMode) {
            // Populate view panel from current doc
            const doc = DocumentService.getById(this.currentDocumentId);
            if (!doc) return;

            this.viewTitle.textContent = doc.title;
            this.viewCategory.textContent = this.getCategoryLabel(doc.category);
            this.viewCategory.className = 'doc-view__category doc-view__category--' + doc.category;
            const displayDateStr = doc.displayDate ? this.formatDisplayDate(doc.displayDate) : 'Not set';
            this.viewDates.textContent = 'News Date: ' + displayDateStr + '  ·  Created ' + this.formatDateTime(doc.createdAt) + '  ·  Updated ' + this.formatDateTime(doc.updatedAt);
            // Render content: preserve line breaks, show summary and details separately
            let viewHTML = '';
            if (doc.content) {
                viewHTML += '<p class="doc-view__excerpt">' + this.escapeHTML(doc.content).replace(/\n/g, '<br>') + '</p>';
            }
            if (doc.details) {
                viewHTML += '<div class="doc-view__details"><h4>Additional Details</h4><p>' + this.escapeHTML(doc.details).replace(/\n/g, '<br>') + '</p></div>';
            }
            this.viewBody.innerHTML = viewHTML;

            // Show view, hide editor inputs
            this.docView.style.display = 'block';
            document.querySelectorAll('.editor-body').forEach(el => el.style.display = 'none');
            aiToolbar.style.display = 'none';
            this.hideAIResult();

            // Toggle buttons
            btnView.classList.add('mode-toggle__btn--active');
            btnView.setAttribute('aria-pressed', 'true');
            btnEdit.classList.remove('mode-toggle__btn--active');
            btnEdit.setAttribute('aria-pressed', 'false');

            // Hide save/delete in view mode
            btnSave.style.display = 'none';
            btnDelete.style.display = 'none';

            this.editorStatus.textContent = 'Viewing';
            this.editorStatus.className = 'editor-status';
        } else {
            // Show editor inputs, hide view panel
            this.docView.style.display = 'none';
            document.querySelectorAll('.editor-body').forEach(el => el.style.display = 'block');
            aiToolbar.style.display = 'flex';

            // Toggle buttons
            btnEdit.classList.add('mode-toggle__btn--active');
            btnEdit.setAttribute('aria-pressed', 'true');
            btnView.classList.remove('mode-toggle__btn--active');
            btnView.setAttribute('aria-pressed', 'false');

            // Restore save/delete
            btnSave.style.display = '';
            btnDelete.style.display = '';

            this.editorStatus.textContent = this.isModified ? 'Unsaved changes' : 'Editing';
            this.editorStatus.className = this.isModified ? 'editor-status editor-status--unsaved' : 'editor-status';
        }
    },

    /**
     * Mark current document as modified
     */
    markModified() {
        if (!this.currentDocumentId) return;
        this.isModified = true;
        this.editorStatus.textContent = 'Unsaved changes';
        this.editorStatus.className = 'editor-status editor-status--unsaved';
    },

    // ==========================================
    // AI Writing Tools
    // ==========================================

    /**
     * Handle "Improve Writing" button click
     */
    async handleImproveWriting() {
        const content = this.docContentTextarea.value.trim();
        if (!content) {
            this.showToast('Please write some content first', 'info');
            return;
        }

        // Disable buttons and show loading
        this.setAIButtonsDisabled(true);
        this.aiStatus.textContent = 'AI is improving your writing...';

        try {
            const result = await AIService.improveWriting(content);
            if (result.error) {
                this.showToast(result.error, 'info');
            } else {
                this.aiPendingResult = result.improved;
                this.aiResultType = 'improve';
                this.aiResultTitle.textContent = 'Improved Writing (' + result.changes + ' changes)';
                this.aiResultBody.textContent = result.improved;
                this.aiResult.style.display = 'block';
                this.showToast('Writing improved with ' + result.changes + ' changes', 'success');
            }
        } catch (e) {
            this.showToast('AI processing failed', 'danger');
        } finally {
            this.setAIButtonsDisabled(false);
            this.aiStatus.textContent = '';
        }
    },

    /**
     * Handle "Summarize" button click
     */
    async handleSummarize() {
        const content = this.docContentTextarea.value.trim();
        if (!content) {
            this.showToast('Please write some content first', 'info');
            return;
        }

        // Disable buttons and show loading
        this.setAIButtonsDisabled(true);
        this.aiStatus.textContent = 'AI is summarizing your content...';

        try {
            const result = await AIService.summarize(content);
            if (result.error) {
                this.showToast(result.error, 'info');
            } else {
                this.aiPendingResult = result.summary;
                this.aiResultType = 'summarize';
                this.aiResultTitle.textContent = 'Summary (' + result.wordCounts.reduction + '% reduction)';
                this.aiResultBody.textContent = result.summary;
                this.aiResult.style.display = 'block';
                this.showToast('Content summarized successfully', 'success');
            }
        } catch (e) {
            this.showToast('AI processing failed', 'danger');
        } finally {
            this.setAIButtonsDisabled(false);
            this.aiStatus.textContent = '';
        }
    },

    /**
     * Apply AI result to editor
     */
    applyAIResult() {
        if (this.aiPendingResult) {
            this.docContentTextarea.value = this.aiPendingResult;
            this.markModified();
            this.hideAIResult();
            this.showToast('AI result applied to editor', 'success');
        }
    },

    /**
     * Hide AI result panel
     */
    hideAIResult() {
        this.aiResult.style.display = 'none';
        this.aiPendingResult = null;
        this.aiResultType = null;
    },

    /**
     * Enable/disable AI buttons during processing
     */
    setAIButtonsDisabled(disabled) {
        document.getElementById('btn-improve').disabled = disabled;
        document.getElementById('btn-summarize').disabled = disabled;
    },

    // ==========================================
    // Modals
    // ==========================================

    showAboutModal() {
        this.aboutModal.style.display = 'flex';
    },

    hideAboutModal() {
        this.aboutModal.style.display = 'none';
    },

    // ==========================================
    // Theme Toggle
    // ==========================================

    initTheme() {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('.theme-toggle').setAttribute('aria-pressed', 'true');
        }
    },

    toggleTheme() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.querySelector('.theme-toggle').setAttribute('aria-pressed', !isDark);
        localStorage.setItem('theme', newTheme);
    },

    // ==========================================
    // Toast Notifications
    // ==========================================

    /**
     * Show a toast notification
     * @param {string} message - Toast message
     * @param {string} type - 'success' | 'danger' | 'info'
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" aria-hidden="true">
                ${type === 'success' ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>' : ''}
                ${type === 'danger' ? '<circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line>' : ''}
                ${type === 'info' ? '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line>' : ''}
            </svg>
            <span>${this.escapeHTML(message)}</span>
        `;

        this.toastContainer.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('toast--removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ==========================================
    // Utility Functions
    // ==========================================

    /**
     * Escape HTML to prevent XSS
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Format date to readable string
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return days + ' days ago';
        if (days < 30) return Math.floor(days / 7) + ' weeks ago';

        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format displayDate (YYYY-MM-DD) to readable string
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     */
    formatDisplayDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Format date and time
     */
    formatDateTime(dateStr) {
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    /**
     * Get category display label
     */
    getCategoryLabel(category) {
        const labels = {
            award: 'Award',
            talk: 'Invited Talk',
            collaboration: 'Collaboration',
            research: 'Research',
            workshop: 'Workshop'
        };
        return labels[category] || category;
    },

    /**
     * Count words in text
     */
    countWords(text) {
        if (!text) return 0;
        return text.split(/\s+/).filter(w => w.length > 0).length;
    }
};


// ============================================
// Initialize Application
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    UIController.init();
});
