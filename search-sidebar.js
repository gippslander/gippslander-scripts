(function() {
    const STORAGE_KEY = 'gippslander_saved_searches';

    function getSmartTitle() {
        const h1 = document.querySelector('h1');
        if (h1) {
            let title = h1.innerText.trim();
            // Clean common branding/location suffixes for the list view
            title = title.replace(/,?\s?Victoria,?\s?Australia/gi, '');
            return title.length > 35 ? title.substring(0, 32) + "..." : title;
        }
        return "Recent Search";
    }

    function isValidSearchPage() {
        const path = window.location.pathname.toLowerCase();
        const search = window.location.search.toLowerCase();
        
        // Recognizes standard search queries (?q=) AND filter-based searches
        const isSearchQuery = search.includes('filters') || search.includes('q=');
        
        // Validate if we are on the main /jobs page with a search, or a sub-category page
        if (path === '/jobs' || path === '/jobs/') {
            return isSearchQuery;
        }
        
        const pathSegments = path.split('/').filter(Boolean);
        return (path.includes('/jobs/') && pathSegments.length >= 2) || isSearchQuery;
    }

    function autoSaveSearch() {
        if (!isValidSearchPage()) return;
        const url = window.location.href;
        const title = getSmartTitle();
        let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        
        const existingIdx = saved.findIndex(s => s.url === url);
        
        if (existingIdx > -1) {
            // Move to top of history if it already exists
            const item = saved.splice(existingIdx, 1)[0];
            item.lastUsed = Date.now();
            saved.unshift(item);
        } else {
            // Add new entry
            saved.unshift({
                url: url,
                title: title,
                lastUsed: Date.now(),
                isPinned: false,
                timestamp: Date.now()
            });
        }
        
        // Maintain storage: keep pinned items + most recent 10 unpinned items
        const pinned = saved.filter(s => s.isPinned);
        const unpinned = saved.filter(s => !s.isPinned).slice(0, 10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...pinned, ...unpinned]));
        updateUI();
    }

    window.togglePin = function() {
        const url = window.location.href;
        let saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        let idx = saved.findIndex(s => s.url === url);
        
        if (idx === -1) {
            // Create and pin if it somehow isn't in history yet
            saved.unshift({
                url: url,
                title: getSmartTitle(),
                lastUsed: Date.now(),
                isPinned: true,
                timestamp: Date.now()
            });
        } else {
            saved[idx].isPinned = !saved[idx].isPinned;
            saved[idx].lastUsed = Date.now();
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
        updateUI();
    }

    function updateUI() {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const list = document.getElementById('recentSearchesList');
        const container = document.getElementById('quickLaunchContainer');
        const pinBtn = document.getElementById('saveSearchBtn');
        const pinText = document.getElementById('saveSearchText');
        const wrapper = document.getElementById('saveActionWrapper');

        // Show the Pin button only on valid search/category results pages
        if (isValidSearchPage() && wrapper) {
            wrapper.style.display = 'block';
        }

        if (saved.length > 0) {
            container.style.display = 'block';
            // Show up to 5 items, prioritized by Pinned status
            const sorted = [...saved].sort((a, b) => (b.isPinned - a.isPinned) || (b.lastUsed - a.lastUsed));
            const recent = sorted.slice(0, 5);
            
            list.innerHTML = recent.map(item => `
                <a href="${item.url}" class="gipps-history-item">
                    <span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="${item.isPinned ? '#5cb85c' : 'none'}" stroke="currentColor" stroke-width="3">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${item.title}
                    </span>
                    ${item.isPinned ? '<span class="pin-indicator">PINNED</span>' : ''}
                </a>
            `).join('');
        } else {
            container.style.display = 'none';
        }

        const currentSaved = saved.find(s => s.url === window.location.href);
        if (currentSaved && currentSaved.isPinned) {
            pinBtn.classList.add('is-pinned');
            pinText.innerText = "Pinned to dashboard";
        } else {
            pinBtn.classList.remove('is-pinned');
            pinText.innerText = "Pin this search";
        }
    }

    // Initialize
    autoSaveSearch();
    updateUI();
})();
