
class PerformanceOptimization {
    constructor() {
        this.init();
    }

    init() {
        this.setupLazyLoading();
        this.setupVirtualScroll();
        this.setupDebouncing();
    }

    setupLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        if (img.dataset.srcset) {
                            img.srcset = img.dataset.srcset;
                        }
                        img.classList.add('loaded');
                        img.removeAttribute('data-src');
                        img.removeAttribute('data-srcset');
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: '200px 0px' });

            images.forEach(img => imageObserver.observe(img));
        } else {
            images.forEach(img => {
                img.src = img.dataset.src;
                if (img.dataset.srcset) {
                    img.srcset = img.dataset.srcset;
                }
            });
        }
    }

    setupVirtualScroll() {
        const virtualLists = document.querySelectorAll('.virtual-list');
        virtualLists.forEach(list => {
            this.initVirtualList(list);
        });
    }

    initVirtualList(list) {
        const itemHeight = 80;
        const totalItems = parseInt(list.dataset.total || 100);
        const visibleHeight = list.clientHeight;
        const bufferSize = 5;

        let scrollTop = 0;
        let startIndex = 0;
        let endIndex = Math.min(bufferSize * 2, totalItems);

        const spacerTop = document.createElement('div');
        const spacerBottom = document.createElement('div');
        const container = document.createElement('div');
        
        spacerTop.className = 'virtual-spacer-top';
        spacerBottom.className = 'virtual-spacer-bottom';
        container.className = 'virtual-container';

        list.innerHTML = '';
        list.appendChild(spacerTop);
        list.appendChild(container);
        list.appendChild(spacerBottom);

        const updateRenderedItems = () => {
            startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
            endIndex = Math.min(totalItems, startIndex + Math.ceil(visibleHeight / itemHeight) + bufferSize * 2);
            
            spacerTop.style.height = `${startIndex * itemHeight}px`;
            spacerBottom.style.height = `${(totalItems - endIndex) * itemHeight}px`;
            
            const renderData = list.dataset.renderFn;
            if (window[renderData]) {
                container.innerHTML = window[renderData](startIndex, endIndex);
            }
        };

        list.addEventListener('scroll', (e) => {
            scrollTop = list.scrollTop;
            requestAnimationFrame(updateRenderedItems);
        });

        updateRenderedItems();
    }

    setupDebouncing() {
        window.debounce = (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        };

        window.throttle = (func, limit) => {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.performanceOptimization = new PerformanceOptimization();
});
