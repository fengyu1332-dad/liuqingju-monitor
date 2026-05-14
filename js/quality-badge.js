class QualityBadge {
    constructor(post, engagement = {}) {
        this.post = post;
        this.engagement = engagement;
        this.qualityScore = PostQualityService.calculateQualityScore(post, engagement);
        this.qualityLevel = PostQualityService.getQualityLevel(this.qualityScore);
    }

    renderCardBadge() {
        if (this.qualityScore < 40) return '';

        return `
            <span class="quality-badge quality-badge-${this.qualityLevel.label}" 
                  style="background: ${this.qualityLevel.bgColor}; color: ${this.qualityLevel.color};"
                  title="质量评分: ${this.qualityScore}">
                ${this.qualityLevel.icon} ${this.qualityLevel.label}
            </span>
        `;
    }

    renderDetailBadge(showScore = true) {
        if (this.qualityScore < 40) return '';

        return `
            <span class="quality-badge quality-badge-${this.qualityLevel.label}" 
                  style="background: ${this.qualityLevel.bgColor}; color: ${this.qualityLevel.color};"
                  onclick="QualityBadgeUI.showQualityDetail('${this.post.id}')"
                  title="点击查看质量详情">
                ${this.qualityLevel.icon} ${this.qualityLevel.label}
                ${showScore ? `<span style="margin-left: 4px; font-size: 12px;">${this.qualityScore}</span>` : ''}
            </span>
        `;
    }

    renderScoreDisplay() {
        return `
            <div class="quality-score-display" style="
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                background: ${this.qualityLevel.bgColor};
                color: ${this.qualityLevel.color};
                border-radius: 12px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
            " onclick="QualityBadgeUI.showQualityDetail('${this.post.id}')">
                ${this.qualityLevel.icon}
                <span>${this.qualityScore}分</span>
                <span style="font-size: 11px; opacity: 0.8;">${this.qualityLevel.label}</span>
            </div>
        `;
    }

    renderProgressBar(width = '100%') {
        return `
            <div class="quality-progress" style="
                width: ${width};
                height: 8px;
                background: #f0f0f0;
                border-radius: 4px;
                overflow: hidden;
                position: relative;
            ">
                <div style="
                    width: ${this.qualityScore}%;
                    height: 100%;
                    background: ${this.qualityLevel.color};
                    border-radius: 4px;
                    transition: width 0.3s ease;
                "></div>
                <div style="
                    position: absolute;
                    top: 50%;
                    left: ${this.qualityScore}%;
                    transform: translate(-50%, -50%);
                    width: 12px;
                    height: 12px;
                    background: white;
                    border: 2px solid ${this.qualityLevel.color};
                    border-radius: 50%;
                "></div>
            </div>
        `;
    }
}

