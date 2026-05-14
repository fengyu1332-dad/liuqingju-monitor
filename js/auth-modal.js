class AuthModal {
    constructor() {
        this.isOpen = false;
        this.currentView = 'login';
        this.registerStep = 1;
        this.registerData = {};
        this.render();
        this.bindEvents();
    }

    render() {
        const modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="auth-modal-overlay"></div>
            <div class="auth-modal-container">
                <button class="auth-modal-close">
                    <i class="fas fa-times"></i>
                </button>
                <div class="auth-modal-content">
                    <div class="auth-header">
                        <div class="auth-logo">
                            <i class="fas fa-landmark"></i>
                            <span>留情局</span>
                        </div>
                        <div class="auth-tabs">
                            <button class="auth-tab active" data-tab="login">登录</button>
                            <button class="auth-tab" data-tab="register">注册</button>
                        </div>
                    </div>
                    <div class="auth-body" id="auth-body-content">
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        this.modal = modal;
        this.bodyContent = document.getElementById('auth-body-content');
        this.showLogin();
    }

    bindEvents() {
        this.modal.querySelector('.auth-modal-close').addEventListener('click', () => this.close());
        this.modal.querySelector('.auth-modal-overlay').addEventListener('click', () => this.close());

        this.modal.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                if (tabName === 'login') {
                    this.showLogin();
                } else {
                    this.showRegister();
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    open(view = 'login') {
        this.isOpen = true;
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (view === 'register') {
            this.showRegister();
        }
    }

    close() {
        this.isOpen = false;
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.resetForms();
    }

    resetForms() {
        this.registerStep = 1;
        this.registerData = {};
    }

    showLogin() {
        this.currentView = 'login';
        this.modal.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === 'login');
        });
        this.bodyContent.innerHTML = `
            <form class="login-form" id="login-form">
                <div class="form-group">
                    <label for="login-email">
                        <i class="fas fa-envelope"></i>
                        邮箱
                    </label>
                    <input type="email" id="login-email" name="email" placeholder="请输入邮箱地址" required>
                </div>
                <div class="form-group">
                    <label for="login-password">
                        <i class="fas fa-lock"></i>
                        密码
                    </label>
                    <div class="password-input-wrapper">
                        <input type="password" id="login-password" name="password" placeholder="请输入密码" required>
                        <button type="button" class="toggle-password">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="form-row">
                    <label class="checkbox-label">
                        <input type="checkbox" name="remember">
                        <span>记住登录状态</span>
                    </label>
                    <a href="#" class="forgot-link">忘记密码？</a>
                </div>
                <div class="form-error" id="login-error"></div>
                <button type="submit" class="submit-btn">
                    <span class="btn-text">登录</span>
                    <span class="btn-loading"><i class="fas fa-spinner fa-spin"></i></span>
                </button>
            </form>
            <div class="auth-footer">
                <p>还没有账号？<a href="#" class="switch-to-register">立即注册</a></p>
            </div>
        `;
        this.bindLoginEvents();
    }

    bindLoginEvents() {
        const form = document.getElementById('login-form');
        const togglePasswordBtn = form.querySelector('.toggle-password');
        const switchToRegister = this.bodyContent.querySelector('.switch-to-register');

        if (togglePasswordBtn) {
            togglePasswordBtn.addEventListener('click', () => {
                const input = form.querySelector('#login-password');
                const icon = togglePasswordBtn.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        }

        if (switchToRegister) {
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegister();
            });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.submit-btn');
            const errorDiv = document.getElementById('login-error');

            submitBtn.classList.add('loading');
            errorDiv.textContent = '';

            const email = form.querySelector('#login-email').value;
            const password = form.querySelector('#login-password').value;

            try {
                await AuthService.login(email, password);
                const user = AuthService.getCurrentUser();
                if (user && typeof PointsService !== 'undefined') {
                    const gotBonus = PointsService.checkDailyLogin(user.id);
                    if (gotBonus) {
                        setTimeout(() => {
                            alert(`🎉 每日登录奖励：+5 积分！`);
                        }, 300);
                    }
                }
                submitBtn.classList.remove('loading');
                this.close();
                window.dispatchEvent(new CustomEvent('authSuccess'));
                if (typeof onAuthSuccess === 'function') {
                    onAuthSuccess();
                }
            } catch (error) {
                submitBtn.classList.remove('loading');
                errorDiv.textContent = error.message;
            }
        });
    }

    showRegister() {
        this.currentView = 'register';
        this.registerStep = 1;
        this.registerData = {};
        this.modal.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === 'register');
        });
        this.renderRegisterStep();
    }

    renderRegisterStep() {
        if (this.registerStep === 1) {
            this.bodyContent.innerHTML = `
                <div class="register-steps">
                    <div class="step-indicator">
                        <span class="step active">1</span>
                        <span class="step-line"></span>
                        <span class="step">2</span>
                        <span class="step-line"></span>
                        <span class="step">3</span>
                    </div>
                    <p class="step-title">第一步：基本信息</p>
                </div>
                <form class="register-form" id="register-form-step1">
                    <div class="form-group">
                        <label for="reg-email">
                            <i class="fas fa-envelope"></i>
                            邮箱
                        </label>
                        <input type="email" id="reg-email" name="email" placeholder="请输入邮箱地址" required>
                    </div>
                    <div class="form-group">
                        <label for="reg-nickname">
                            <i class="fas fa-user"></i>
                            昵称
                        </label>
                        <input type="text" id="reg-nickname" name="nickname" placeholder="请输入昵称（2-12个字符）" required minlength="2" maxlength="12">
                    </div>
                    <div class="form-group">
                        <label for="reg-password">
                            <i class="fas fa-lock"></i>
                            密码
                        </label>
                        <input type="password" id="reg-password" name="password" placeholder="请输入密码（至少6位）" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="reg-confirm-password">
                            <i class="fas fa-lock"></i>
                            确认密码
                        </label>
                        <input type="password" id="reg-confirm-password" name="confirmPassword" placeholder="请再次输入密码" required>
                    </div>
                    <div class="form-error" id="reg-error-step1"></div>
                    <button type="submit" class="submit-btn">
                        <span class="btn-text">下一步</span>
                        <span class="btn-loading"><i class="fas fa-spinner fa-spin"></i></span>
                    </button>
                </form>
                <div class="auth-footer">
                    <p>已有账号？<a href="#" class="switch-to-login">立即登录</a></p>
                </div>
            `;
            this.bindRegisterStep1Events();
        } else if (this.registerStep === 2) {
            this.bodyContent.innerHTML = `
                <div class="register-steps">
                    <div class="step-indicator">
                        <span class="step completed"><i class="fas fa-check"></i></span>
                        <span class="step-line completed"></span>
                        <span class="step active">2</span>
                        <span class="step-line"></span>
                        <span class="step">3</span>
                    </div>
                    <p class="step-title">第二步：学术背景</p>
                </div>
                <form class="register-form" id="register-form-step2">
                    <div class="form-group">
                        <label>
                            <i class="fas fa-graduation-cap"></i>
                            留学阶段
                        </label>
                        <div class="radio-group">
                            <label class="radio-label">
                                <input type="radio" name="studyStage" value="highschool" required>
                                <span>高中</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="studyStage" value="bachelor">
                                <span>本科</span>
                            </label>
                            <label class="radio-label">
                                <input type="radio" name="studyStage" value="master">
                                <span>研究生</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="reg-country">
                            <i class="fas fa-globe"></i>
                            意向国家/地区
                        </label>
                        <select id="reg-country" name="targetCountry" required>
                            <option value="">请选择意向国家/地区</option>
                            <option value="usa">美国</option>
                            <option value="uk">英国</option>
                            <option value="canada">加拿大</option>
                            <option value="australia">澳大利亚</option>
                            <option value="singapore">新加坡</option>
                            <option value="hongkong">香港</option>
                            <option value="japan">日本</option>
                            <option value="europe">欧洲其他国家</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>
                            <i class="fas fa-book"></i>
                            课程体系
                        </label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="curriculum" value="ib">
                                <span>IB</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="curriculum" value="ap">
                                <span>AP</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="curriculum" value="alevel">
                                <span>A-Level</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="curriculum" value="other">
                                <span>其他</span>
                            </label>
                        </div>
                    </div>
                    <div class="form-error" id="reg-error-step2"></div>
                    <div class="form-buttons">
                        <button type="button" class="back-btn" id="register-back-step2">
                            <i class="fas fa-arrow-left"></i>
                            返回
                        </button>
                        <button type="submit" class="submit-btn">
                            <span class="btn-text">下一步</span>
                            <span class="btn-loading"><i class="fas fa-spinner fa-spin"></i></span>
                        </button>
                    </div>
                </form>
            `;
            this.bindRegisterStep2Events();
        } else if (this.registerStep === 3) {
            this.bodyContent.innerHTML = `
                <div class="register-steps">
                    <div class="step-indicator">
                        <span class="step completed"><i class="fas fa-check"></i></span>
                        <span class="step-line completed"></span>
                        <span class="step completed"><i class="fas fa-check"></i></span>
                        <span class="step-line completed"></span>
                        <span class="step active">3</span>
                    </div>
                    <p class="step-title">第三步：补充信息（选填）</p>
                </div>
                <form class="register-form" id="register-form-step3">
                    <div class="form-group">
                        <label for="reg-schools">
                            <i class="fas fa-university"></i>
                            目标院校
                        </label>
                        <input type="text" id="reg-schools" name="targetSchools" placeholder="如：哈佛大学、MIT、斯坦福大学">
                    </div>
                    <div class="form-group">
                        <label for="reg-major">
                            <i class="fas fa-bookmark"></i>
                            意向专业
                        </label>
                        <input type="text" id="reg-major" name="major" placeholder="如：计算机科学、经济学、心理学">
                    </div>
                    <div class="form-group">
                        <label for="reg-strengths">
                            <i class="fas fa-star"></i>
                            擅长科目
                        </label>
                        <input type="text" id="reg-strengths" name="strengths" placeholder="如：数学、物理、英语">
                    </div>
                    <div class="form-error" id="reg-error-step3"></div>
                    <div class="form-buttons">
                        <button type="button" class="back-btn" id="register-back-step3">
                            <i class="fas fa-arrow-left"></i>
                            返回
                        </button>
                        <button type="submit" class="submit-btn">
                            <span class="btn-text">完成注册</span>
                            <span class="btn-loading"><i class="fas fa-spinner fa-spin"></i></span>
                        </button>
                    </div>
                </form>
            `;
            this.bindRegisterStep3Events();
        }
    }

    bindRegisterStep1Events() {
        const form = document.getElementById('register-form-step1');
        const switchToLogin = this.bodyContent.querySelector('.switch-to-login');

        if (switchToLogin) {
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLogin();
            });
        }

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.submit-btn');
            const errorDiv = document.getElementById('reg-error-step1');

            submitBtn.classList.add('loading');
            errorDiv.textContent = '';

            const email = form.querySelector('#reg-email').value;
            const nickname = form.querySelector('#reg-nickname').value;
            const password = form.querySelector('#reg-password').value;
            const confirmPassword = form.querySelector('#reg-confirm-password').value;

            if (password !== confirmPassword) {
                submitBtn.classList.remove('loading');
                errorDiv.textContent = '两次输入的密码不一致';
                return;
            }

            this.registerData.email = email;
            this.registerData.nickname = nickname;
            this.registerData.password = password;

            submitBtn.classList.remove('loading');
            this.registerStep = 2;
            this.renderRegisterStep();
        });
    }

    bindRegisterStep2Events() {
        const form = document.getElementById('register-form-step2');
        const backBtn = document.getElementById('register-back-step2');

        backBtn.addEventListener('click', () => {
            this.registerStep = 1;
            this.renderRegisterStep();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.submit-btn');
            const errorDiv = document.getElementById('reg-error-step2');

            submitBtn.classList.add('loading');
            errorDiv.textContent = '';

            const studyStage = form.querySelector('input[name="studyStage"]:checked');
            const targetCountry = form.querySelector('#reg-country').value;
            const curriculum = Array.from(form.querySelectorAll('input[name="curriculum"]:checked'))
                .map(cb => cb.value);

            if (!studyStage) {
                submitBtn.classList.remove('loading');
                errorDiv.textContent = '请选择留学阶段';
                return;
            }

            if (!targetCountry) {
                submitBtn.classList.remove('loading');
                errorDiv.textContent = '请选择意向国家/地区';
                return;
            }

            this.registerData.studyStage = studyStage.value;
            this.registerData.targetCountry = targetCountry;
            this.registerData.curriculum = curriculum;

            submitBtn.classList.remove('loading');
            this.registerStep = 3;
            this.renderRegisterStep();
        });
    }

    bindRegisterStep3Events() {
        const form = document.getElementById('register-form-step3');
        const backBtn = document.getElementById('register-back-step3');

        backBtn.addEventListener('click', () => {
            this.registerStep = 2;
            this.renderRegisterStep();
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('.submit-btn');
            const errorDiv = document.getElementById('reg-error-step3');

            submitBtn.classList.add('loading');
            errorDiv.textContent = '';

            this.registerData.targetSchools = form.querySelector('#reg-schools').value;
            this.registerData.major = form.querySelector('#reg-major').value;
            this.registerData.strengths = form.querySelector('#reg-strengths').value;

            try {
                await AuthService.register(this.registerData);
                submitBtn.classList.remove('loading');
                this.showRegisterSuccess();
            } catch (error) {
                submitBtn.classList.remove('loading');
                errorDiv.textContent = error.message;
            }
        });
    }

    showRegisterSuccess() {
        this.bodyContent.innerHTML = `
            <div class="register-success">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>注册成功！</h3>
                <p>欢迎加入留情局，开始你的留学之旅</p>
                <button class="submit-btn" id="go-to-homepage">
                    <span class="btn-text">开始探索</span>
                </button>
            </div>
        `;

        document.getElementById('go-to-homepage').addEventListener('click', () => {
            this.close();
            window.location.href = 'index.html';
        });
    }
}

window.AuthModal = AuthModal;
