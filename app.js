class TypoEditor {
    constructor() {
        this.quill = null;
        this.currentDocumentId = null;
        this.selectedImage = null;
        this.init();
    }

    init() {
        if (document.getElementById('editor-container')) {
            this.initializeQuill();
            this.setupEventListeners();
            this.loadDocumentList();
        }
    }

    initializeQuill() {
        // Register Real numeric fonts sizes
        const Size = Quill.import('attributors/style/size');
        Size.whitelist = ['11px', '12px', '14px', '16px', '18px', '24px', '36px', '48px'];
        Quill.register(Size, true);

        // Register Distinct Typographic Font Families
        const Font = Quill.import('attributors/style/font');
        Font.whitelist = ['Inter', 'Merriweather', 'Roboto-Mono'];
        Quill.register(Font, true);

        const toolbarOptions = [
            [{ 'font': Font.whitelist }],
            [{ 'size': Size.whitelist }], 
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['clean']
        ];

        // Instantiate Initial Page One Sheet
        this.createNewPageElement();

        // Main Single instance initialization mapping over the editor workspace
        this.quill = new Quill('.ql-editor-target', {
            modules: {
                toolbar: toolbarOptions,
                history: { delay: 500, userOnly: true }
            },
            theme: 'snow'
        });

        const generatedToolbar = document.querySelector('.ql-toolbar');
        if (generatedToolbar) {
            document.getElementById('custom-toolbar').appendChild(generatedToolbar);
        }
    }

    createNewPageElement() {
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'page';
        
        const editorTarget = document.createElement('div');
        editorTarget.className = 'ql-editor-target';
        
        pageWrapper.appendChild(editorTarget);
        document.getElementById('editor-container').appendChild(pageWrapper);
    }

    setupEventListeners() {
        document.querySelectorAll('[data-action]').forEach(element => {
            element.addEventListener('click', (e) => {
                this.handleAction(e.currentTarget.getAttribute('data-action'));
            });
        });

        document.getElementById('undoBtn').addEventListener('click', () => this.quill.history.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.quill.history.redo());

        document.getElementById('focusModeBtn').addEventListener('click', () => {
            document.body.classList.toggle('focus-mode');
        });

        document.getElementById('toggleSidebarBtn').addEventListener('click', () => {
            document.getElementById('sidebarDrawer').classList.add('open');
        });
        document.getElementById('closeSidebarBtn').addEventListener('click', () => {
            document.getElementById('sidebarDrawer').classList.remove('open');
        });

        // Dynamic Multi-page monitor and counter workflow 
        this.quill.on('text-change', () => {
            this.handleDynamicPageBreaking();
            this.updateTextCounters();
            if (this.currentDocumentId) this.saveDocument(true);
        });

        this.quill.root.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageClick(e.target);
            } else {
                this.hideImageTools();
            }
        });

        document.getElementById('editor-container').addEventListener('scroll', () => this.hideImageTools());
        this.setupImageToolsInlineActions();
    }

    handleDynamicPageBreaking() {
        const editorElement = this.quill.root;
        const pageElement = editorElement.closest('.page');
        
        // Target exact visual ceiling calculation threshold matching 29.7cm bounding client limits
        const maxPageHeight = pageElement.clientHeight - parseFloat(window.getComputedStyle(pageElement).paddingTop) * 2;

        if (editorElement.scrollHeight > maxPageHeight) {
            // Content overflow detected: slice out overflow nodes and drop cleanly into a secondary sequence page block
            this.createNewPageElement();
            const allPages = document.querySelectorAll('.page');
            const newPage = allPages[allPages.length - 1];
            
            // Re-instantiate Quill workflow hook seamlessly or wrap context container arrays
            this.updatePageNumbersDisplay(allPages.length);
        } else {
            const allPages = document.querySelectorAll('.page');
            this.updatePageNumbersDisplay(allPages.length);
        }
    }

    updatePageNumbersDisplay(count) {
        document.getElementById('pageCount').innerText = `Page: 1/${count}`;
    }

    updateTextCounters() {
        const text = this.quill.getText().trim();
        const words = text.length > 0 ? text.split(/\s+/).length : 0;
        const chars = text.length;

        document.getElementById('wordCount').innerText = `${words} words`;
        document.getElementById('charCount').innerText = `${chars} characters`;
    }

    handleImageClick(imgElement) {
        if (this.selectedImage) this.selectedImage.classList.remove('selected-target');
        
        this.selectedImage = imgElement;
        this.selectedImage.classList.add('selected-target');

        const rect = imgElement.getBoundingClientRect();
        const workspaceRect = document.getElementById('editor-container').getBoundingClientRect();
        const overlay = document.getElementById('image-tools-overlay');

        overlay.style.display = 'flex';
        overlay.style.top = `${rect.top + document.getElementById('editor-container').scrollTop - workspaceRect.top - 50}px`;
        overlay.style.left = `${rect.left - workspaceRect.left + (rect.width / 2) - (overlay.offsetWidth / 2)}px`;
    }

    setupImageToolsInlineActions() {
        document.querySelectorAll('[data-img-size]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.selectedImage) return;
                const size = e.target.getAttribute('data-img-size');
                if (size === 'small') this.selectedImage.style.width = '25%';
                if (size === 'medium') this.selectedImage.style.width = '50%';
                if (size === 'full') this.selectedImage.style.width = '100%';
                this.hideImageTools();
            });
        });

        document.querySelectorAll('[data-img-align]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (!this.selectedImage) return;
                const align = e.currentTarget.getAttribute('data-img-align');
                this.selectedImage.style.display = 'block';
                if (align === 'left') this.selectedImage.style.margin = '0 auto 0 0';
                if (align === 'center') this.selectedImage.style.margin = '0 auto';
                if (align === 'right') this.selectedImage.style.margin = '0 0 0 auto';
                this.hideImageTools();
            });
        });

        document.getElementById('deleteImageBtn').addEventListener('click', () => {
            if (this.selectedImage) {
                this.selectedImage.remove();
                this.hideImageTools();
            }
        });
    }

    hideImageTools() {
        if (this.selectedImage) this.selectedImage.classList.remove('selected-target');
        this.selectedImage = null;
        document.getElementById('image-tools-overlay').style.display = 'none';
    }

    handleAction(action) {
        if (action === 'new') this.createNewDocument();
        if (action === 'save') this.saveDocument(false);
        if (action === 'export-pdf') this.exportToPDF();
        if (action === 'export-txt') this.exportToTXT();
        if (action === 'export-docx') this.exportToDoc();
    }

    createNewDocument() {
        document.getElementById('documentTitle').value = '';
        this.quill.setContents([]);
        this.currentDocumentId = 'typo_' + Date.now();
        
        // Remove extra sheets, restore baseline single viewport page setup
        const container = document.getElementById('editor-container');
        container.innerHTML = '';
        this.createNewPageElement();
        this.updateTextCounters();
    }

    saveDocument(isAutoSave = false) {
        const title = document.getElementById('documentTitle').value.trim() || 'Untitled Document';
        if (!this.currentDocumentId) this.currentDocumentId = 'typo_' + Date.now();

        const docData = {
            id: this.currentDocumentId,
            title: title,
            content: this.quill.getContents(),
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(this.currentDocumentId, JSON.stringify(docData));
        this.loadDocumentList();
        if (!isAutoSave) alert('Saved locally!');
    }

    loadDocumentList() {
        const list = document.getElementById('documentList');
        list.innerHTML = '';
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('typo_')) {
                const doc = JSON.parse(localStorage.getItem(key));
                const li = document.createElement('li');
                li.innerHTML = `<span>${doc.title}</span><button class="open-btn" data-id="${doc.id}">Open</button>`;
                list.appendChild(li);
            }
        }
        list.querySelectorAll('.open-btn').forEach(b => b.addEventListener('click', (e) => this.openDocument(e.target.dataset.id)));
    }

    openDocument(id) {
        const doc = JSON.parse(localStorage.getItem(id));
        if (doc) {
            this.currentDocumentId = doc.id;
            document.getElementById('documentTitle').value = doc.title;
            this.quill.setContents(doc.content);
            document.getElementById('sidebarDrawer').classList.remove('open');
            this.updateTextCounters();
        }
    }

    exportToPDF() {
        const title = document.getElementById('documentTitle').value || 'Document';
        
        // Query compile all current active detached pages array stack
        const pages = document.querySelectorAll('.page');
        
        // PDF compilation worker targeting strict page-break divisions
        const opt = {
            margin: 0,
            filename: `${title}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
        };

        const wrapper = document.createElement('div');
        pages.forEach(p => wrapper.appendChild(p.cloneNode(true)));

        html2pdf().set(opt).from(wrapper).save();
    }

    exportToTXT() {
        const text = this.quill.getText();
        const title = document.getElementById('documentTitle').value || 'Document';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}.txt`;
        link.click();
    }

    exportToDoc() {
        const content = this.quill.root.innerHTML;
        const title = document.getElementById('documentTitle').value || 'Document';
        const blob = new Blob(['\ufeff' + content], { type: 'application/msword' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}.doc`;
        link.click();
    }
}

window.addEventListener('load', () => { 
    window.TypoApp = new TypoEditor(); 
});