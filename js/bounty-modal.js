class BountyModal {
    constructor() {
        this.isOpen = false;
        this.render();
        this.bindEvents();
    }

    render() {
        const modal = document.createElement('div');
        modal.id = 'bounty-modal';
        modal.className = 'bounty-modal';
        modal.innerHTML = `
            <div class="bounty-modal-overlay"></div>
            <div class="bounty-modal-container">
                <div class="bounty-modal-header">
                    <h2>发布悬赏</h2>
                    <button class="bounty-modal-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="bounty-modal-body">
                    <form id="bounty-form">
                        <div class="form-group">
                            <label>
                                <i class="fas fa-heading"></i>
                                悬赏标题 <span class="required">*</span>
                            </label>
                            <input type="text" id="bounty-title" placeholder="简洁明了地描述你的需求，如：IB物理IA题目推荐" required maxlength="50">
                            <span class="char-count">0/50</span>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-coins"></i>
                                悬赏金额 <span class="required">*</span>
                            </label>
                            <div class="reward-selector">
                                <input type="number" id="bounty-reward" placeholder="设置悬赏金额" min="10" max="10000" required>
                                <span class="reward-unit">元</span>
                            </div>
                            <div class="reward-presets">
                                <button type="button" class="reward-preset" data-amount="50">¥50</button>
                                <button type="button" class="reward-preset" data-amount="100">¥100</button>
                                <button type="button" class="reward-preset" data-amount="200">¥200</button>
                                <button type="button" class="reward-preset" data-amount="500">¥500</button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-layer-group"></i>
                                悬赏分类 <span class="required">*</span>
                            </label>
                            <div class="category-selector">
                                <label class="category-option">
                                    <input type="radio" name="category" value="ib" required>
                                    <div class="category-card">
                                        <i class="fas fa-graduation-cap"></i>
                                        <span>IB</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="ap">
                                    <div class="category-card">
                                        <i class="fas fa-book"></i>
                                        <span>AP</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="alevel">
                                    <div class="category-card">
                                        <i class="fas fa-certificate"></i>
                                        <span>A-Level</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="sat">
                                    <div class="category-card">
                                        <i class="fas fa-pencil-alt"></i>
                                        <span>SAT/ACT</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="competition">
                                    <div class="category-card">
                                        <i class="fas fa-trophy"></i>
                                        <span>竞赛</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="application">
                                    <div class="category-card">
                                        <i class="fas fa-university"></i>
                                        <span>申请</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="interview">
                                    <div class="category-card">
                                        <i class="fas fa-comments"></i>
                                        <span>面试</span>
                                    </div>
                                </label>
                                <label class="category-option">
                                    <input type="radio" name="category" value="other">
                                    <div class="category-card">
                                        <i class="fas fa-ellipsis-h"></i>
                                        <span>其他</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-clock"></i>
                                截止日期
                            </label>
                            <input type="date" id="bounty-deadline">
                            <p class="form-hint">设置悬赏的截止日期，过期后悬赏将自动关闭</p>
                        </div>

                        <div class="form-group">
                            <label>
                                <i class="fas fa-edit"></i>
                                详细描述 <span class="required">*</span>
                            </label>
                            <textarea id="bounty-description" placeholder="详细描述你的需求，包括具体要求、期望结果、注意事项等（100-500字）" required minlength="100" maxlength="500"></textarea>
                            <span class="char-count" id="desc-count">0/500</span>
                        </div>

                        <div class="form-error" id="bounty-error"></div>

                        <div class="form-actions">
                            <button type="button" class="cancel-btn" id="bounty-cancel">取消</button>
                            <button type="submit" class="submit-btn">
                                <span class="btn-text">发布悬赏</span>
                                <span class="btn-loading"><i class="fas fa-spinner fa-spin"></i></span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modal = modal;
        this.form = document.getElementById('bounty-form');
    }

    bindEvents() {
        this.modal.querySelector('.bounty-modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.bounty-modal-overlay').addEventListener('click', () => this.close());
        document.getElementById('bounty-cancel').addEventListener('click', () => this.close());

        document.getElementById('bounty-title').addEventListener('input', (e) => {
            const count = e.target.value.length;
            e.target.nextElementSibling.textContent = `${count}/50`;
        });

        document.getElementById('bounty-description').addEventListener('input', (e) => {
            const count = e.target.value.length;
            document.getElementById('desc-count').textContent = `${count}/500`;
        });

        document.querySelectorAll('.reward-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = btn.dataset.amount;
                document.getElementById('bounty-reward').value = amount;
            });
        });

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    showError(message) {
        const errorDiv = document.getElementById('bounty-error');
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

        const title = document.getElementById('bounty-title').value;
        const reward = parseInt(document.getElementById('bounty-reward').value);
        const category = document.querySelector('input[name="category"]:checked')?.value;
        const deadline = document.getElementById('bounty-deadline').value;
        const description = document.getElementById('bounty-description').value;

        if (!title || !reward || !category || !description) {
            this.showError('请填写必填项');
            submitBtn.classList.remove('loading');
            return;
        }

        if (reward < 10) {
            this.showError('悬赏金额至少为10元');
            submitBtn.classList.remove('loading');
            return;
        }

        if (description.length < 100) {
            this.showError('描述内容至少需要100个字');
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
                if (!confirm('内容存在以下问题：\n' + warningMsg + '\n\n是否继续发布？')) {
                    submitBtn.classList.remove('loading');
                    return;
                }
            }
        }

        if (typeof PointsService !== 'undefined') {
            const currentBalance = PointsService.getBalance(user.id);
            if (currentBalance < reward) {
                this.showError(`积分不足！当前余额：${currentBalance}，需要：${reward}`);
                submitBtn.classList.remove('loading');
                return;
            }
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        const bountyData = {
            title,
            category,
            subcategory: 'other',
            reward,
            deadline: deadline || null,
            description,
            poster: {
                id: user.id,
                nickname: user.nickname,
                avatar: user.avatar
            }
        };

        BountyService.addBounty(bountyData);

        if (typeof PointsService !== 'undefined') {
            PointsService.deductTokens(
                user.id,
                reward,
                'bounty_published',
                `发布悬赏：${title}`,
                bountyData.id
            );
        }

        submitBtn.classList.remove('loading');
        this.close();
        this.resetForm();

        window.dispatchEvent(new CustomEvent('bountyCreated'));

        alert(`悬赏发布成功！已消耗 ${reward} 积分`);
    }

    resetForm() {
        this.form.reset();
        document.getElementById('desc-count').textContent = '0/50';
        document.getElementById('bounty-reward').value = '';
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

window.BountyModal = BountyModal;
