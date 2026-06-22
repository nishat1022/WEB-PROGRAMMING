'use strict';

const API_BASE_URL = 'api.php';

// Document Service Layer (CRUD Operations)
// Abstracts the REST API — all methods are async
const DocumentService = {
    /** Local cache of all documents, refreshed on every write */
    _cache: null,

    /**
     * Initialize — fetch all documents from API
     */
    async init() {
        await this.refreshCache();
    },

    /**
     * Refresh the local cache from the API
     */
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

    /**
     * Get all documents (from cache)
     * @returns {Array} Array of document objects
     */
    getAll() {
        return this._cache || [];
    },

    /**
     * Get a single document by ID (from cache)
     * @param {number|string} id - Document ID
     * @returns {Object|null} Document object or null
     */
    getById(id) {
        const numId = typeof id === 'string' ? parseInt(id, 10) : id;
        return this._cache.find(doc => doc.id === numId) || null;
    },

    /**
     * CREATE - Add a new document via API
     * @param {Object} doc - Document data { title, content, details, category, displayDate }
     * @returns {Promise<Object>} Created document from server
     */
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
        // Refresh cache so getAll/getById work immediately
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

    /**
     * Filter documents by category (client-side on cache)
     * @param {string} category - Category to filter by
     * @returns {Array} Filtered documents
     */
    filterByCategory(category) {
        if (category === 'all') return this.getAll();
        return this.getAll().filter(doc => doc.category === category);
    },

    /**
     * Get document count (from cache)
     * @returns {number} Number of documents
     */
    count() {
        return this.getAll().length;
    }
};


