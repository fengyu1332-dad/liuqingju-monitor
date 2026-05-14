
class AIHelper {
    constructor() {
        this.summarizer = new ContentSummarizer();
        this.recommender = new ContentRecommender();
        this.initUI();
    }

    initUI() {
        const style = document.createElement('style');
        style.textContent = `
            .ai-summary-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 13px;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: all 0.3s;
                margin: 8px 0;
            }
            
            .ai-summary-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            .ai-summary-content {
                background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,74,162,0.1) 100%);
                border-left: 3px solid #667eea;
                padding: 16px;
                border-radius: 8px;
                margin: 12px 0;
                display: none;
            }
            
            .ai-summary-content.show {
                display: block;
            }
            
            .ai-recommendations {
                margin: 20px 0;
                padding: 16px;
                background: var(--bg-light);
                border-radius: 12px;
            }
            
            .ai-recommendations h4 {
                font-size: 15px;
                color: var(--text-primary);
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .ai-recommendation-item {
                padding: 12px;
                background: var(--bg-white);
                border-radius: 8px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .ai-recommendation-item:hover {
                background: var(--secondary-color);
                transform: translateX(4px);
            }
            
            .ai-loading {
                display: flex;
                align-items: center;
                gap: 8px;
                color: var(--text-secondary);
                font-size: 13px;
            }
            
            .ai-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid var(--border-color);
                border-top-color: #667eea;
                border-radius: 50%;
                animation: ai-spin 0.8s linear infinite;
            }
            
            @keyframes ai-spin {
                to { transform: rotate(360deg); }
            }
            
            .ai-match-score {
                background: #667eea;
                color: white;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
        
        this.addSummaryButtons();
        this.addRecommendations();
    }

    addSummaryButtons() {
        const contentCards = document.querySelectorAll('.content-card, .post-card, .resource-card');
        contentCards.forEach(card => {
            if (!card.querySelector('.ai-summary-btn')) {
                const btn = document.createElement('button');
                btn.className = 'ai-summary-btn';
                btn.innerHTML = '<i class="fas fa-magic"></i> AI 摘要';
                btn.onclick = () => this.showSummary(card);
                const content = card.querySelector('.content-card-body') || card;
                content.insertBefore(btn, content.firstChild);
            }
        });
    }

    showSummary(card) {
        let existingSummary = card.querySelector('.ai-summary-content');
        if (existingSummary) {
            existingSummary.classList.toggle('show');
            return;
        }

        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'ai-summary-content show';
        summaryDiv.innerHTML = `
            <div class="ai-loading">
                <div class="ai-spinner"></div>
                <span>正在生成摘要...</span>
            </div>
        `;
        card.querySelector('.content-card-body')?.appendChild(summaryDiv) || card.appendChild(summaryDiv);

        setTimeout(() => {
            const title = card.querySelector('.content-card-title, .post-title, .resource-card-title')?.textContent || '内容';
            const summary = this.summarizer.generate(title, card);
            summaryDiv.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <i class="fas fa-magic" style="color: #667eea;"></i>
                    <span style="font-weight: 600; color: var(--text-primary); font-size: 14px;">AI 智能摘要</span>
                </div>
                <p style="font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin: 0;">
                    ${summary}
                </p>
            `;
        }, 1500);
    }

    addRecommendations() {
        const sidebar = document.querySelector('.content-right, .forum-sidebar');
        if (sidebar && !sidebar.querySelector('.ai-recommendations')) {
            const recSection = document.createElement('div');
            recSection.className = 'ai-recommendations sidebar-section';
            recSection.innerHTML = `
                <h4><i class="fas fa-lightbulb"></i> 为你推荐</h4>
                <div id="ai-rec-list">
                    <div class="ai-loading">
                        <div class="ai-spinner"></div>
                        <span>正在加载推荐...</span>
                    </div>
                </div>
            `;
            sidebar.insertBefore(recSection, sidebar.firstChild);

            setTimeout(() => {
                const recList = recSection.querySelector('#ai-rec-list');
                recList.innerHTML = this.recommender.getRecommendations().map(rec => `
                    <div class="ai-recommendation-item">
                        <span style="font-size: 13px; color: var(--text-primary);">${rec.title}</span>
                        <span class="ai-match-score">${rec.score}% 匹配</span>
                    </div>
                `).join('');
            }, 2000);
        }
    }
}

class ContentSummarizer {
    generate(title, contentCard) {
        const templates = [
            `这篇内容关于「${title}」，主要分享了相关的经验和见解。建议仔细阅读，可以获得实用的学习方法和技巧。`,
            `本篇详细介绍了「${title}」的核心要点，适合正在准备相关考试或申请的同学参考学习。`,
            `这份内容提供了「${title}」的全面指南，包含了实用技巧和案例分析，值得收藏反复阅读。`,
            `通过「${title}」的分享，作者总结了宝贵的经验，能帮助你避免常见的错误，提高学习效率。`
        ];
        return templates[Math.floor(Math.random() * templates.length)];
    }
}

class ContentRecommender {
    getRecommendations() {
        const currentUser = AuthService?.getCurrentUser?.() || { level: 'member' };
        const allRecs = [
            { title: 'IB 选课指南与心得分享', score: 95 },
            { title: '2025 美国大学申请时间规划', score: 88 },
            { title: 'AP 5 分备考经验合集', score: 82 },
            { title: '留学文书写作技巧与范例', score: 78 },
            { title: 'GPA 提升高效学习方法', score: 75 }
        ];
        return allRecs.slice(0, 3);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.aiHelper = new AIHelper();
});
