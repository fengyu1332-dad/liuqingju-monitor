const BOOKMARKS_KEY = 'liuqingju_bookmarks';

const BookmarkService = {
    getBookmarks(userId) {
        const key = `${BOOKMARKS_KEY}_${userId}`;
        const bookmarks = localStorage.getItem(key);
        return bookmarks ? JSON.parse(bookmarks) : [];
    },

    saveBookmarks(userId, bookmarks) {
        const key = `${BOOKMARKS_KEY}_${userId}`;
        localStorage.setItem(key, JSON.stringify(bookmarks));
    },

    isBookmarked(userId, itemId) {
        const bookmarks = this.getBookmarks(userId);
        return bookmarks.includes(itemId);
    },

    toggleBookmark(userId, type, itemId) {
        const bookmarks = this.getBookmarks(userId);
        const index = bookmarks.indexOf(itemId);

        if (index > -1) {
            bookmarks.splice(index, 1);
        } else {
            bookmarks.push(itemId);
        }

        this.saveBookmarks(userId, bookmarks);
        return index === -1;
    },

    addBookmark(userId, itemId) {
        const bookmarks = this.getBookmarks(userId);
        if (!bookmarks.includes(itemId)) {
            bookmarks.push(itemId);
            this.saveBookmarks(userId, bookmarks);
        }
    },

    removeBookmark(userId, itemId) {
        const bookmarks = this.getBookmarks(userId);
        const index = bookmarks.indexOf(itemId);
        if (index > -1) {
            bookmarks.splice(index, 1);
            this.saveBookmarks(userId, bookmarks);
        }
    },

    getBookmarkedItems(userId, type) {
        const bookmarks = this.getBookmarks(userId);
        return bookmarks.filter(id => id.startsWith(`${type}_`));
    }
};

window.BookmarkService = BookmarkService;