// ============================================
// AI Service — Gemini API via PHP Backend
// Assignment 3: AI Integration
// ============================================
const AIService = {
    /**
     * Improve Writing — sends text to Gemini via PHP backend.
     * @param {string} text - Original text to improve
     * @returns {Promise<Object>} { original, improved, changes, meta }
     */
    async improveWriting(text) {
        const response = await fetch('ai.php?action=improve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'AI service request failed' }));
            throw new Error(err.error || 'AI service request failed');
        }

        return await response.json();
    },

    /**
     * Summarize Content — sends text to Gemini via PHP backend.
     * @param {string} text - Original text to summarize
     * @returns {Promise<Object>} { original, summary, wordCounts, meta }
     */
    async summarize(text) {
        const response = await fetch('ai.php?action=summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'AI service request failed' }));
            throw new Error(err.error || 'AI service request failed');
        }

        return await response.json();
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
    autoSaveTimer: null,
    aiPendingResult: null,
    aiResultType: null,

    /**
     * Initialize the application
     */
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

        // Warn before leaving with unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (UIController.isModified) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    /**
     * Cache frequently accessed DOM elements
     */
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

    /**
     * Bind all event listeners
     */
    bindEvents() {
        document.getElementById('btn-new-document').addEventListener('click', () => this.createNewDocument());
        document.getElementById('btn-empty-new').addEventListener('click', () => this.createNewDocument());

        document.getElementById('btn-mode-view').addEventListener('click', () => this.setViewMode(true));
        document.getElementById('btn-mode-edit').addEventListener('click', () => this.setViewMode(false));

        document.getElementById('btn-back').addEventListener('click', () => this.closeEditor());
        document.getElementById('btn-save').addEventListener('click', () => this.saveCurrentDocument());
        document.getElementById('btn-delete').addEventListener('click', () => this.showDeleteModal());
        document.getElementById('btn-duplicate').addEventListener('click', () => this.duplicateCurrentDocument());

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

        // Search clear button
        const searchClearBtn = document.getElementById('search-clear');
        if (searchClearBtn) {
            this.searchInputEl.addEventListener('input', () => {
                searchClearBtn.style.display = this.searchInputEl.value.length > 0 ? '' : 'none';
            });
            searchClearBtn.addEventListener('click', () => {
                this.searchInputEl.value = '';
                this.currentSearch = '';
                this.renderDocumentList();
                searchClearBtn.style.display = 'none';
                this.searchInputEl.focus();
            });
        }

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

        // Word count indicators
        const contentWordCount = document.getElementById('content-word-count');
        const detailsWordCount = document.getElementById('details-word-count');
        const contentCharCount = document.getElementById('content-char-count');
        const detailsCharCount = document.getElementById('details-char-count');
        if (contentWordCount) {
            const updateContentCount = () => {
                const count = this.docContentTextarea.value.split(/\s+/).filter(w => w.length > 0).length;
                contentWordCount.textContent = count + (count === 1 ? ' word' : ' words');
                if (contentCharCount) {
                    const charCount = this.docContentTextarea.value.length;
                    contentCharCount.textContent = charCount + (charCount === 1 ? ' character' : ' characters');
                }
            };
            this.docContentTextarea.addEventListener('input', updateContentCount);
            updateContentCount();
        }
        if (detailsWordCount) {
            const updateDetailsCount = () => {
                const count = this.docDetailsTextarea.value.split(/\s+/).filter(w => w.length > 0).length;
                detailsWordCount.textContent = count + (count === 1 ? ' word' : ' words');
                if (detailsCharCount) {
                    const charCount = this.docDetailsTextarea.value.length;
                    detailsCharCount.textContent = charCount + (charCount === 1 ? ' character' : ' characters');
                }
            };
            this.docDetailsTextarea.addEventListener('input', updateDetailsCount);
            updateDetailsCount();
        }
        this.docDisplayDateInput.addEventListener('change', () => this.markModified());
        document.getElementById('doc-image-url').addEventListener('input', () => this.markModified());
        const imageAltInput = document.getElementById('doc-image-alt');
        if (imageAltInput) {
            imageAltInput.addEventListener('input', () => this.markModified());
        }

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
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                if (!this.currentDocumentId || !this.isModified) {
                    this.createNewDocument();
                }
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

    /**
     * CREATE - Create a new document and open editor
     */
    async createNewDocument() {
        // Warn before discarding unsaved changes
        if (this.isModified && this.currentDocumentId) {
            const confirmed = confirm('You have unsaved changes. Discard them and create a new news item?');
            if (!confirmed) return;
        }

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
        const imageAltEl = document.getElementById('doc-image-alt');
        if (imageAltEl) {
            imageAltEl.value = doc.imageAlt || '';
        }
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

        // Update word counts
        const contentWordCount = document.getElementById('content-word-count');
        const detailsWordCount = document.getElementById('details-word-count');
        const contentCharCount = document.getElementById('content-char-count');
        const detailsCharCount = document.getElementById('details-char-count');
        if (contentWordCount) {
            const c = (doc.content || '').split(/\s+/).filter(w => w.length > 0).length;
            contentWordCount.textContent = c + (c === 1 ? ' word' : ' words');
        }
        if (contentCharCount) {
            const cc = (doc.content || '').length;
            contentCharCount.textContent = cc + (cc === 1 ? ' character' : ' characters');
        }
        if (detailsWordCount) {
            const d = (doc.details || '').split(/\s+/).filter(w => w.length > 0).length;
            detailsWordCount.textContent = d + (d === 1 ? ' word' : ' words');
        }
        if (detailsCharCount) {
            const dc = (doc.details || '').length;
            detailsCharCount.textContent = dc + (dc === 1 ? ' character' : ' characters');
        }

        // Show duplicate button when a document is open
        const btnDuplicate = document.getElementById('btn-duplicate');
        if (btnDuplicate) btnDuplicate.style.display = '';

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
                imageUrl: document.getElementById('doc-image-url').value.trim(),
                imageAlt: (function() { var el = document.getElementById('doc-image-alt'); return el ? el.value.trim() : ''; })()
            });

            this.isModified = false;
            this.stopAutoSave();
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

        this.stopAutoSave();
        this.currentDocumentId = null;
        this.isModified = false;
        this.editorEmpty.style.display = 'flex';
        this.editorActive.style.display = 'none';

        // Hide duplicate button when editor is closed
        const btnDuplicate = document.getElementById('btn-duplicate');
        if (btnDuplicate) btnDuplicate.style.display = 'none';

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
                const imageAltEl = document.getElementById('doc-image-alt');
                const imageAlt = (imageAltEl && imageAltEl.value.trim()) || doc.title;
                this.viewImage.alt = imageAlt;
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

    startAutoSave() {
        this.stopAutoSave();
        this.autoSaveTimer = setTimeout(() => {
            if (this.currentDocumentId && this.isModified) {
                this.saveCurrentDocument();
                this.showToast('Auto-saved', 'info');
            }
        }, 30000);
    },

    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    },

    markModified() {
        if (!this.currentDocumentId) return;
        this.isModified = true;
        this.editorStatus.textContent = 'Unsaved changes';
        this.editorStatus.className = 'editor-status editor-status--unsaved';
        this.startAutoSave();
    },

    async duplicateCurrentDocument() {
        if (!this.currentDocumentId) return;

        const title = this.docTitleInput.value.trim();
        if (!title) {
            this.showToast('Title cannot be empty', 'danger');
            return;
        }

        try {
            const newDoc = await DocumentService.create({
                title: 'Copy of ' + title,
                content: this.docContentTextarea.value,
                details: this.docDetailsTextarea.value,
                category: this.docCategorySelect.value,
                displayDate: this.docDisplayDateInput.value,
                imageUrl: document.getElementById('doc-image-url').value.trim(),
                imageAlt: (function() { var el = document.getElementById('doc-image-alt'); return el ? el.value.trim() : ''; })()
            });

            this.openDocument(newDoc.id);
            this.showToast('Document duplicated successfully', 'success');
        } catch (e) {
            this.showToast('Failed to duplicate: ' + e.message, 'danger');
        }
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
                this.showToast(result.error, 'danger');
            } else {
                this.aiPendingResult = result.improved;
                this.aiResultType = 'improve';
                this.aiResultTitle.textContent = 'Improved Writing (' + result.changes + ' changes)';
                this.aiResultBody.textContent = result.improved;
                this.aiResult.style.display = 'block';
                this.showToast(result.meta || 'Writing improved with ' + result.changes + ' changes', 'success');
            }
        } catch (e) {
            this.showToast('AI Error: ' + e.message, 'danger');
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
                this.showToast(result.error, 'danger');
            } else {
                this.aiPendingResult = result.summary;
                this.aiResultType = 'summarize';
                this.aiResultTitle.textContent = 'Summary (' + result.wordCounts.reduction + '% reduction)';
                this.aiResultBody.textContent = result.summary;
                this.aiResult.style.display = 'block';
                this.showToast(result.meta || 'Text summarized successfully', 'success');
            }
        } catch (e) {
            this.showToast('AI Error: ' + e.message, 'danger');
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
// File Upload
// ============================================
(function() {
    const dropzone = document.getElementById('upload-dropzone');
    const fileInput = document.getElementById('file-input');
    const progressBar = document.getElementById('upload-progress-bar');
    const progressContainer = document.getElementById('upload-progress');
    const progressText = document.getElementById('upload-progress-text');

    if (!dropzone || !fileInput) return;

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
    let activeXhr = null;

    function uploadFile(file) {
        if (activeXhr) activeXhr.abort();

        // Client-side validation
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            UIController.showToast('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.', 'danger');
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            UIController.showToast('File too large. Maximum size is 5MB.', 'danger');
            return;
        }

        // Show progress
        progressBar.style.width = '0%';
        progressContainer.style.display = 'flex';
        progressText.textContent = 'Uploading...';
        dropzone.style.display = 'none';

        const formData = new FormData();
        formData.append('image', file);

        activeXhr = new XMLHttpRequest();
        const xhr = activeXhr;

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
            if (xhr !== activeXhr) return;

            if (xhr.status >= 200 && xhr.status < 300) {
                // Show completion state briefly before hiding
                progressContainer.classList.add('upload-progress--complete');
                progressBar.style.width = '100%';
                progressText.textContent = 'Upload complete!';

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
                        const sizeKB = response.size ? Math.round(response.size / 1024) : 0;
                        const sizeStr = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';
                        UIController.showToast('Image uploaded successfully (' + sizeStr + ')', 'success');

                        // Mark editor as modified
                        UIController.markModified();
                    } else {
                        UIController.showToast(response.error || 'Upload failed', 'danger');
                    }
                } catch(e) {
                    UIController.showToast('Invalid server response', 'danger');
                }

                // After a brief delay, hide and reset the progress bar
                setTimeout(function() {
                    progressContainer.classList.remove('upload-progress--complete');
                    progressBar.style.width = '0%';
                    progressContainer.style.display = 'none';
                    dropzone.style.display = '';
                }, 600);
            } else {
                // Error response — reset progress bar immediately
                progressContainer.classList.remove('upload-progress--complete');
                progressBar.style.width = '0%';
                progressContainer.style.display = 'none';
                dropzone.style.display = '';

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
            if (xhr !== activeXhr) return;
            progressBar.style.width = '0%';
            progressContainer.style.display = 'none';
            dropzone.style.display = '';
            UIController.showToast('Network error during upload. Make sure the server is running.', 'danger');
        });

        // Upload aborted
        xhr.addEventListener('abort', function() {
            if (xhr !== activeXhr) return;
            progressBar.style.width = '0%';
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
const btnPreviewImage = document.getElementById('btn-preview-image');
if (btnPreviewImage) {
    btnPreviewImage.addEventListener('click', function() {
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
}

// Remove image button
const btnRemoveImage = document.getElementById('btn-remove-image');
if (btnRemoveImage) {
    btnRemoveImage.addEventListener('click', function() {
        document.getElementById('doc-image-url').value = '';
        document.getElementById('image-preview-container').style.display = 'none';
        UIController.markModified();
    });
}

// Auto-preview on URL input change (with debounce)
const docImageUrl = document.getElementById('doc-image-url');
if (docImageUrl) {
    let imagePreviewTimeout;
    docImageUrl.addEventListener('input', function() {
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
}

// ============================================
// Mobile Sidebar Toggle
// ============================================
(function() {
    const appLayout = document.getElementById('app-layout');
    const backdrop = document.getElementById('sidebar-backdrop');
    const navToggle = document.querySelector('.nav__toggle');

    function openSidebar() {
        if (!appLayout) return;
        appLayout.classList.add('app-layout--sidebar-open');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (!appLayout) return;
        appLayout.classList.remove('app-layout--sidebar-open');
        document.body.style.overflow = '';
    }

    // The nav toggle in the header already has a listener for the nav menu,
    // but on the editor page it should control the sidebar on mobile
    if (navToggle && appLayout) {
        // Override the existing nav toggle for sidebar behavior
        navToggle.addEventListener('click', function(e) {
            // Only handle sidebar on mobile (768px and below)
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                if (appLayout.classList.contains('app-layout--sidebar-open')) {
                    closeSidebar();
                } else {
                    openSidebar();
                }
            }
        });
    }

    // Close sidebar when clicking the backdrop
    if (backdrop) {
        backdrop.addEventListener('click', closeSidebar);
    }

    // Close sidebar when a document card is clicked on mobile
    document.addEventListener('click', function(e) {
        if (e.target.closest('.doc-card') && window.innerWidth <= 768) {
            closeSidebar();
        }
    });
})();

// ============================================
// Initialize on DOM ready
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => UIController.init());
} else {
    UIController.init();
}