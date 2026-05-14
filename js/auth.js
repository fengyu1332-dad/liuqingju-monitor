const AUTH_TOKEN_KEY = 'liuqingju_auth_token';
const USER_DATA_KEY = 'liuqingju_user_data';
const USERS_DB_KEY = 'liuqingju_users_db';

const AuthService = {
    generateToken() {
        return 'jwt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'hash_' + Math.abs(hash).toString(16);
    },

    getUsers() {
        const users = localStorage.getItem(USERS_DB_KEY);
        return users ? JSON.parse(users) : [];
    },

    saveUsers(users) {
        localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    },

    getCurrentUser() {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        const userData = localStorage.getItem(USER_DATA_KEY);
        if (token && userData) {
            return JSON.parse(userData);
        }
        return null;
    },

    isLoggedIn() {
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    },

    register(userData) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = this.getUsers();

                const existingUser = users.find(u => u.email === userData.email);
                if (existingUser) {
                    reject(new Error('该邮箱已被注册'));
                    return;
                }

                const newUser = {
                    id: 'user_' + Date.now(),
                    email: userData.email,
                    password: this.hashPassword(userData.password),
                    nickname: userData.nickname,
                    avatar: `https://neeko-copilot.bytedance.net/api/text_to_image?prompt=avatar%20${userData.nickname}&image_size=square`,
                    createdAt: new Date().toISOString(),
                    stats: {
                        tokens: 0,
                        contributionValue: 0,
                        lastLoginDate: new Date().toDateString(),
                        totalPosts: 0,
                        totalReplies: 0,
                        totalResources: 0,
                        totalEarnings: 0
                    },
                    profile: {
                        studyStage: userData.studyStage || '',
                        targetCountry: userData.targetCountry || '',
                        curriculum: userData.curriculum || [],
                        targetSchools: userData.targetSchools || [],
                        major: userData.major || '',
                        strengths: userData.strengths || []
                    }
                };

                users.push(newUser);
                this.saveUsers(users);

                const token = this.generateToken();
                const userForSession = { ...newUser };
                delete userForSession.password;

                localStorage.setItem(AUTH_TOKEN_KEY, token);
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(userForSession));

                resolve(userForSession);
            }, 800);
        });
    },

    login(email, password) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const users = this.getUsers();
                const hashedPassword = this.hashPassword(password);

                const user = users.find(u => u.email === email && u.password === hashedPassword);

                if (!user) {
                    reject(new Error('邮箱或密码错误'));
                    return;
                }

                const token = this.generateToken();
                const userForSession = { ...user };
                delete userForSession.password;

                localStorage.setItem(AUTH_TOKEN_KEY, token);
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(userForSession));

                resolve(userForSession);
            }, 600);
        });
    },

    logout() {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
        window.dispatchEvent(new CustomEvent('authChange', { detail: { isLoggedIn: false } }));
    },

    updateProfile(updates) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const currentUser = this.getCurrentUser();
                if (!currentUser) {
                    reject(new Error('用户未登录'));
                    return;
                }

                const users = this.getUsers();
                const userIndex = users.findIndex(u => u.id === currentUser.id);

                if (userIndex === -1) {
                    reject(new Error('用户不存在'));
                    return;
                }

                users[userIndex] = {
                    ...users[userIndex],
                    ...updates,
                    profile: {
                        ...users[userIndex].profile,
                        ...updates.profile
                    }
                };

                this.saveUsers(users);

                const userForSession = { ...users[userIndex] };
                delete userForSession.password;
                localStorage.setItem(USER_DATA_KEY, JSON.stringify(userForSession));

                resolve(userForSession);
            }, 500);
        });
    },

    changePassword(oldPassword, newPassword) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const currentUser = this.getCurrentUser();
                if (!currentUser) {
                    reject(new Error('用户未登录'));
                    return;
                }

                const users = this.getUsers();
                const userIndex = users.findIndex(u => u.id === currentUser.id);

                if (userIndex === -1) {
                    reject(new Error('用户不存在'));
                    return;
                }

                const hashedOldPassword = this.hashPassword(oldPassword);
                if (users[userIndex].password !== hashedOldPassword) {
                    reject(new Error('原密码错误'));
                    return;
                }

                users[userIndex].password = this.hashPassword(newPassword);
                this.saveUsers(users);

                resolve(true);
            }, 500);
        });
    }
};

window.AuthService = AuthService;
