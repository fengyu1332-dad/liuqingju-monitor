class PostModal {
    constructor() {
        this.isOpen = false;
        this.render();
        this.bindEvents();
    }

    render() {
        const modal = document.createElement('div');
        modal.id = 'post-modal';
        modal.className = 'post-modal';
        modal.innerHTML = `
            <div class="post-modal-overlay"></div>
            <div class="post-modal-container">
                <div class="post-modal-header">
                    <h2>发布帖子</h2>
                    <button class="post-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="post-modal-body">
                    <form id="post-form">
                        <div class="form-group">
                            <label>
                                <i class="fas fa-tag"></i>
                                帖子分类 <span class="required">*</span>
                            </label>
                            <div class="category-selector">
                                <label class="category-option">
                                    <input type="radio" name="post-category" value="experience" required>
                                    <div class="category-card">
                                        <i class="fas fa-lightbulb"></i>
                                        <span>经验分享</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="post-category" value="resources">
                                    <div class="category-card">
                                        <i class="fas fa-gift"></i>
                                        <span>资源分享</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="post-category" value="school">
                                    <div class="category-card">
                                        <i class="fas fa-graduation-cap"></i>
                                        <span>择校交流</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="post-category" value="competition">
                                    <div class="category-card">
                                        <i class="fas fa-trophy"></i>
                                        <span>竞赛情报</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="post-category" value="interview">
                                    <div class="category-card">
                                        <i class="fas fa-comments"></i>
                                        <span>面试心得</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="post-category" value="qa">
                                    <div class="category-card">
                                        <i class="fas fa-question-circle"></i>
                                        <span>求助问答</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-heading"></i>
                                帖子标题 <span class="required">*</span>
                            </label>
                            <input type="text" id="post-title" placeholder="简洁明了地描述你的话题，如：【经验分享】IB数学如何备考" required maxlength="80">
                            <span class="char-count">0/80</span>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-edit"></i>
                                帖子内容 <span class="required">*</span>
                            </label>
                            <textarea id="post-content" placeholder="详细描述你的问题、经验或分享内容" required minlength="20" maxlength="5000"></textarea>
                            <span class="char-count" id="content-count">0/5000</span>
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
                                    </div>
                                </div>
                                <div class="tag-category">
                                    <span class="tag-category-title">学科/话题</span>
                                    <div class="tag-options">
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="数学"><span>数学</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="物理"><span>物理</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="化学"><span>化学</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="生物"><span>生物</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="经济"><span>经济</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="计算机"><span>计算机</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="择校"><span>择校</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="申请"><span>申请</span></label>
                                        <label class="tag-option"><input type="checkbox" name="tag-topic" value="面试"><span>面试</span></label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="form-error" id="post-error"></div>

                        <div class="form-actions">
                            <button type="button" class="cancel-btn" id="post-cancel">取消</button>
                            <button type="submit" class="submit-btn">
                                <span class="btn-text">发布帖子</span>
                                <span class="btn-loading"><i class="fas fa-spinner fa-spin"></i></span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modal = modal;
        this.form = document.getElementById('post-form');
    }

    bindEvents() {
        this.modal.querySelector('.post-modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.post-modal-overlay').addEventListener('click', () => this.close());
        document.getElementById('post-cancel').addEventListener('click', () => this.close());

        document.getElementById('post-title').addEventListener('input', (e) => {
            const count = e.target.value.length;
            e.target.nextElementSibling.textContent = `${count}/80`;
        });

        document.getElementById('post-content').addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('content-count').textContent = `${count}/5000`;
        });

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    getTags() {
        const tags = [];
        const curriculumTags = Array.from(this.modal.querySelectorAll('input[name="tag-curriculum"]:checked')).map(cb => cb.value);
        const topicTags = Array.from(this.modal.querySelectorAll('input[name="tag-topic"]:checked')).map(cb => cb.value);
        tags.push(...curriculumTags, ...topicTags);
        return tags;
    }

    showError(message) {
        const errorDiv = document.getElementById('post-error');
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

        const title = document.getElementById('post-title').value;
        const category = document.querySelector('input[name="post-category"]:checked')?.value;
        const content = document.getElementById('post-content').value;
        const tags = this.getTags();

        if (!title || !category || !content) {
            this.showError('请填写必填项');
            submitBtn.classList.remove('loading');
            return;
        }

        if (content.length < 20) {
            this.showError('帖子内容至少需要20个字');
            submitBtn.classList.remove('loading');
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const categoryText = {
            'experience': '经验分享',
            'resources': '资源分享',
            'school': '择校交流',
            'competition': '竞赛情报',
            'interview': '面试心得',
            'qa': '求助问答'
        };

        const postData = {
            title,
            category,
            categoryText: categoryText[category],
            content,
            tags,
            author: {
                id: user.id,
                nickname: user.nickname,
                avatar: user.avatar
            }
        };

        ForumService.addPost(postData);

        submitBtn.classList.remove('loading');
        this.close();
        this.resetForm();

        window.dispatchEvent(new CustomEvent('postCreated'));

        alert('帖子发布成功！');
    }

    resetForm() {
        this.form.reset();
        document.getElementById('content-count').textContent = '0/5000';
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

window.PostModal = PostModal;
