'use strict';

const API_BASE_URL = 'api.php';


// ============================================
// Document Service Layer (CRUD Operations)
// ============================================
const DocumentService = {
    _cache: null,

    async init() {
        await this.refreshCache();
    },

    async refreshCache() {
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error('Failed to fetch documents');
            this._cache = await response.json();
        } catch (e) {
            console.error('DocumentService: Error fetching from API:', e);
            this._cache = this._cache || [];
            throw e;
        }
    },


    getAll() {
        return this._cache || [];
    },

    getById(id) {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        return this._cache.find(doc => doc.id === numId) || null;
    },

    async create(doc) {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: doc.title || 'Untitled News',
                content: doc.content || '',
                details: doc.details || '',
                category: doc.category || 'research',
                displayDate: doc.displayDate || new Date().toISOString().split('T')[0],
                imageUrl: doc.imageUrl || ''
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Create failed' }));
            throw new Error(err.error || 'Create failed');
        }

        const newDoc = await response.json();
        await this.refreshCache();
        return newDoc;
    },

    /**
     * UPDATE - Update an existing document via API
     * @param {number|string} id - Document ID
     * @param {Object} updates - Fields to update
     * @returns {Promise<Object|null>} Updated document from server
     */
    async update(id, updates) {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;

        const response = await fetch(API_BASE_URL + '?id=' + numId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Update failed' }));
            throw new Error(err.error || 'Update failed');
        }

        const updatedDoc = await response.json();
        await this.refreshCache();
        return updatedDoc;
    },

    /**
     * DELETE - Remove a document via API
     * @param {number|string} id - Document ID
     * @returns {Promise<boolean>} True if deleted
     */
    async delete(id) {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;

        const response = await fetch(API_BASE_URL + '?id=' + numId, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Delete failed' }));
            throw new Error(err.error || 'Delete failed');
        }

        await this.refreshCache();
        return true;
    },

    /**
     * Search documents by title, content, or details (client-side on cache)
     * @param {string} query - Search query
     * @returns {Array} Filtered documents
     */
    search(query) {
        const documents = this.getAll();
        const lowerQuery = query.toLowerCase();
        return documents.filter(doc =>
            doc.title.toLowerCase().includes(lowerQuery) ||
            (doc.content && doc.content.toLowerCase().includes(lowerQuery)) ||
            (doc.details && doc.details.toLowerCase().includes(lowerQuery))
        );
    },

    
     // Filter documents by category (client-side on cache)
    filterByCategory(category) {
        if (category === 'all') return this.getAll();
        return this.getAll().filter(doc => doc.category === category);
    },

    count() {
        return this.getAll().length;
    }
};


