(function() {
    const JOBS_KEY = 'gippslander_saved_jobs';
    const SEARCH_KEY = 'gippslander_saved_searches';
    let currentTab = 'jobs';
    let lastDeletedItems = []; 
    let lastDeletedKey = null;
    let toastTimeout = null;

    function cleanTitle(title) {
        if (!title) return "Item listing";
        return title.split(/[|]| - /)[0].trim();
    }

    function getItems() {
        const storageKey = currentTab === 'jobs' ? JOBS_KEY : SEARCH_KEY;
        let items = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (currentTab === 'searches') {
            items.sort((a, b) => (b.isPinned - a.isPinned) || (b.lastUsed - a.lastUsed));
        } else {
            items.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        }
        return items;
    }

    window.switchTab = function(type, updateURL = true) {
        currentTab = type;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`tab-${type}`);
        if(activeBtn) activeBtn.classList.add('active');
        
        const searchInput = document.getElementById('dashboard-search');
        if(searchInput) searchInput.value = '';
        
        if (updateURL) window.history.replaceState(null, null, window.location.pathname + '?tab=' + type);
        renderItems();
    };

    window.filterList = function() {
        const searchInput = document.getElementById('dashboard-search');
        renderItems(searchInput ? searchInput.value.toLowerCase() : "");
    };

    window.renderItems = function(filterTerm = "") {
        const listEl = document.getElementById('saved-items-list');
        const countText = document.getElementById('item-count-text');
        const clearBtn = document.getElementById('clear-all-btn');
        const searchWrapper = document.getElementById('search-wrapper');
        if(!listEl) return;

        let rawItems = getItems();
        
        const jobsCount = document.getElementById('count-jobs');
        const searchCount = document.getElementById('count-searches');
        if(jobsCount) jobsCount.innerText = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]").length;
        if(searchCount) searchCount.innerText = JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]").length;

        if(searchWrapper) searchWrapper.style.display = rawItems.length > 5 ? 'block' : 'none';

        let items = rawItems.filter(i => i.title.toLowerCase().includes(filterTerm));
        const unpinnedCount = currentTab === 'searches' ? items.filter(i => !i.isPinned).length : items.length;
        if(clearBtn) clearBtn.style.display = unpinnedCount > 0 ? 'block' : 'none';

        if (items.length === 0) {
            const isSearching = filterTerm.length > 0;
            listEl.innerHTML = `
                <div class="empty-state">
                    <p>${isSearching ? `No results for "${filterTerm}"` : `You haven't saved any ${currentTab} yet.`}</p>
                    ${!isSearching ? `<a href="/jobs/" class="empty-state-btn">Browse jobs</a>` : ''}
                </div>`;
            if(countText) countText.innerText = "List empty";
            return;
        }

        let html = "";
        let hasPinned = items.some(i => i.isPinned);

        if (currentTab === 'searches' && hasPinned) {
            html += `<div style="font-size:0.75rem; color:var(--text-muted); margin:20px 0 10px; font-weight:800; text-transform:none;">Pinned searches</div>`;
            items.filter(i => i.isPinned).forEach(item => html += generateItemHTML(item, rawItems.indexOf(item)));
            const unpinnedItems = items.filter(i => !i.isPinned);
            if (unpinnedItems.length > 0) {
                html += `<div style="font-size:0.75rem; color:var(--text-muted); margin:20px 0 10px; font-weight:800; text-transform:none;">Recent searches</div>`;
                unpinnedItems.forEach(item => html += generateItemHTML(item, rawItems.indexOf(item)));
            }
        } else {
            items.forEach(item => html += generateItemHTML(item, rawItems.indexOf(item)));
        }

        if(countText) countText.innerText = `Showing ${items.length} ${currentTab === 'jobs' ? 'job' : 'search'}${items.length === 1 ? '' : 's'}`;
        listEl.innerHTML = html;
    };

    function generateItemHTML(item, originalIdx) {
        const isPinned = item.isPinned === true;
        const dateStr = item.lastUsed ? new Date(item.lastUsed).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : 'Recently';
        
        return `
            <div class="saved-item ${isPinned ? 'is-pinned' : ''}" id="item-${currentTab}-${originalIdx}">
                <div class="item-details">
                    <a href="${item.url}">${cleanTitle(item.title)}</a>
                    <div class="item-meta">
                        ${isPinned ? '<span class="pin-badge">★ Pinned</span>' : ''}
                        <span>Last used: ${dateStr}</span>
                    </div>
                </div>
                <div class="button-group">
                    ${currentTab === 'searches' ? `<button class="action-btn pin-btn ${isPinned ? 'active' : ''}" onclick="togglePinStatus(${originalIdx})">${isPinned ? '★' : '☆ Pin'}</button>` : ''}
                    <button class="action-btn remove-btn" onclick="removeItem(${originalIdx})">Remove</button>
                </div>
            </div>`;
    }

    window.removeItem = function(index) {
        const el = document.getElementById(`item-${currentTab}-${index}`);
        if(el) el.classList.add('item-removing');

        setTimeout(() => {
            const storageKey = currentTab === 'jobs' ? JOBS_KEY : SEARCH_KEY;
            let allItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
            let sortedItems = getItems();
            let itemToRemove = sortedItems[index];

            lastDeletedItems = [itemToRemove];
            lastDeletedKey = storageKey;
            
            localStorage.setItem(storageKey, JSON.stringify(allItems.filter(i => i.url !== itemToRemove.url)));
            renderItems(document.getElementById('dashboard-search')?.value.toLowerCase() || "");
            showUndoToast(false);
        }, 300);
    };

    window.clearAll = function() {
        const storageKey = currentTab === 'jobs' ? JOBS_KEY : SEARCH_KEY;
        let allItems = JSON.parse(localStorage.getItem(storageKey) || "[]");
        
        if (currentTab === 'jobs') {
            lastDeletedItems = [...allItems];
            localStorage.setItem(storageKey, JSON.stringify([]));
        } else {
            lastDeletedItems = allItems.filter(i => !i.isPinned);
            localStorage.setItem(storageKey, JSON.stringify(allItems.filter(i => i.isPinned)));
        }

        lastDeletedKey = storageKey;
        renderItems();
        showUndoToast(true);
    };

    function showUndoToast(isBulk) {
        const toast = document.getElementById('gipps-undo-toast');
        const msg = document.getElementById('undo-message');
        if(!toast || !msg) return;

        msg.innerText = isBulk ? "Items cleared" : "Item removed";
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => toast.classList.remove('show'), 5000);
    }

    window.undoDelete = function() {
        let items = JSON.parse(localStorage.getItem(lastDeletedKey) || "[]");
        const existingUrls = new Set(items.map(i => i.url));
        lastDeletedItems.forEach(item => { if (!existingUrls.has(item.url)) items.push(item); });
        localStorage.setItem(lastDeletedKey, JSON.stringify(items));
        const toast = document.getElementById('gipps-undo-toast');
        if(toast) toast.classList.remove('show');
        renderItems();
    };

    window.togglePinStatus = function(index) {
        let allItems = JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]");
        let itemToToggle = getItems()[index];
        let originalIdx = allItems.findIndex(i => i.url === itemToToggle.url);
        if (originalIdx > -1) {
            allItems[originalIdx].isPinned = !allItems[originalIdx].isPinned;
            localStorage.setItem(SEARCH_KEY, JSON.stringify(allItems));
            const searchInput = document.getElementById('dashboard-search');
            renderItems(searchInput ? searchInput.value.toLowerCase() : "");
        }
    };

    // Auto-switch based on URL param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'searches') {
        setTimeout(() => switchTab('searches', false), 50);
    } else {
        setTimeout(renderItems, 800);
    }
})();