class QualityBadgeUI {
    static showQualityDetail(postId) {
        const post = ForumService?.getPostById(postId);
        if (!post) return;

        const qualityScore = PostQualityService.calculateQualityScore(post, {});
        const qualityLevel = PostQualityService.getQualityLevel(qualityScore);
        const breakdown = PostQualityService.getQualityBreakdown(post, {});
        const recommendations = PostQualityService.getQualityRecommendations(post);

        const modal = document.createElement('div');
        modal.id = 'quality-detail-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
        `;

        modal.innerHTML = `
            <div style="
                width: 560px;
                max-width: 90vw;
                max-height: 85vh;
                background: white;
                border-radius: 20px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                overflow: hidden;
                animation: modalSlideIn 0.3s ease;
            ">
                <div style="
                    padding: 24px 28px;
                    background: linear-gradient(135deg, ${qualityLevel.color}, ${qualityLevel.bgColor});
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div>
                        <h2 style="margin: 0 0 8px 0; font-size: 20px; display: flex; align-items: center; gap: 8px;">
                            ${qualityLevel.icon} 帖子质量分析
                        </h2>
                        <p style="margin: 0; font-size: 14px; opacity: 0.9;">
                            ${post.title || '未知帖子'}
                        </p>
                    </div>
                    <button onclick="this.closest('#quality-detail-modal').remove()" style="
                        width: 36px;
                        height: 36px;
                        border: none;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border-radius: 50%;
                        cursor: pointer;
                        font-size: 18px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div style="padding: 28px; overflow-y: auto; max-height: calc(85vh - 100px);">
                    <div style="
                        text-align: center;
                        margin-bottom: 28px;
                        padding: 24px;
                        background: ${qualityLevel.bgColor};
                        border-radius: 16px;
                    ">
                        <div style="
                            font-size: 64px;
                            font-weight: 700;
                            color: ${qualityLevel.color};
                            line-height: 1;
                            margin-bottom: 8px;
                        ">
                            ${qualityScore}
                        </div>
                        <div style="
                            font-size: 16px;
                            color: ${qualityLevel.color};
                            font-weight: 600;
                            margin-bottom: 16px;
                        ">
                            ${qualityLevel.icon} ${qualityLevel.label}
                        </div>
                        <div style="
                            display: flex;
                            justify-content: center;
                            gap: 4px;
                        ">
                            ${this.renderStarRating(qualityScore / 20)}
                        </div>
                    </div>

                    <div style="margin-bottom: 24px;">
                        <h3 style="
                            font-size: 16px;
                            font-weight: 600;
                            margin-bottom: 16px;
                            color: #333;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-chart-pie" style="color: ${qualityLevel.color};"></i>
                            质量评分明细
                        </h3>
                        
                        ${this.renderBreakdownItem('内容质量', breakdown.content, QUALITY_WEIGHTS.content)}
                        ${this.renderBreakdownItem('互动数据', breakdown.engagement, QUALITY_WEIGHTS.engagement)}
                        ${this.renderBreakdownItem('实用性', breakdown.helpfulness, QUALITY_WEIGHTS.helpfulness)}
                        ${this.renderBreakdownItem('时效性', breakdown.freshness, QUALITY_WEIGHTS.freshness)}
                        ${this.renderBreakdownItem('作者贡献', breakdown.author, QUALITY_WEIGHTS.author)}
                    </div>

                    ${recommendations.length > 0 ? `
                        <div style="
                            background: #fff3cd;
                            border: 1px solid #ffc107;
                            border-radius: 12px;
                            padding: 20px;
                        ">
                            <h3 style="
                                font-size: 15px;
                                font-weight: 600;
                                margin-bottom: 12px;
                                color: #856404;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                            ">
                                <i class="fas fa-lightbulb"></i>
                                质量提升建议
                            </h3>
                            <ul style="margin: 0; padding-left: 20px; color: #856404; font-size: 14px; line-height: 2;">
                                ${recommendations.map(r => `
                                    <li style="margin-bottom: 8px;">
                                        <strong>${r.area}:</strong> ${r.message}
                                        <span style="
                                            margin-left: 8px;
                                            padding: 2px 8px;
                                            background: ${r.priority === 'high' ? '#dc3545' : r.priority === 'medium' ? '#fd7e14' : '#28a745'};
                                            color: white;
                                            border-radius: 8px;
                                            font-size: 11px;
                                        ">
                                            ${r.priority === 'high' ? '重要' : r.priority === 'medium' ? '建议' : '可选'}
                                        </span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : `
                        <div style="
                            background: #d4edda;
                            border: 1px solid #28a745;
                            border-radius: 12px;
                            padding: 20px;
                            text-align: center;
                            color: #155724;
                        ">
                            <i class="fas fa-check-circle" style="font-size: 32px; margin-bottom: 12px;"></i>
                            <p style="margin: 0; font-weight: 600;">帖子质量优秀！</p>
                        </div>
                    `}

                    <div style="
                        margin-top: 24px;
                        padding: 16px;
                        background: #f8f9fa;
                        border-radius: 12px;
                        font-size: 12px;
                        color: #666;
                        text-align: center;
                    ">
                        <i class="fas fa-info-circle"></i>
                        质量评分根据内容、互动、实用性等多维度综合计算，每小时更新一次
                    </div>
                </div>
            </div>

            <style>
                @keyframes modalSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            </style>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    static renderBreakdownItem(label, score, weight) {
        const percentage = (score * weight) / 100;
        
        return `
            <div style="margin-bottom: 16px;">
                <div style="
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                ">
                    <span style="font-weight: 500; color: #555;">${label}</span>
                    <span style="font-weight: 600; color: #333;">
                        ${Math.round(score)}分
                        <span style="font-size: 12px; color: #999; font-weight: normal;">
                            (权重 ${weight}%)
                        </span>
                    </span>
                </div>
                <div style="
                    width: 100%;
                    height: 10px;
                    background: #e9ecef;
                    border-radius: 5px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${score}%;
                        height: 100%;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        border-radius: 5px;
                        transition: width 0.3s ease;
                    "></div>
                </div>
            </div>
        `;
    }

    static renderStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

        let html = '';
        
        for (let i = 0; i < fullStars; i++) {
            html += '<i class="fas fa-star" style="color: #FFD700; font-size: 20px;"></i>';
        }
        
        if (hasHalfStar) {
            html += '<i class="fas fa-star-half-alt" style="color: #FFD700; font-size: 20px;"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            html += '<i class="far fa-star" style="color: #ddd; font-size: 20px;"></i>';
        }
        
        return html;
    }

    static renderPostCard(post, engagement = {}) {
        const badge = new QualityBadge(post, engagement);
        
        const badgesHtml = [
            badge.renderCardBadge(),
            post.pinned ? '<span class="pin-badge">📌 置顶</span>' : '',
            post.solved ? '<span class="solved-badge">✅ 已解决</span>' : ''
        ].filter(Boolean).join('');

        return badgesHtml;
    }
}

window.QualityBadge = QualityBadge;
window.QualityBadgeUI = QualityBadgeUI;