// ============================================
// AI Mock Service
// Simulates AI writing assistance (no real API required)
// ============================================
const AIService = {
    /**
     * Simulate "Improve Writing" AI function
     * @param {string} text - Original text
     * @returns {Promise<Object>} { original, improved, changes }
     */
    async improveWriting(text) {
        await this.simulateDelay(1500, 2500);

        if (!text || text.trim().length === 0) {
            return { error: 'No content to improve. Please write some text first.' };
        }

        let improved = text;

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

        improved = improved.replace(/\s+/g, ' ').trim();
        improved += '\n\n[AI Enhanced: ' + changeCount + ' improvements applied]';

        return { original: text, improved: improved, changes: changeCount };
    },

    /**
     * Simulate "Summarize" AI function
     * @param {string} text - Original text
     * @returns {Promise<Object>} { original, summary, wordCounts }
     */
    async summarize(text) {
        await this.simulateDelay(1000, 2000);

        if (!text || text.trim().length === 0) {
            return { error: 'No content to summarize. Please write some text first.' };
        }

        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

        let summary = '';

        if (sentences.length <= 3) {
            summary = text.trim();
        } else {
            const topicSentence = sentences[0].trim();
            const keyIndicators = [
                /\b(however|furthermore|moreover|additionally|significantly|importantly|notably|key|main|primary|crucial|essential|demonstrate|highlight|revealed|found|show)\b/i
            ];
            let keySentences = sentences.filter(s => keyIndicators.some(p => p.test(s)));
            if (keySentences.length < 2) {
                keySentences.push(sentences[Math.floor(sentences.length / 2)]);
            }
            summary = topicSentence + '. ' + keySentences.slice(0, 3).map(s => s.trim()).join('. ') + '.';
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
            wordCounts: { original: wordCount, summary: summaryWordCount, reduction: reduction }
        };
    },

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

    async init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.initTheme();

        // Fetch documents from API
        try {
            await DocumentService.init();
        } catch (e) {
            this.showToast('Failed to connect to database', 'danger');
        }

        this.renderDocumentList();
        this.updateDocumentCount();
    },

    cacheDOMElements() {
        this.documentListEl = document.getElementById('document-list');
        this.emptyStateEl = document.getElementById('empty-state');
        this.documentCountEl = document.getElementById('document-count');
        this.searchInputEl = document.getElementById('search-input');

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

        this.aiStatus = document.getElementById('ai-status');
        this.aiResult = document.getElementById('ai-result');
        this.aiResultTitle = document.getElementById('ai-result-title');
        this.aiResultBody = document.getElementById('ai-result-body');

        this.docView = document.getElementById('doc-view');
        this.viewTitle = document.getElementById('view-title');
        this.viewCategory = document.getElementById('view-category');
        this.viewDates = document.getElementById('view-dates');
        this.viewBody = document.getElementById('view-body');
        this.viewImage = document.getElementById('view-image');

        this.deleteModal = document.getElementById('delete-modal');
        this.aboutModal = document.getElementById('about-modal');
        this.deleteDocNameEl = document.getElementById('delete-doc-name');

        this.toastContainer = document.getElementById('toast-container');
    },

    bindEvents() {
        document.getElementById('btn-new-document').addEventListener('click', () => this.createNewDocument());
        document.getElementById('btn-empty-new').addEventListener('click', () => this.createNewDocument());

        document.getElementById('btn-mode-view').addEventListener('click', () => this.setViewMode(true));
        document.getElementById('btn-mode-edit').addEventListener('click', () => this.setViewMode(false));

        document.getElementById('btn-back').addEventListener('click', () => this.closeEditor());
        document.getElementById('btn-save').addEventListener('click', () => this.saveCurrentDocument());
        document.getElementById('btn-delete').addEventListener('click', () => this.showDeleteModal());

        document.getElementById('btn-cancel-delete').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('btn-cancel-delete-2').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('btn-confirm-delete').addEventListener('click', () => this.confirmDelete());

        document.getElementById('nav-about').addEventListener('click', (e) => { e.preventDefault(); this.showAboutModal(); });
        document.getElementById('btn-close-about').addEventListener('click', () => this.hideAboutModal());
        document.getElementById('btn-close-about-2').addEventListener('click', () => this.hideAboutModal());

        document.getElementById('btn-improve').addEventListener('click', () => this.handleImproveWriting());
        document.getElementById('btn-summarize').addEventListener('click', () => this.handleSummarize());
        document.getElementById('btn-apply-ai').addEventListener('click', () => this.applyAIResult());
        document.getElementById('btn-dismiss-ai').addEventListener('click', () => this.hideAIResult());
        document.getElementById('btn-close-ai-result').addEventListener('click', () => this.hideAIResult());

        this.searchInputEl.addEventListener('input', (e) => {
            this.currentSearch = e.target.value;
            this.renderDocumentList();
        });

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('category-btn--active'));
                e.target.classList.add('category-btn--active');
                this.currentCategory = e.target.dataset.category;
                this.renderDocumentList();
            });
        });

        this.docTitleInput.addEventListener('input', () => this.markModified());
        this.docCategorySelect.addEventListener('change', () => this.markModified());
        this.docContentTextarea.addEventListener('input', () => this.markModified());
        this.docDetailsTextarea.addEventListener('input', () => this.markModified());
        this.docDisplayDateInput.addEventListener('change', () => this.markModified());
        document.getElementById('doc-image-url').addEventListener('input', () => this.markModified());

        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) this.hideDeleteModal();
        });
        this.aboutModal.addEventListener('click', (e) => {
            if (e.target === this.aboutModal) this.hideAboutModal();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.deleteModal.style.display !== 'none') this.hideDeleteModal();
                if (this.aboutModal.style.display !== 'none') this.hideAboutModal();
                if (this.aiResult.style.display !== 'none') this.hideAIResult();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (this.currentDocumentId) this.saveCurrentDocument();
            }
        });

        document.querySelector('.nav__toggle').addEventListener('click', function () {
            const menu = document.getElementById('nav-menu');
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            menu.classList.toggle('nav__menu--open');
        });

        document.querySelector('.theme-toggle').addEventListener('click', () => this.toggleTheme());
    },

    // ==========================================
    // Document List Rendering
    // ==========================================

    renderDocumentList() {
        let documents;

        if (this.currentSearch) {
            documents = DocumentService.search(this.currentSearch);
        } else {
            documents = DocumentService.filterByCategory(this.currentCategory);
        }

        // Sort by displayDate (newest first), fallback to updatedAt
        documents.sort((a, b) => {
            const dateA = a.displayDate ? new Date(a.displayDate + 'T00:00:00') : new Date(a.updatedAt);
            const dateB = b.displayDate ? new Date(b.displayDate + 'T00:00:00') : new Date(b.updatedAt);
            return dateB - dateA;
        });

        if (documents.length === 0) {
            this.documentListEl.style.display = 'none';
            this.emptyStateEl.classList.add('empty-state--visible');
            if (this.currentSearch) {
                this.emptyStateEl.querySelector('h3').textContent = 'No results found';
                this.emptyStateEl.querySelector('p').textContent = 'Try a different search term.';
            } else {
                this.emptyStateEl.querySelector('h3').textContent = 'No news yet';
                this.emptyStateEl.querySelector('p').textContent = 'Click "Create News" to create your first news item.';
            }
        } else {
            this.documentListEl.style.display = 'block';
            this.emptyStateEl.classList.remove('empty-state--visible');
        }

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
                <p class="doc-card__excerpt">${this.escapeHTML((doc.content || '').substring(0, 120))}${(doc.content || '').length > 120 ? '...' : ''}</p>
                <div class="doc-card__meta">
                    <span class="doc-card__date">
                        ${this.formatDisplayDate(doc.displayDate) || this.formatDate(doc.updatedAt)}
                    </span>
                    <span class="doc-card__dot"></span>
                    <span>${this.countWords(doc.content || '')} words</span>
                </div>
            </div>
        `).join('');

        this.documentListEl.querySelectorAll('.doc-card').forEach(card => {
            card.addEventListener('click', () => this.openDocument(card.dataset.id));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.openDocument(card.dataset.id);
                }
            });
        });

        this.updateDocumentCount();
    },

    updateDocumentCount() {
        const count = DocumentService.count();
        this.documentCountEl.textContent = count + (count === 1 ? ' news item' : ' news items');
    },

    // ==========================================
    // CRUD Operations (UI)
    // ==========================================


     // CREATE - Create a new document and open editor
    async createNewDocument() {
        this.editorStatus.textContent = 'Saving...';
        this.editorStatus.className = 'editor-status';

        try {
            const newDoc = await DocumentService.create({
                title: 'Untitled News',
                content: '',
                category: this.currentCategory !== 'all' ? this.currentCategory : 'research'
            });
            this.renderDocumentList();
            this.openDocument(newDoc.id);
            setTimeout(() => {
                this.docTitleInput.focus();
                this.docTitleInput.select();
            }, 100);
            this.showToast('New news item created', 'success');
            this.notifyNewsPage();
        } catch (e) {
            this.editorStatus.textContent = 'Editing';
            this.showToast('Failed to create news item: ' + e.message, 'danger');
        }
    },

    
     // READ - Open a document in the editor (uses cache, no API call)

    openDocument(id) {
        const doc = DocumentService.getById(id);
        if (!doc) return;

        this.currentDocumentId = id;
        this.isModified = false;
        this.isViewMode = false;

        this.docTitleInput.value = doc.title;
        this.docCategorySelect.value = doc.category;
        this.docContentTextarea.value = doc.content || '';
        this.docDetailsTextarea.value = doc.details || '';
        this.docDisplayDateInput.value = doc.displayDate || '';
        document.getElementById('doc-image-url').value = doc.imageUrl || '';
        // Update image preview
        const previewContainer = document.getElementById('image-preview-container');
        const previewImg = document.getElementById('image-preview');
        if (doc.imageUrl) {
            previewImg.onerror = function() { previewContainer.style.display = 'none'; };
            previewImg.src = doc.imageUrl;
            previewContainer.style.display = 'block';
        } else {
            previewContainer.style.display = 'none';
        }
        this.docCreatedEl.textContent = this.formatDateTime(doc.createdAt);
        this.docModifiedEl.textContent = this.formatDateTime(doc.updatedAt);

        this.editorEmpty.style.display = 'none';
        this.editorActive.style.display = 'flex';
        this.setViewMode(false);

        this.editorStatus.textContent = 'Editing';
        this.editorStatus.className = 'editor-status';

        this.hideAIResult();
        this.renderDocumentList();

        document.getElementById('nav-menu').classList.remove('nav__menu--open');
    },


     // UPDATE - Save current document changes

    async saveCurrentDocument() {
        if (!this.currentDocumentId) return;

        const title = this.docTitleInput.value.trim();
        if (!title) {
            this.showToast('Title cannot be empty', 'danger');
            this.docTitleInput.focus();
            return;
        }

        this.editorStatus.textContent = 'Saving...';
        this.editorStatus.className = 'editor-status';

        try {
            const updated = await DocumentService.update(this.currentDocumentId, {
                title: title,
                content: this.docContentTextarea.value,
                details: this.docDetailsTextarea.value,
                category: this.docCategorySelect.value,
                displayDate: this.docDisplayDateInput.value,
                imageUrl: document.getElementById('doc-image-url').value.trim()
            });

            this.isModified = false;
            this.docModifiedEl.textContent = this.formatDateTime(updated.updatedAt);
            this.editorStatus.textContent = 'Saved';
            this.editorStatus.className = 'editor-status';
            this.renderDocumentList();
            this.showToast('News saved successfully', 'success');
            this.notifyNewsPage();
        } catch (e) {
            this.editorStatus.textContent = 'Editing';
            this.showToast('Failed to save: ' + e.message, 'danger');
        }
    },

     // DELETE - Show delete confirmation modal

    showDeleteModal() {
        if (!this.currentDocumentId) return;
        const doc = DocumentService.getById(this.currentDocumentId);
        if (!doc) return;

        this.deleteTargetId = this.currentDocumentId;
        this.deleteDocNameEl.textContent = doc.title;
        this.deleteModal.style.display = 'flex';
        document.getElementById('btn-confirm-delete').focus();
    },

     // Confirm delete operation
    async confirmDelete() {
        if (!this.deleteTargetId) return;

        try {
            await DocumentService.delete(this.deleteTargetId);
            this.hideDeleteModal();
            this.closeEditor();
            this.renderDocumentList();
            this.showToast('News item deleted', 'danger');
            this.deleteTargetId = null;
            this.notifyNewsPage();
        } catch (e) {
            this.showToast('Failed to delete: ' + e.message, 'danger');
        }
    },

    hideDeleteModal() {
        this.deleteModal.style.display = 'none';
        this.deleteTargetId = null;
    },

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

     // Switch between View and Edit mode
    setViewMode(viewMode) {
        this.isViewMode = viewMode;

        const btnView = document.getElementById('btn-mode-view');
        const btnEdit = document.getElementById('btn-mode-edit');
        const btnSave = document.getElementById('btn-save');
        const btnDelete = document.getElementById('btn-delete');
        const aiToolbar = document.getElementById('ai-toolbar');

        if (viewMode) {
            const doc = DocumentService.getById(this.currentDocumentId);
            if (!doc) return;

            this.viewTitle.textContent = doc.title;
            this.viewCategory.textContent = this.getCategoryLabel(doc.category);
            this.viewCategory.className = 'doc-view__category doc-view__category--' + doc.category;
            const displayDateStr = doc.displayDate ? this.formatDisplayDate(doc.displayDate) : 'Not set';
            this.viewDates.textContent = 'News Date: ' + displayDateStr + '  ·  Created ' + this.formatDateTime(doc.createdAt) + '  ·  Updated ' + this.formatDateTime(doc.updatedAt);

            let viewHTML = '';
            if (doc.imageUrl) {
                this.viewImage.onerror = function() { this.style.display = 'none'; };
                this.viewImage.src = doc.imageUrl;
                this.viewImage.alt = doc.title;
                this.viewImage.style.display = 'block';
            } else {
                this.viewImage.style.display = 'none';
            }
            if (doc.content) {
                viewHTML += '<p class="doc-view__excerpt">' + this.escapeHTML(doc.content).replace(/\n/g, '<br>') + '</p>';
            }
            if (doc.details) {
                viewHTML += '<div class="doc-view__details"><h4>Details</h4><p>' + this.escapeHTML(doc.details).replace(/\n/g, '<br>') + '</p></div>';
            }
            this.viewBody.innerHTML = viewHTML;

            this.docView.style.display = 'block';
            document.querySelectorAll('.editor-body').forEach(el => el.style.display = 'none');
            aiToolbar.style.display = 'none';
            this.hideAIResult();

            btnView.classList.add('mode-toggle__btn--active');
            btnView.setAttribute('aria-pressed', 'true');
            btnEdit.classList.remove('mode-toggle__btn--active');
            btnEdit.setAttribute('aria-pressed', 'false');

            btnSave.style.display = 'none';
            btnDelete.style.display = 'none';

            this.editorStatus.textContent = 'Viewing';
            this.editorStatus.className = 'editor-status';
        } else {
            this.docView.style.display = 'none';
            document.querySelectorAll('.editor-body').forEach(el => el.style.display = 'block');
            aiToolbar.style.display = 'flex';

            btnEdit.classList.add('mode-toggle__btn--active');
            btnEdit.setAttribute('aria-pressed', 'true');
            btnView.classList.remove('mode-toggle__btn--active');
            btnView.setAttribute('aria-pressed', 'false');

            btnSave.style.display = '';
            btnDelete.style.display = '';

            this.editorStatus.textContent = this.isModified ? 'Unsaved changes' : 'Editing';
            this.editorStatus.className = this.isModified ? 'editor-status editor-status--unsaved' : 'editor-status';
        }
    },

    markModified() {
        if (!this.currentDocumentId) return;
        this.isModified = true;
        this.editorStatus.textContent = 'Unsaved changes';
        this.editorStatus.className = 'editor-status editor-status--unsaved';
    },

    // ==========================================
    // AI Writing Tools
    // ==========================================

    async handleImproveWriting() {
        const content = this.docDetailsTextarea.value.trim();
        if (!content) {
            this.showToast('Please write some details first', 'info');
            return;
        }

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

    async handleSummarize() {
        const content = this.docDetailsTextarea.value.trim();
        if (!content) {
            this.showToast('Please write some details first', 'info');
            return;
        }

        this.setAIButtonsDisabled(true);
        this.aiStatus.textContent = 'AI is summarizing your text...';

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
                this.showToast('Text summarized successfully', 'success');
            }
        } catch (e) {
            this.showToast('AI processing failed', 'danger');
        } finally {
            this.setAIButtonsDisabled(false);
            this.aiStatus.textContent = '';
        }
    },

    applyAIResult() {
        if (!this.aiPendingResult) return;
        if (this.aiResultType === 'summarize') {
            this.docContentTextarea.value = this.aiPendingResult;
        } else {
            this.docDetailsTextarea.value = this.aiPendingResult;
        }
        this.markModified();
        this.hideAIResult();
        this.showToast('AI result applied to editor', 'success');
    },

    hideAIResult() {
        this.aiResult.style.display = 'none';
        this.aiPendingResult = null;
        this.aiResultType = null;
    },

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
    // Toast Notifications
    // ==========================================

    showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = 'toast toast--' + type;
        toast.textContent = message;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast--removing');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ==========================================
    // Theme Toggle
    // ==========================================

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        document.querySelector('.theme-toggle').setAttribute('aria-pressed', next === 'dark');
        localStorage.setItem('theme-preference', next);
    },

    initTheme() {
        const saved = localStorage.getItem('theme-preference');
        if (saved) {
            document.documentElement.setAttribute('data-theme', saved);
            document.querySelector('.theme-toggle').setAttribute('aria-pressed', saved === 'dark');
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.querySelector('.theme-toggle').setAttribute('aria-pressed', 'true');
        }
    },

    // ==========================================
    // Cross-tab notification to news.html
    // ==========================================

    notifyNewsPage() {
        try {
            const channel = new BroadcastChannel('news-sync');
            channel.postMessage({ type: 'documents-updated' });
            channel.close();
        } catch (e) { /* BroadcastChannel not supported */ }
    },

    // ==========================================
    // Utility Methods
    // ==========================================

    formatDate(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return days + ' days ago';
        if (days < 30) return Math.floor(days / 7) + ' weeks ago';

        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatDisplayDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    formatDateTime(dateStr) {
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    },

    getCategoryLabel(category) {
        const labels = { award: 'Award', talk: 'Invited Talk', collaboration: 'Collaboration', research: 'Research', workshop: 'Workshop' };
        return labels[category] || category;
    },

    countWords(text) {
        return text.split(/\s+/).filter(w => w.length > 0).length;
    },

    escapeHTML(str) {
        const div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }
};


// ============================================
// File Upload (Drag & Drop + File Picker)
// ============================================
(function() {
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-input');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressContainer = document.getElementById('upload-progress');
    const progressText = document.getElementById('upload-progress-text');

    if (!dropzone || !fileInput) return;

    // Click on dropzone opens file picker
    dropzone.addEventListener('click', function() {
        fileInput.click();
    });

    // Keyboard accessibility: Enter/Space triggers file picker
    dropzone.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    // File picker change event
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            uploadFile(this.files[0]);
            this.value = ''; // Reset so same file can be re-selected
        }
    });

    dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.add('upload-dropzone--active');
    });

    dropzone.addEventListener('dragleave', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('upload-dropzone--active');
    });

    dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        e.stopPropagation();
        this.classList.remove('upload-dropzone--active');

        const files = e.dataTransfer.files;
        if (files && files[0]) {
            uploadFile(files[0]);
        }
    });

    /**
     * Upload a file to the server via FormData
     * @param {File} file - The file to upload
     */
    function uploadFile(file) {
        // Client-side validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            UIController.showToast('Invalid file type. Please upload a JPG, PNG, GIF, WebP, or SVG image.', 'danger');
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            UIController.showToast('File too large. Maximum size is 5MB.', 'danger');
            return;
        }

        // Show progress
        progressContainer.style.display = 'flex';
        progressBar.style.width = '0%';
        progressText.textContent = 'Uploading...';
        dropzone.style.display = 'none';

        const formData = new FormData();
        formData.append('image', file);

        const xhr = new XMLHttpRequest();

        // Upload progress
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percent + '%';
                progressText.textContent = 'Uploading... ' + percent + '%';
            }
        });

        // Upload complete
        xhr.addEventListener('load', function() {
            progressContainer.style.display = 'none';
            dropzone.style.display = '';

            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success && response.imageUrl) {
                        // Set the URL field and show preview
                        document.getElementById('doc-image-url').value = response.imageUrl;
                        const previewContainer = document.getElementById('image-preview-container');
                        const previewImg = document.getElementById('image-preview');
                        previewImg.onerror = function() {
                            previewContainer.style.display = 'none';
                        };
                        previewImg.src = response.imageUrl;
                        previewContainer.style.display = 'block';

                        // Format file size for display
                        const sizeKB = Math.round(response.size / 1024);
                        const sizeStr = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';
                        UIController.showToast('Image uploaded successfully (' + sizeStr + ')', 'success');

                        // Mark editor as modified
                        if (typeof UIController.markModified === 'function') {
                            UIController.markModified();
                        }
                    } else {
                        UIController.showToast(response.error || 'Upload failed', 'danger');
                    }
                } catch(e) {
                    UIController.showToast('Invalid server response', 'danger');
                }
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    UIController.showToast(err.error || 'Upload failed (' + xhr.status + ')', 'danger');
                } catch(e) {
                    UIController.showToast('Upload failed (' + xhr.status + ')', 'danger');
                }
            }
        });

        // Upload error
        xhr.addEventListener('error', function() {
            progressContainer.style.display = 'none';
            dropzone.style.display = '';
            UIController.showToast('Network error during upload. Make sure the server is running.', 'danger');
        });

        // Upload aborted
        xhr.addEventListener('abort', function() {
            progressContainer.style.display = 'none';
            dropzone.style.display = '';
            UIController.showToast('Upload cancelled', 'warning');
        });

        xhr.open('POST', API_BASE_URL + '?upload=1');
        xhr.send(formData);
    }
})();

// ============================================
// Image Preview Event Handlers
// ============================================

// Image preview button
document.getElementById('btn-preview-image').addEventListener('click', function() {
    const url = document.getElementById('doc-image-url').value.trim();
    if (url) {
        const previewContainer = document.getElementById('image-preview-container');
        const previewImg = document.getElementById('image-preview');
        previewImg.onerror = function() {
            previewContainer.style.display = 'none';
            UIController.showToast('Failed to load image from URL', 'danger');
        };
        previewImg.src = url;
        previewContainer.style.display = 'block';
    }
});

// Remove image button
document.getElementById('btn-remove-image').addEventListener('click', function() {
    document.getElementById('doc-image-url').value = '';
    document.getElementById('image-preview-container').style.display = 'none';
});

let imagePreviewTimeout;
document.getElementById('doc-image-url').addEventListener('input', function() {
    clearTimeout(imagePreviewTimeout);
    const url = this.value.trim();
    if (!url) {
        document.getElementById('image-preview-container').style.display = 'none';
        return;
    }
    imagePreviewTimeout = setTimeout(function() {
        try {
            new URL(url);
            const previewContainer = document.getElementById('image-preview-container');
            const previewImg = document.getElementById('image-preview');
            previewImg.onerror = function() {
                previewContainer.style.display = 'none';
            };
            previewImg.src = url;
            previewContainer.style.display = 'block';
        } catch(e) {
            document.getElementById('image-preview-container').style.display = 'none';
        }
    }, 1000);
});

// ============================================
// Initialize on DOM ready
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UIController.init());
} else {
    UIController.init();
}