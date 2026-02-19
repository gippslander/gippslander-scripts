var dashTabs = (function() {
    const cb = new Date().getTime();
    const LOC_URL = `https://cdn.jsdelivr.net/gh/gippslander/assets@main/locations.json?v=${cb}`;
    const SEARCH_KEY = 'gippslander_saved_searches';
    const ACTIVE_TAB_KEY = 'gippslander_active_tab';
    let locationsData = [];

    function cleanTitle(title) { if (!title) return "Saved item"; return title.split(/[|]| - /)[0].trim(); }
    function getStored(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : []; } catch(e) { return []; } }

    async function loadLocations() {
        try { 
            const res = await fetch(LOC_URL);
            locationsData = await res.json();
        } catch (e) { console.error("Locs fail"); }
        updateBadges();
    }

    function updateBadges() {
        const searches = getStored(SEARCH_KEY);
        const jobs = getStored('gippslander_saved_jobs');
        
        const sBtn = document.getElementById('btn-saved-searches');
        if (searches.length === 0) sBtn?.classList.add('hidden');
        else if (sBtn) { sBtn.classList.remove('hidden'); sBtn.innerHTML = `Searches <span class="tab-count">${searches.length}</span>`; }
        
        const jBtn = document.getElementById('btn-saved-jobs');
        if (jobs.length === 0) jBtn?.classList.add('hidden');
        else if (jBtn) { jBtn.classList.remove('hidden'); jBtn.innerHTML = `Saved jobs <span class="tab-count">${jobs.length}</span>`; }
    }

    async function open(tabName) {
        localStorage.setItem(ACTIVE_TAB_KEY, tabName);

        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.browse-tab').forEach(el => el.classList.remove('active'));
        
        document.getElementById('tab-' + tabName)?.classList.add('active');
        document.getElementById('btn-' + tabName)?.classList.add('active');
        
        if(tabName === 'locations') await renderLocations();
        if(tabName === 'courses') renderCourses();
        if(tabName === 'saved-searches') renderSaved('searches');
        if(tabName === 'saved-jobs') renderSaved('jobs');
    }

    function togglePin(url) {
        let items = getStored(SEARCH_KEY);
        const index = items.findIndex(i => i.url === url);
        if (index > -1) {
            items[index].isPinned = !items[index].isPinned;
            localStorage.setItem(SEARCH_KEY, JSON.stringify(items));
            renderSaved('searches'); 
            updateBadges();
        }
    }

    async function renderLocations() {
        const c = document.getElementById('tab-locations');
        if (locationsData.length === 0) {
            c.innerHTML = '<div class="empty-message">Loading locations...</div>';
            await loadLocations();
        }
        if (locationsData.length === 0) { c.innerHTML = '<div class="empty-message">Could not load locations.</div>'; return; }
        
        const top = locationsData.sort((a,b) => (b.priority || 0) - (a.priority || 0)).slice(0, 7);
        let html = top.map(loc => `<a href="${loc.full_name ? '/jobs/in-' + loc.full_name.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-') : '/jobs?location=' + encodeURIComponent(loc.label)}" class="sector-card"><div class="card-icon-bubble"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div><div class="sector-info"><span class="sector-title">${loc.label}</span></div></a>`).join('');
        html += `<a href="/locations" class="sector-card manage-card">View all locations &rarr;</a>`;
        c.innerHTML = html;
    }

    async function renderCourses() {
        const c = document.getElementById('tab-courses');
        if(!c || c.children.length > 0) return;
        c.innerHTML = `<div class="empty-message">Loading courses...</div>`;
        
        const COURSES_URL = `https://cdn.jsdelivr.net/gh/gippslander/assets@main/courses.json?v=${cb}`;

        try {
            const res = await fetch(COURSES_URL);
            const data = await res.json();
            
            const feat = data.slice(0, 7);
            
            let html = feat.map(i => {
                const logoHtml = i.logo 
                    ? `<img src="${i.logo}" style="width:100%; height:100%; object-fit:contain;">` 
                    : `<svg viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>`;
                    
                return `<a href="${i.link || '#'}" target="_blank" class="sector-card">
                    <div class="card-icon-bubble">${logoHtml}</div>
                    <div class="sector-info">
                        <span class="sector-title">${i.title}</span>
                        <span class="sector-meta">${i.duration || 'Online'}</span>
                    </div>
                </a>`;
            }).join('');
            
            html += `<a href="/courses" class="sector-card manage-card">View all courses &rarr;</a>`;
            c.innerHTML = html;
        } catch (e) { 
            console.error(e);
            c.innerHTML = `<div class="empty-message">Error loading courses.</div>`; 
        }
    }

    function renderSaved(type) {
        const c = document.getElementById('tab-saved-' + type);
        let items = getStored('gippslander_saved_' + type);
        
        if (items.length === 0) { 
            const msg = type === 'searches' ? 'recent searches' : 'saved jobs';
            c.innerHTML = `<div class="empty-message">No ${msg} yet.</div>`; 
            return; 
        }

        if (type === 'searches') {
            items.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || (b.lastUsed || 0) - (a.lastUsed || 0));
        } else {
            items.sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0));
        }
        
        items = items.slice(0, 8);

        let html = items.map(i => {
            const isPinned = i.isPinned === true;
            if (type === 'searches') {
                return `
                <div class="sector-card" onclick="window.location.href='${i.url}'">
                    <div class="card-icon-bubble ${isPinned ? 'pinned' : ''}">
                        <svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                    </div>
                    <div class="sector-info">
                        <span class="sector-title">${cleanTitle(i.title)}</span>
                        <span class="sector-meta">${i.lastUsed ? new Date(i.lastUsed).toLocaleDateString('en-AU', {month:'short', day:'numeric'}) : 'Recently'}</span>
                    </div>
                    <button class="pin-btn ${isPinned ? 'active' : ''}" onclick="event.stopPropagation(); dashTabs.togglePin('${i.url}')">
                        <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                    </button>
                </div>`;
            } else {
                return `
                <a href="${i.url}" class="sector-card">
                    <div class="card-icon-bubble">
                        <svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>
                    </div>
                    <div class="sector-info">
                        <span class="sector-title">${cleanTitle(i.title)}</span>
                        <span class="sector-meta">${i.lastUsed ? new Date(i.lastUsed).toLocaleDateString('en-AU', {month:'short', day:'numeric'}) : 'Recently'}</span>
                    </div>
                </a>`;
            }
        }).join('');
        
        html += `<a href="/my?tab=${type === 'searches' ? 'searches' : 'jobs'}" class="sector-card manage-card">Manage all &rarr;</a>`;
        c.innerHTML = html;
    }

    async function init() {
        await loadLocations();
        const lastTab = localStorage.getItem(ACTIVE_TAB_KEY);
        if (lastTab && document.getElementById('tab-' + lastTab)) {
            open(lastTab);
        }
    }
    
    init();

    return { open, togglePin };
})();
