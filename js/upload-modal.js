class UploadModal {
    constructor() {
        this.isOpen = false;
        this.selectedFiles = [];
        this.previewImages = [];
        this.render();
        this.bindEvents();
    }

    render() {
        const modal = document.createElement('div');
        modal.id = 'upload-modal';
        modal.className = 'upload-modal';
        modal.innerHTML = `
            <div class="upload-modal-overlay"></div>
            <div class="upload-modal-container">
                <div class="upload-modal-header">
                    <h2>上传资源</h2>
                    <button class="upload-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="upload-modal-body">
                    <form id="upload-form">
                        <div class="form-group">
                            <label>
                                <i class="fas fa-heading"></i>
                                资源标题 <span class="required">*</span>
                            </label>
                            <input type="text" id="resource-title" placeholder="简洁明了地描述你的资源，如：IB数学AA HL真题2024" required maxlength="50">
                            <span class="char-count">0/50</span>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-layer-group"></i>
                                资源分类 <span class="required">*</span>
                            </label>
                            <div class="category-selector">
                                <label class="category-option">
                                    <input type="radio" name="category" value="electronic" required>
                                    <div class="category-card">
                                        <i class="fas fa-file-pdf"></i>
                                        <span>电子资源</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="online">
                                    <div class="category-card">
                                        <i class="fas fa-globe"></i>
                                        <span>线上资源</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="physical">
                                    <div class="category-card">
                                        <i class="fas fa-book"></i>
                                        <span>实物资源</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="form-group" id="online-link-group" style="display: none;">
                            <label>
                                <i class="fas fa-link"></i>
                                资源链接 <span class="required">*</span>
                            </label>
                            <input type="url" id="resource-link" placeholder="请输入资源链接地址">
                        </div>

                        <div class="form-group" id="physical-info-group" style="display: none;">
                            <label>
                                <i class="fas fa-map-marker-alt"></i>
                                交易地点
                            </label>
                            <input type="text" id="resource-location" placeholder="如：北京海淀区中关村">
                        </div>

                        <div class="form-group" id="physical-price-group" style="display: none;">
                            <label>
                                <i class="fas fa-tag"></i>
                                价格（元）
                            </label>
                            <input type="number" id="resource-price" placeholder="0 表示免费分享" min="0">
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-edit"></i>
                                资源描述 <span class="required">*</span>
                            </label>
                            <textarea id="resource-description" placeholder="详细介绍资源的具体内容、适用范围、使用方法等（100-500字）" required minlength="100" maxlength="500"></textarea>
                            <span class="char-count" id="desc-count">0/500</span>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-tags"></i>
                                标签
                            </label>
                            <div class="tag-category-section">
                                <div class="tag-category">
                                    <span class="tag-category-title">课程体系</span>
                                    <div class="tag-options">
                                        <label class="tag-option"><input type="checkbox" name="tag-curriculum" value="IB"><span>IB</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-curriculum" value="AP"><span>AP</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-curriculum" value="A-Level"><span>A-Level</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-curriculum" value="BC"><span>BC</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-curriculum" value="OSSD"><span>OSSD</span></label>
                                    </div>
                                </div>
                                <div class="tag-category">
                                    <span class="tag-category-title">学科</span>
                                    <div class="tag-options">
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="数学"><span>数学</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="物理"><span>物理</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="化学"><span>化学</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="生物"><span>生物</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="经济"><span>经济</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="历史"><span>历史</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="地理"><span>地理</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="英语"><span>英语</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="中文"><span>中文</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="计算机"><span>计算机</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="心理学"><span>心理学</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-subject" value="艺术"><span>艺术</span></label>
                                    </div>
                                </div>
                                <div class="tag-category">
                                    <span class="tag-category-title">细分品类</span>
                                    <div class="tag-options">
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="真题"><span>真题</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="笔记"><span>笔记</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="线上课"><span>线上课</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="Notebook LM"><span>Notebook LM</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="IMA"><span>IMA</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="Notion"><span>Notion</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="教材"><span>教材</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="教辅"><span>教辅</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="申请资料"><span>申请资料</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-type" value="文书"><span>文书</span></label>
                                    </div>
                                </div>
                                <div class="tag-category">
                                    <span class="tag-category-title">自定义标签</span>
                                    <div class="tag-input-wrapper">
                                        <div class="selected-tags" id="selected-tags"></div>
                                        <input type="text" id="tag-input" placeholder="输入后按回车添加">
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-group" id="electronic-file-group" style="display: none;">
                            <label>
                                <i class="fas fa-file-archive"></i>
                                上传数字资源 <span class="required">*</span>
                            </label>
                            <div class="file-upload-area" id="file-upload-area">
                                <div class="file-upload-placeholder" id="file-upload-placeholder">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>点击上传数字资源文件</p>
                                    <span>支持 PDF、Word、Excel、PPT、ZIP 等格式，单文件不超过 100MB</span>
                                </div>
                                <div class="selected-file" id="selected-file" style="display: none;">
                                    <i class="fas fa-file"></i>
                                    <span id="selected-file-name"></span>
                                    <button type="button" class="remove-file" id="remove-file">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <input type="file" id="resource-file-input" style="display: none;">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-copyright"></i>
                                版权类型 <span class="required">*</span>
                            </label>
                            <select id="copyright-type" class="copyright-select" required>
                                <option value="">请选择版权类型</option>
                                <option value="original">原创</option>
                                <option value="reprint">转载</option>
                                <option value="licensed">授权使用</option>
                                <option value="public_domain">公共领域</option>
                                <option value="cc">CC协议</option>
                            </select>
                        </div>

                        <div class="form-group copyright-extra-group" id="reprint-source-group" style="display: none;">
                            <label>
                                <i class="fas fa-link"></i>
                                来源链接 <span class="required">*</span>
                            </label>
                            <input type="url" id="reprint-source" placeholder="请输入原文链接地址">
                        </div>

                        <div class="form-group copyright-extra-group" id="reprint-author-group" style="display: none;">
                            <label>
                                <i class="fas fa-user"></i>
                                原作者 <span class="required">*</span>
                            </label>
                            <input type="text" id="reprint-author" placeholder="请输入原作者名称">
                        </div>

                        <div class="form-group copyright-extra-group" id="license-proof-group" style="display: none;">
                            <label>
                                <i class="fas fa-file-alt"></i>
                                授权证明 <span class="required">*</span>
                            </label>
                            <textarea id="license-proof" placeholder="请描述授权情况或附上授权证明信息" rows="2"></textarea>
                        </div>

                        <div class="form-group copyright-extra-group" id="cc-type-group" style="display: none;">
                            <label>
                                <i class="fas fa-balance-scale"></i>
                                CC协议类型 <span class="required">*</span>
                            </label>
                            <select id="cc-type" class="copyright-select">
                                <option value="">请选择CC协议</option>
                                <option value="CC BY">CC BY - 署名</option>
                                <option value="CC BY-SA">CC BY-SA - 署名-相同方式共享</option>
                                <option value="CC BY-NC">CC BY-NC - 署名-非商业性使用</option>
                                <option value="CC BY-NC-SA">CC BY-NC-SA - 署名-非商业性使用-相同方式共享</option>
                                <option value="CC BY-ND">CC BY-ND - 署名-禁止演绎</option>
                                <option value="CC BY-NC-ND">CC BY-NC-ND - 署名-非商业性使用-禁止演绎</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-file-signature"></i>
                                版权声明 <span class="required">*</span>
                            </label>
                            <textarea id="copyright-statement" placeholder="请输入版权声明内容，说明资源的版权归属、使用限制等（20-200字）" required minlength="20" maxlength="200"></textarea>
                            <span class="char-count" id="copyright-count">0/200</span>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-coins"></i>
                                下载积分
                            </label>
                            <div style="display: flex; gap: 15px; align-items: center;">
                                <input type="number" id="download-points" placeholder="10" min="10" max="500" value="10" style="flex: 1; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; font-size: 16px;">
                                <span style="color: #4b5563; font-weight: 500;">积分</span>
                            </div>
                            <span class="form-hint" style="margin-top: 8px; display: block;">设置资源下载积分（最低10积分），稀缺资源可设50-200积分</span>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-cloud-upload-alt"></i>
                                上传截图 <span class="required">*</span>
                            </label>
                            <div class="upload-area" id="upload-area">
                                <div class="upload-placeholder" id="upload-placeholder">
                                    <i class="fas fa-cloud-upload-alt"></i>
                                    <p>点击或拖拽上传截图</p>
                                    <span>支持 JPG、PNG 格式，最多9张</span>
                                </div>
                                <div class="preview-grid" id="preview-grid" style="display: none;"></div>
                                <input type="file" id="file-input" accept="image/*" multiple style="display: none;">
                            </div>
                        </div>

                        <div class="form-error" id="upload-error"></div>

                        <div class="form-actions">
                            <button type="button" class="cancel-btn" id="upload-cancel">取消</button>
                            <button type="submit" class="submit-btn">
                                <span class="btn-text">发布资源</span>
                                <span class="btn-loading"><i class="fas fa-spinner fa-spin"></i></span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modal = modal;
        this.form = document.getElementById('upload-form');
    }

    bindEvents() {
        this.modal.querySelector('.upload-modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.upload-modal-overlay').addEventListener('click', () => this.close());
        document.getElementById('upload-cancel').addEventListener('click', () => this.close());

        document.querySelectorAll('input[name="category"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.onCategoryChange(e.target.value));
        });

        document.getElementById('resource-title').addEventListener('input', (e) => {
            const count = e.target.value.length;
            e.target.nextElementSibling.textContent = `${count}/50`;
        });

        document.getElementById('resource-description').addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('desc-count').textContent = `${count}/500`;
        });

        document.getElementById('tag-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                e.preventDefault();
                this.addTag(e.target.value.trim());
                e.target.value = '';
            }
        });

        document.getElementById('copyright-type').addEventListener('change', (e) => {
            this.onCopyrightTypeChange(e.target.value);
        });

        document.getElementById('copyright-statement').addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('copyright-count').textContent = `${count}/200`;
        });



        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');

        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        const fileUploadArea = document.getElementById('file-upload-area');
        const resourceFileInput = document.getElementById('resource-file-input');

        if (fileUploadArea && resourceFileInput) {
            fileUploadArea.addEventListener('click', () => resourceFileInput.click());

            resourceFileInput.addEventListener('change', (e) => {
                this.handleResourceFile(e.target.files[0]);
            });

            const removeFileBtn = document.getElementById('remove-file');
            if (removeFileBtn) {
                removeFileBtn.addEventListener('click', () => this.removeResourceFile());
            }
        }

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    onCategoryChange(category) {
        const onlineGroup = document.getElementById('online-link-group');
        const physicalInfoGroup = document.getElementById('physical-info-group');
        const physicalPriceGroup = document.getElementById('physical-price-group');
        const electronicFileGroup = document.getElementById('electronic-file-group');

        onlineGroup.style.display = 'none';
        physicalInfoGroup.style.display = 'none';
        physicalPriceGroup.style.display = 'none';
        electronicFileGroup.style.display = 'none';

        if (category === 'online') {
            onlineGroup.style.display = 'block';
        } else if (category === 'physical') {
            physicalInfoGroup.style.display = 'block';
            physicalPriceGroup.style.display = 'block';
        } else if (category === 'electronic') {
            electronicFileGroup.style.display = 'block';
        }
    }

    onCopyrightTypeChange(type) {
        const reprintSourceGroup = document.getElementById('reprint-source-group');
        const reprintAuthorGroup = document.getElementById('reprint-author-group');
        const licenseProofGroup = document.getElementById('license-proof-group');
        const ccTypeGroup = document.getElementById('cc-type-group');

        reprintSourceGroup.style.display = 'none';
        reprintAuthorGroup.style.display = 'none';
        licenseProofGroup.style.display = 'none';
        ccTypeGroup.style.display = 'none';

        if (type === 'reprint') {
            reprintSourceGroup.style.display = 'block';
            reprintAuthorGroup.style.display = 'block';
        } else if (type === 'licensed') {
            licenseProofGroup.style.display = 'block';
        } else if (type === 'cc') {
            ccTypeGroup.style.display = 'block';
        }
    }



    addTag(tag) {
        const tags = this.getTags();
        if (tags.length < 5 && !tags.includes(tag)) {
            this.setTags([...tags, tag]);
        }
    }

    removeTag(tag) {
        const tags = this.getTags().filter(t => t !== tag);
        this.setTags(tags);
    }

    getTags() {
        const tags = [];
        const customTagsContainer = document.getElementById('selected-tags');
        if (customTagsContainer) {
            const customTags = Array.from(customTagsContainer.querySelectorAll('.tag')).map(t => t.dataset.tag);
            tags.push(...customTags);
        }

        const curriculumTags = Array.from(this.modal.querySelectorAll('input[name="tag-curriculum"]:checked')).map(cb => cb.value);
        const subjectTags = Array.from(this.modal.querySelectorAll('input[name="tag-subject"]:checked')).map(cb => cb.value);
        const typeTags = Array.from(this.modal.querySelectorAll('input[name="tag-type"]:checked')).map(cb => cb.value);

        tags.push(...curriculumTags, ...subjectTags, ...typeTags);
        return tags;
    }

    setTags(tags) {
        this.tags = tags;
        this.renderTags();
    }

    renderTags() {
        const container = document.getElementById('selected-tags');
        const tags = this.getTags();
        container.innerHTML = tags.map(tag => `
            <span class="tag" data-tag="${tag}">
                ${tag}
                <i class="fas fa-times"></i>
            </span>
        `).join('');

        container.querySelectorAll('.tag').forEach(tagEl => {
            tagEl.querySelector('i').addEventListener('click', () => {
                this.removeTag(tagEl.dataset.tag);
            });
        });
    }

    handleResourceFile(file) {
        if (!file) return;

        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            this.showError('文件大小不能超过100MB');
            return;
        }

        this.selectedResourceFile = file;

        const placeholder = document.getElementById('file-upload-placeholder');
        const selectedFile = document.getElementById('selected-file');
        const fileName = document.getElementById('selected-file-name');

        placeholder.style.display = 'none';
        selectedFile.style.display = 'flex';
        fileName.textContent = file.name + ' (' + this.formatFileSize(file.size) + ')';
    }

    removeResourceFile() {
        this.selectedResourceFile = null;

        const placeholder = document.getElementById('file-upload-placeholder');
        const selectedFile = document.getElementById('selected-file');
        const resourceFileInput = document.getElementById('resource-file-input');

        placeholder.style.display = 'block';
        selectedFile.style.display = 'none';
        resourceFileInput.value = '';
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }

    handleFiles(files) {
        const maxFiles = 9;
        const currentCount = this.previewImages.length;
        const remaining = maxFiles - currentCount;
        
        if (remaining <= 0) {
            this.showError('最多只能上传9张图片');
            return;
        }

        Array.from(files).slice(0, remaining).forEach(file => {
            if (!file.type.startsWith('image/')) {
                this.showError('只能上传图片文件');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                this.showError('单张图片大小不能超过5MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewImages.push({
                    file,
                    dataUrl: e.target.result
                });
                this.renderPreviews();
            };
            reader.readAsDataURL(file);
        });
    }

    renderPreviews() {
        const placeholder = document.getElementById('upload-placeholder');
        const previewGrid = document.getElementById('preview-grid');

        if (this.previewImages.length > 0) {
            placeholder.style.display = 'none';
            previewGrid.style.display = 'grid';
            previewGrid.innerHTML = this.previewImages.map((img, index) => `
                <div class="preview-item" data-index="${index}">
                    <img src="${img.dataUrl}" alt="预览图片${index + 1}">
                    <button class="remove-preview" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');

            previewGrid.querySelectorAll('.remove-preview').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removePreview(parseInt(btn.dataset.index));
                });
            });
        } else {
            placeholder.style.display = 'block';
            previewGrid.style.display = 'none';
        }
    }

    removePreview(index) {
        this.previewImages.splice(index, 1);
        this.renderPreviews();
    }

    showError(message) {
        const errorDiv = document.getElementById('upload-error');
        errorDiv.textContent = message;
        setTimeout(() => {
            errorDiv.textContent = '';
        }, 3000);
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const user = AuthService.getCurrentUser();
        if (!user) {
            this.showError('请先登录');
            if (typeof authModal !== 'undefined') {
                this.close();
                authModal.open('login');
            }
            return;
        }

        const submitBtn = this.form.querySelector('.submit-btn');
        submitBtn.classList.add('loading');

        const title = document.getElementById('resource-title').value;
        const category = document.querySelector('input[name="category"]:checked')?.value;
        const description = document.getElementById('resource-description').value;
        const tags = this.getTags();
        const link = document.getElementById('resource-link').value;
        const location = document.getElementById('resource-location').value;
        const price = parseInt(document.getElementById('resource-price').value) || 0;
        const copyrightType = document.getElementById('copyright-type').value;
        const copyrightStatement = document.getElementById('copyright-statement').value;
        const downloadPoints = parseInt(document.getElementById('download-points').value) || 0;

        if (!title || !category || !description) {
            this.showError('请填写必填项');
            submitBtn.classList.remove('loading');
            return;
        }

        if (typeof ModerationService !== 'undefined') {
            const titleCheck = ModerationService.checkContent(title);
            if (!titleCheck.passed) {
                this.showError('标题审核未通过：' + (titleCheck.issues[0]?.message || titleCheck.issues[0]));
                submitBtn.classList.remove('loading');
                return;
            }

            const descCheck = ModerationService.checkContent(description);
            if (!descCheck.passed) {
                this.showError('描述审核未通过：' + (descCheck.issues[0]?.message || descCheck.issues[0]));
                submitBtn.classList.remove('loading');
                return;
            }

            if (titleCheck.warnings.length > 0 || descCheck.warnings.length > 0) {
                const warnings = [...titleCheck.warnings, ...descCheck.warnings];
                const warningMsg = warnings.map(w => w.message).join('\n');
                if (!confirm('内容存在以下问题：\n' + warningMsg + '\n\n是否继续提交？')) {
                    submitBtn.classList.remove('loading');
                    return;
                }
            }
        }

        if (!copyrightType) {
            this.showError('请选择版权类型');
            submitBtn.classList.remove('loading');
            return;
        }

        if (!copyrightStatement || copyrightStatement.length < 20) {
            this.showError('版权声明至少需要20个字');
            submitBtn.classList.remove('loading');
            return;
        }

        if (copyrightType === 'reprint') {
            const reprintSource = document.getElementById('reprint-source').value;
            const reprintAuthor = document.getElementById('reprint-author').value;
            if (!reprintSource || !reprintAuthor) {
                this.showError('转载资源请填写来源链接和原作者');
                submitBtn.classList.remove('loading');
                return;
            }
        }

        if (copyrightType === 'licensed') {
            const licenseProof = document.getElementById('license-proof').value;
            if (!licenseProof) {
                this.showError('授权使用资源请填写授权证明');
                submitBtn.classList.remove('loading');
                return;
            }
        }

        if (copyrightType === 'cc') {
            const ccType = document.getElementById('cc-type').value;
            if (!ccType) {
                this.showError('CC协议资源请选择具体协议类型');
                submitBtn.classList.remove('loading');
                return;
            }
        }

        if (category === 'electronic' && !this.selectedResourceFile) {
            this.showError('请上传数字资源文件');
            submitBtn.classList.remove('loading');
            return;
        }

        if (this.previewImages.length === 0) {
            this.showError('请至少上传一张截图');
            submitBtn.classList.remove('loading');
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const resourceData = {
            title,
            category,
            description,
            tags,
            type: category === 'electronic' ? '电子资源' : category === 'online' ? '线上资源' : '实物资源',
            link: link || null,
            location: location || null,
            price,
            screenshots: this.previewImages.map(img => img.dataUrl),
            author: {
                id: user.id,
                nickname: user.nickname,
                avatar: user.avatar
            },
            copyright: {
                type: copyrightType,
                statement: copyrightStatement,
                reprintSource: copyrightType === 'reprint' ? document.getElementById('reprint-source').value : null,
                reprintAuthor: copyrightType === 'reprint' ? document.getElementById('reprint-author').value : null,
                licenseProof: copyrightType === 'licensed' ? document.getElementById('license-proof').value : null,
                ccType: copyrightType === 'cc' ? document.getElementById('cc-type').value : null
            },
            downloadPoints: downloadPoints
        };

        if (category === 'electronic' && this.selectedResourceFile) {
            resourceData.resourceFile = {
                name: this.selectedResourceFile.name,
                size: this.selectedResourceFile.size,
                type: this.selectedResourceFile.type
            };
        }

        ResourceService.addUserResource(user.id, resourceData);

        submitBtn.classList.remove('loading');
        this.close();
        this.resetForm();

        window.dispatchEvent(new CustomEvent('resourceUploaded'));

        alert('资源发布成功！');
    }

    resetForm() {
        this.form.reset();
        this.previewImages = [];
        this.selectedResourceFile = null;
        this.renderPreviews();
        this.setTags([]);
        document.getElementById('desc-count').textContent = '0/500';
        document.getElementById('copyright-count').textContent = '0/200';
        document.getElementById('online-link-group').style.display = 'none';
        document.getElementById('physical-info-group').style.display = 'none';
        document.getElementById('physical-price-group').style.display = 'none';
        document.getElementById('electronic-file-group').style.display = 'none';
        document.getElementById('file-upload-placeholder').style.display = 'block';
        document.getElementById('selected-file').style.display = 'none';
        document.getElementById('reprint-source-group').style.display = 'none';
        document.getElementById('reprint-author-group').style.display = 'none';
        document.getElementById('license-proof-group').style.display = 'none';
        document.getElementById('cc-type-group').style.display = 'none';
        document.getElementById('download-points').value = '10';
    }

    open() {
        const user = AuthService.getCurrentUser();
        if (!user) {
            if (typeof authModal !== 'undefined') {
                authModal.open('login');
            }
            return;
        }

        this.isOpen = true;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.isOpen = false;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

window.UploadModal = UploadModal;
