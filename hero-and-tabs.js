(function() {
    const cacheBuster = new Date().getTime(); 
    const DATA_URLS = { jobs: `https://cdn.jsdelivr.net/gh/gippslander/assets@main/jobs.json?v=${cacheBuster}`, locations: `https://cdn.jsdelivr.net/gh/gippslander/assets@main/locations.json?v=${cacheBuster}` };
    const FALLBACK_DATA = { jobs: [ { "label": "nurse", "priority": 10 } ], locations: [ { "label": "Traralgon", "priority": 10 } ] };
    let jobsData = []; let locationsData = [];

    function cleanTitle(title) { if (!title) return "Saved item"; return title.split(/[|]| - /)[0].trim(); }
    function getStoredItems(key) { try { const raw = localStorage.getItem(key); if (!raw) return []; return JSON.parse(raw); } catch (e) { return []; } }

    async function loadData() {
        initTabs();
        try { 
            const [jRes, lRes] = await Promise.all([fetch(DATA_URLS.jobs), fetch(DATA_URLS.locations)]);
            jobsData = await jRes.json(); locationsData = await lRes.json();
        } catch (e) { jobsData = FALLBACK_DATA.jobs; locationsData = FALLBACK_DATA.locations; }
        setupKeywordSearch(); setupLocationSearch(); renderDynamicTags();
    }

    function initTabs() {
        const searches = getStoredItems('gippslander_saved_searches');
        const jobs = getStoredItems('gippslander_saved_jobs');
        const searchBtn = document.getElementById('btn-saved-searches');
        if (searches.length === 0) searchBtn?.classList.add('hidden');
        else if (searchBtn) searchBtn.innerHTML = `Saved searches <span class="tab-count">${searches.length}</span>`;
        const jobBtn = document.getElementById('btn-saved-jobs');
        if (jobs.length === 0) jobBtn?.classList.add('hidden');
        else if (jobBtn) jobBtn.innerHTML = `Saved jobs <span class="tab-count">${jobs.length}</span>`;
    }

    function renderDynamicTags() {
        const container = document.getElementById('tags-container'); if (!container) return;
        const date = new Date(); let dailySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        const seededRandom = () => { var x = Math.sin(dailySeed++) * 10000; return x - Math.floor(x); };
        const getWeightedRandom = (arr, count) => { const pool = [...arr].filter(item => (typeof item === 'string' ? true : (item.priority && item.priority > 0))); if (pool.length === 0) return []; const selected = []; for (let i = 0; i < count; i++) { let totalWeight = 0; pool.forEach(item => totalWeight += (typeof item === 'string' ? 1 : (item.priority || 1))); let random = seededRandom() * totalWeight; for (let j = 0; j < pool.length; j++) { const item = pool[j]; const weight = (typeof item === 'string') ? 1 : (item.priority || 1); random -= weight; if (random <= 0) { selected.push(item); pool.splice(j, 1); break; } } if (pool.length === 0) break; } return selected; };
        
        let tagsHTML = '<span class="tag-label">Trending:</span>';
        getWeightedRandom(locationsData, 2).forEach(loc => { 
            tagsHTML += `<a href="https://gippslander.com.au/jobs?location=${encodeURIComponent(loc.full_name || loc.label)}&location_id=${loc.location_id || ''}" class="tag"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>${loc.label}</a>`; 
        });
        getWeightedRandom(jobsData, 2).forEach(job => { 
            const label = job.label || job; 
            tagsHTML += `<a href="https://gippslander.com.au/jobs?q=${encodeURIComponent(label)}" class="tag"><svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>${label}</a>`; 
        });
        container.innerHTML = tagsHTML;
    }

    function buildDefaultMenu(list, input, type) {
        list.innerHTML = ''; let recent = (type === 'job') ? getStoredItems('gippslander_saved_searches').slice(0,3) : [];
        if (recent.length > 0) {
            const hLi = document.createElement("li"); hLi.className = "no-hover"; hLi.innerHTML = `<span style="font-size:0.7rem; color:#9ca3af; text-transform:uppercase; font-weight:700;">Recent searches</span>`;
            list.appendChild(hLi);
            recent.forEach(item => { 
                const li = document.createElement("li"); 
                // SVG CLOCK ICON:
                li.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="width:16px; height:16px; color:#9ca3af; margin-right:8px;"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>${item.title}`; 
                li.onclick = () => window.location.href = item.url; list.appendChild(li); 
            });
            const div = document.createElement("li"); div.className = "no-hover"; div.style.height = "1px"; div.style.background = "#f3f4f6"; div.style.margin = "5px 0"; list.appendChild(div);
        }
        const allLi = document.createElement("li"); const allTxt = (type === 'job') ? "All jobs" : "Whole of Gippsland"; 
        allLi.innerHTML = `<strong style="color:#4CAF50;">${allTxt}</strong>`;
        allLi.onclick = () => { input.value = allTxt; if(type === 'location'){ document.getElementById("hidden-location-id").value = ""; document.getElementById("hidden-full-name").value = ""; } list.classList.remove('active'); };
        list.appendChild(allLi);
        const dataSet = (type === 'job') ? jobsData : locationsData;
        dataSet.filter(x => x.priority >= 7).sort((a,b) => b.priority - a.priority).slice(0, 5).forEach(item => {
            const li = document.createElement("li"); 
            li.innerHTML = item.label; 
            li.onclick = () => { input.value = item.label; if(type==='location'){ document.getElementById("hidden-location-id").value = item.location_id || ''; document.getElementById("hidden-full-name").value = item.full_name || item.label; } list.classList.remove('active'); };
            list.appendChild(li);
        });
        list.classList.add('active');
    }

    function setupKeywordSearch() {
        const i = document.getElementById("input-keyword"); const l = document.getElementById("list-keyword"); if(!i) return;
        i.onfocus = i.onclick = () => { if(!i.value.trim()) buildDefaultMenu(l, i, 'job'); };
        i.oninput = () => { const v = i.value.toUpperCase().trim(); l.innerHTML = ''; if(!v){ buildDefaultMenu(l, i, 'job'); return; }
            let count = 0; jobsData.forEach(item => { const label = item.label || item; if(count < 6 && label.toUpperCase().startsWith(v)){ count++; 
                const li = document.createElement("li"); 
                li.innerHTML = `<strong>${label.substr(0, v.length)}</strong>${label.substr(v.length)}`; 
                li.onclick = () => { i.value = label; l.classList.remove('active'); }; l.appendChild(li); } });
            l.classList.toggle('active', count > 0);
        };
        document.addEventListener('click', e => { if(e.target !== i && e.target !== l) l.classList.remove('active'); });
    }

    function setupLocationSearch() {
        const i = document.getElementById("input-location"); const l = document.getElementById("list-location"); if(!i) return;
        i.onfocus = i.onclick = () => { if(!i.value.trim()) buildDefaultMenu(l, i, 'location'); };
        i.oninput = () => { document.getElementById("hidden-location-id").value = ''; const v = i.value.toUpperCase().trim(); l.innerHTML = ''; if(!v){ buildDefaultMenu(l, i, 'location'); return; }
            let count = 0; locationsData.forEach(item => { const label = item.label.toUpperCase(); const pc = item.postcode ? item.postcode.toString() : ""; if(count < 8 && (label.startsWith(v) || pc.startsWith(v))){ count++; 
                const li = document.createElement("li"); 
                li.innerHTML = pc.startsWith(v) ? `${item.label} (<strong>${pc}</strong>)` : `<strong>${item.label.substr(0, v.length)}</strong>${item.label.substr(v.length)} ${pc ? '('+pc+')' : ''}`; 
                li.onclick = () => { i.value = item.label; document.getElementById("hidden-location-id").value = item.location_id || ''; document.getElementById("hidden-full-name").value = item.full_name || item.label; l.classList.remove('active'); }; l.appendChild(li); } });
            l.classList.toggle('active', count > 0);
        };
        document.addEventListener('click', e => { if(e.target !== i && e.target !== l) l.classList.remove('active'); });
    }

    window.executeSearch = function() {
        let q = document.getElementById('input-keyword').value; let ln = document.getElementById('hidden-full-name').value; let lid = document.getElementById('hidden-location-id').value; const tl = document.getElementById('input-location').value.trim();
        if(q === "All jobs") q = ""; if(tl === "Whole of Gippsland"){ ln = ""; lid = ""; } else if(!lid && tl){ const m = locationsData.find(loc => (loc.label.toLowerCase() === tl.toLowerCase()) || (loc.postcode?.toString() === tl)); if(m){ ln = m.full_name || m.label; lid = m.location_id; } }
        const p = new URLSearchParams(); if(q) p.append('q', q); if(ln) p.append('location', ln); if(lid) p.append('location_id', lid);
        window.location.href = 'https://gippslander.com.au/jobs?' + p.toString();
    }

    window.openTab = function(tabName) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active')); document.querySelectorAll('.browse-tab').forEach(el => el.classList.remove('active'));
        document.getElementById('tab-' + tabName)?.classList.add('active'); document.getElementById('btn-' + tabName)?.classList.add('active');
        if(tabName === 'locations') renderLocationsGrid(); if(tabName === 'courses') renderCoursesGrid(); if(tabName === 'saved-searches') renderSavedGrid('searches'); if(tabName === 'saved-jobs') renderSavedGrid('jobs');
    };

    function renderLocationsGrid() {
        const c = document.getElementById('tab-locations'); if(!c || c.children.length > 0) return;
        const top = locationsData.filter(l => l.priority >= 7).sort((a,b) => b.priority - a.priority).slice(0, 7);
        let html = top.map(loc => `<a href="${loc.full_name ? '/jobs/in-' + loc.full_name.toLowerCase().replace(/,/g, '').replace(/\s+/g, '-') : '/jobs?location=' + encodeURIComponent(loc.label)}" class="sector-card"><div class="card-icon-bubble"><svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div><div class="sector-info"><span class="sector-title">${loc.label}</span></div></a>`).join('');
        html += `<a href="/locations" class="sector-card manage-card">View all locations &rarr;</a>`; c.innerHTML = html;
    }

    async function renderCoursesGrid() {
        const c = document.getElementById('tab-courses'); if(!c || c.children.length > 0) return;
        c.innerHTML = `<div class="empty-message">Loading courses...</div>`;
        const query = `{ courses { courseTitle logo active featured provider { name } url } }`;
        try {
            const res = await fetch("https://api.baseql.com/airtable/graphql/appnoS15udCLKToYs", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
            const result = await res.json();
            const feat = result.data.courses.filter(i => (i.active === true || String(i.active) === "true") && (i.featured === true || String(i.featured) === "true")).slice(0, 7);
            let html = feat.map(i => {
                const logo = (i.logo && i.logo[0]) ? (typeof i.logo[0] === 'string' ? i.logo[0] : i.logo[0].url) : "";
                return `<a href="${i.url || '#'}" target="_blank" class="sector-card"><div class="card-icon-bubble">${logo ? '<img src="'+logo+'">' : '<svg viewBox="0 0 24 24"><path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/></svg>'}</div><div class="sector-info"><span class="sector-title">${i.courseTitle}</span><span class="sector-meta">${i.provider[0].name}</span></div></a>`;
            }).join('');
            html += `<a href="/courses" class="sector-card manage-card">View all courses &rarr;</a>`; c.innerHTML = html;
        } catch (e) { c.innerHTML = `<div class="empty-message">Error loading courses.</div>`; }
    }

    function renderSavedGrid(type) {
        const c = document.getElementById('tab-saved-' + type); if(!c || c.children.length > 0) return;
        const items = getStoredItems('gippslander_saved_' + type).slice(0, 7);
        let html = items.map(i => `<a href="${i.url}" class="sector-card"><div class="card-icon-bubble">${type==='searches' ? '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>'}</div><div class="sector-info"><span class="sector-title">${cleanTitle(i.title)}</span><span class="sector-meta">${i.lastUsed ? new Date(i.lastUsed).toLocaleDateString('en-AU', {month:'short', day:'numeric'}) : 'Recently'}</span></div></a>`).join('');
        html += `<a href="/my?tab=${type === 'searches' ? 'searches' : 'jobs'}" class="sector-card manage-card">Manage all &rarr;</a>`; c.innerHTML = html;
    }

    loadData();
})();
