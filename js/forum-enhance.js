// 论坛增强功能
// 帖子编辑、删除、表情反应、@提醒

function togglePostMenu(postId) {
    const ownerActions = document.getElementById(`owner-actions-${postId}`);
    const currentUser = AuthService.getCurrentUser();
    const posts = ForumService?.getPosts() || [];
    const post = posts.find(p => p.id === postId);
    
    if (currentUser && post && post.author?.id === currentUser.id) {
        ownerActions.style.display = ownerActions.style.display === 'none' ? 'flex' : 'none';
    }
}

function showEditPostModal(postId) {
    const posts = ForumService?.getPosts() || [];
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const editModal = document.createElement('div');
    editModal.id = 'edit-post-modal';
    editModal.className = 'report-modal active';
    editModal.innerHTML = `
        <div class="report-modal-overlay" onclick="closeEditPostModal()"></div>
        <div class="report-modal-container">
            <div class="report-modal-header">
                <h2><i class="fas fa-edit"></i> 编辑帖子</h2>
                <button class="report-modal-close" onclick="closeEditPostModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="report-modal-body">
                <div class="form-group">
                    <label><i class="fas fa-heading"></i> 标题</label>
                    <input type="text" id="edit-post-title" value="${post.title || ''}" placeholder="输入帖子标题">
                </div>
                <div class="form-group">
                    <label><i class="fas fa-align-left"></i> 内容</label>
                    <textarea id="edit-post-content" placeholder="输入帖子内容">${post.content || ''}</textarea>
                </div>
                <div class="form-actions">
                    <button class="cancel-btn" onclick="closeEditPostModal()">取消</button>
                    <button class="submit-btn" onclick="submitEditPost('${postId}')">
                        <i class="fas fa-save"></i> 保存修改
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(editModal);
}

function closeEditPostModal() {
    const modal = document.getElementById('edit-post-modal');
    if (modal) modal.remove();
}

function submitEditPost(postId) {
    const title = document.getElementById('edit-post-title')?.value;
    const content = document.getElementById('edit-post-content')?.value;

    if (!title?.trim()) {
        alert('标题不能为空');
        return;
    }

    const posts = JSON.parse(localStorage.getItem('liuqingju_posts') || '[]');
    const postIndex = posts.findIndex(p => p.id === postId);
    
    if (postIndex !== -1) {
        posts[postIndex].title = title;
        posts[postIndex].content = content;
        posts[postIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('liuqingju_posts', JSON.stringify(posts));
        
        closeEditPostModal();
        renderPosts();
        alert('帖子已更新！');
    }
}

function showDeletePostConfirm(postId) {
    if (confirm('确定要删除这篇帖子吗？此操作不可撤销。')) {
        const posts = JSON.parse(localStorage.getItem('liuqingju_posts') || '[]');
        const filteredPosts = posts.filter(p => p.id !== postId);
        localStorage.setItem('liuqingju_posts', JSON.stringify(filteredPosts));
        renderPosts();
        alert('帖子已删除');
    }
}

function toggleReactionPicker(postId) {
    const picker = document.getElementById(`reaction-picker-${postId}`);
    document.querySelectorAll('.reaction-picker').forEach(p => {
        if (p.id !== `reaction-picker-${postId}`) p.style.display = 'none';
    });
    picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
}

function addReaction(postId, reactionType) {
    const reactions = JSON.parse(localStorage.getItem('liuqingju_reactions') || '{}');
    const postReactions = reactions[postId] || {};
    
    const currentUser = AuthService.getCurrentUser();
    const userId = currentUser?.id || 'anonymous';
    
    if (postReactions[userId] === reactionType) {
        delete postReactions[userId];
    } else {
        postReactions[userId] = reactionType;
    }
    
    reactions[postId] = postReactions;
    localStorage.setItem('liuqingju_reactions', JSON.stringify(reactions));
    
    updateReactionSummary(postId);
    const picker = document.getElementById(`reaction-picker-${postId}`);
    if (picker) picker.style.display = 'none';
}

function updateReactionSummary(postId) {
    const reactions = JSON.parse(localStorage.getItem('liuqingju_reactions') || '{}');
    const postReactions = reactions[postId] || {};
    
    const emojiMap = {
        'like': '👍',
        'love': '❤️',
        'laugh': '😂',
        'wow': '😮',
        'sad': '😢',
        'angry': '😡'
    };
    
    const counts = {};
    Object.values(postReactions).forEach(r => {
        counts[r] = (counts[r] || 0) + 1;
    });
    
    const summaryHtml = Object.entries(counts)
        .map(([type, count]) => `<span class="reaction-count">${emojiMap[type]} ${count}</span>`)
        .join('');
    
    const summaryEl = document.getElementById(`reaction-summary-${postId}`);
    if (summaryEl) summaryEl.innerHTML = summaryHtml;
}

function handleReplyInput(input, postId) {
    const value = input.value;
    const mentionMatch = value.match(/@(\w*)$/);
    
    if (mentionMatch) {
        const query = mentionMatch[1];
        showMentionSuggestions(postId, query);
    } else {
        hideMentionSuggestions(postId);
    }
}

function showMentionSuggestions(postId, query) {
    const container = document.getElementById(`mention-suggestions-${postId}`);
    if (!container) return;
    
    const posts = ForumService?.getPosts() || [];
    const replies = posts.flatMap(p => p.replyList || []);
    
    const users = {};
    replies.forEach(r => {
        if (r.author?.nickname) {
            users[r.author.nickname] = r.author;
        }
    });
    
    const matches = Object.entries(users)
        .filter(([name]) => name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
    
    if (matches.length > 0) {
        container.innerHTML = matches.map(([name, user]) => `
            <div class="mention-item" onclick="selectMention('${postId}', '${name}')">
                <img src="${user.avatar || 'https://via.placeholder.com/30'}" alt="">
                <span>${name}</span>
            </div>
        `).join('');
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

function hideMentionSuggestions(postId) {
    const container = document.getElementById(`mention-suggestions-${postId}`);
    if (container) container.style.display = 'none';
}

function selectMention(postId, username) {
    const input = document.getElementById(`reply-input-${postId}`);
    if (!input) return;
    
    let value = input.value;
    value = value.replace(/@\w*$/, `@${username} `);
    input.value = value;
    hideMentionSuggestions(postId);
    input.focus();
}

function handleReplyKeydown(event, postId) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        submitReply(postId);
    }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.reaction-btn-wrapper')) {
        document.querySelectorAll('.reaction-picker').forEach(p => p.style.display = 'none');
    }
    if (!e.target.closest('.reply-input-container')) {
        document.querySelectorAll('.mention-suggestions').forEach(s => s.style.display = 'none');
    }
});
