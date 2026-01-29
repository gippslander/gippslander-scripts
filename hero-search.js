(function() {
    // --- 1. CONFIGURATION ---
    // We keep the cacheBuster to ensure the user's browser doesn't hold old data
    const cacheBuster = new Date().getTime(); 
    
    const DATA_URLS = {
        // UPDATED: Now serving from fast Production CDN (jsDelivr)
        jobs: `https://cdn.jsdelivr.net/gh/gippslander/assets@main/jobs.json?v=${cacheBuster}`,
        locations: `https://cdn.jsdelivr.net/gh/gippslander/assets@main/locations.json?v=${cacheBuster}`
    };

    // --- 2. FALLBACK DATA ---
    const FALLBACK_DATA = {
        jobs: [ { "label": "Nurse", "priority": 10 }, { "label": "Retail", "priority": 5 } ],
        locations: [ { "label": "Traralgon", "priority": 10 }, { "label": "Warragul", "priority": 8 } ]
    };

    let jobsData = [];
    let locationsData = [];

    // --- 3. HELPER: GET RECENT SEARCHES ---
    function getRecentSearches() {
        try {
            const raw = localStorage.getItem('gippslander_saved_searches');
            if (!raw) return [];
            const data = JSON.parse(raw);
            // Take top 3 most recent
            return data.slice(0, 3);
        } catch (e) {
            return [];
        }
    }

    // --- 4. LOAD DATA (PARALLEL FETCH) ---
    async function loadData() {
        try {
            // Promise.all fetches both files simultaneously
            const [jobsResponse, locationsResponse] = await Promise.all([
                fetch(DATA_URLS.jobs),
                fetch(DATA_URLS.locations)
            ]);

            if (!jobsResponse.ok || !locationsResponse.ok) throw new Error("Fetch failed");

            jobsData = await jobsResponse.json();
            locationsData = await locationsResponse.json();

        } catch (error) {
            console.warn("Gippslander: Data fetch failed, using fallback.", error);
            jobsData = FALLBACK_DATA.jobs;
            locationsData = FALLBACK_DATA.locations;
        }

        setupKeywordSearch();
        setupLocationSearch();
        renderDynamicTags();
    }

    // --- 5. TAG RENDERER ---
    function renderDynamicTags() {
        const container = document.getElementById('tags-container');
        if (!container) return;

        const labelHTML = '<span class="tag-label">Trending:</span>';
        let tagsHTML = '';

        // Seeded Random for consistent daily tags
        const date = new Date();
        let dailySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
        const seededRandom = () => { var x = Math.sin(dailySeed++) * 10000; return x - Math.floor(x); };

        const getWeightedRandom = (arr, count) => {
            const pool = arr.filter(item => (typeof item === 'string' ? true : (item.priority && item.priority > 0)));
            if (pool.length === 0) return [];
            const selected = [];
            for (let i = 0; i < count; i++) {
                let totalWeight = 0;
                pool.forEach(item => totalWeight += (typeof item === 'string' ? 1 : (item.priority || 1)));
                let random = seededRandom() * totalWeight;
                for (let j = 0; j < pool.length; j++) {
                    const item = pool[j];
                    const weight = (typeof item === 'string') ? 1 : (item.priority || 1);
                    random -= weight;
                    if (random <= 0) {
                        selected.push(item);
                        pool.splice(j, 1);
                        break;
                    }
                }
                if (pool.length === 0) break;
            }
            return selected;
        };

        const randomLocs = getWeightedRandom(locationsData, 2);
        randomLocs.forEach(loc => {
            const label = loc.label || loc; 
            const fullName = loc.full_name || loc; 
            const id = loc.location_id || '';
            const icon = `<svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
            const url = `https://gippslander.com.au/jobs?location=${encodeURIComponent(fullName)}&location_id=${id}`;
            tagsHTML += `<a href="${url}" class="tag">${icon}${label}</a>`;
        });

        const randomJobs = getWeightedRandom(jobsData, 2);
        randomJobs.forEach(job => {
            const label = (typeof job === 'string') ? job : job.label;
            const icon = `<svg viewBox="0 0 24 24"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/></svg>`;
            const url = `https://gippslander.com.au/jobs?q=${encodeURIComponent(label)}`;
            tagsHTML += `<a href="${url}" class="tag">${icon}${label}</a>`;
        });

        if (tagsHTML) container.innerHTML = labelHTML + tagsHTML;
    }

    // --- 6. SHARED MENU GENERATOR ---
    function buildDefaultMenu(list, input, type) {
        list.innerHTML = '';
        
        // A. RECENT SEARCHES (Only show in "job" input)
        let recent = [];
        if (type === 'job') {
            recent = getRecentSearches();
        }

        if (recent.length > 0) {
            const historyLabel = document.createElement("li");
            historyLabel.innerHTML = `<span style="font-size:0.75rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">Recent Searches</span>`;
            historyLabel.style.cursor = "default";
            historyLabel.style.background = "transparent";
            list.appendChild(historyLabel);

            recent.forEach(item => {
                const li = document.createElement("li");
                // Clock Icon + Title
                li.innerHTML = `<svg style="width:12px; height:12px; opacity:0.5; margin-right:6px;" viewBox="0 0 24 24"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg> ${item.title}`;
                li.style.color = "#333";
                li.addEventListener("click", () => {
                    // INSTANT ACTION: Go to the saved URL
                    window.location.href = item.url;
                });
                list.appendChild(li);
            });

            // Divider
            const divider = document.createElement("li");
            divider.style.height = "1px";
            divider.style.background = "#f3f4f6";
            divider.style.margin = "5px 0";
            divider.style.padding = "0";
            divider.style.cursor = "default";
            list.appendChild(divider);
        }

        // B. STATIC "ALL" OPTION
        const allLi = document.createElement("li");
        const allText = type === 'job' ? "All jobs" : "All of Gippsland";
        allLi.innerHTML = `<strong style="color:#4CAF50;">${allText}</strong>`;
        allLi.addEventListener("click", () => {
            input.value = allText; 
            if (type === 'location') {
                document.getElementById("hidden-location-id").value = ""; 
                document.getElementById("hidden-full-name").value = ""; 
            }
            list.classList.remove('active');
        });
        list.appendChild(allLi);

        // C. PRIORITY ITEMS (>= 7)
        const dataSet = type === 'job' ? jobsData : locationsData;
        const topItems = dataSet
            .filter(x => x.priority && x.priority >= 7)
            .sort((a,b) => b.priority - a.priority)
            .slice(0, 5); 

        topItems.forEach(item => {
            const li = document.createElement("li");
            li.innerHTML = item.label;
            li.addEventListener("click", () => {
                input.value = item.label;
                if (type === 'location') {
                    document.getElementById("hidden-location-id").value = item.location_id || ''; 
                    document.getElementById("hidden-full-name").value = item.full_name || item.label; 
                }
                list.classList.remove('active');
            });
            list.appendChild(li);
        });

        list.classList.add('active');
    }

    // --- 7. KEYWORD SEARCH ---
    function setupKeywordSearch() {
        const input = document.getElementById("input-keyword");
        const list = document.getElementById("list-keyword");
        if (!input) return;

        // Events: Show menu on Click or Focus
        input.addEventListener("focus", () => { if (!input.value.trim()) buildDefaultMenu(list, input, 'job'); });
        input.addEventListener("click", () => { if (!input.value.trim()) buildDefaultMenu(list, input, 'job'); });

        // Enter Key
        input.addEventListener("keypress", (e) => { if (e.key === "Enter") { list.classList.remove('active'); executeSearch(); }});

        // Typing Logic
        input.addEventListener('input', function() {
            const val = this.value.toUpperCase().trim();
            list.innerHTML = ''; 
            if (!val) { buildDefaultMenu(list, input, 'job'); return; }

            let matchCount = 0;
            for (let i = 0; i < jobsData.length; i++) {
                if (matchCount >= 6) break;
                const item = jobsData[i];
                const label = (typeof item === 'string') ? item : item.label;

                if (label && label.toUpperCase().startsWith(val)) {
                    matchCount++;
                    const li = document.createElement("li");
                    const matchPart = label.substr(0, val.length);
                    const restPart = label.substr(val.length);
                    li.innerHTML = `<strong>${matchPart}</strong>${restPart}`;
                    li.addEventListener("click", () => {
                        input.value = label;
                        list.classList.remove('active');
                    });
                    list.appendChild(li);
                }
            }
            list.classList.toggle('active', matchCount > 0);
        });
        
        document.addEventListener('click', e => { if (e.target !== input && e.target !== list) list.classList.remove('active'); });
    }

    // --- 8. LOCATION SEARCH ---
    function setupLocationSearch() {
        const input = document.getElementById("input-location");
        const list = document.getElementById("list-location");
        const hiddenId = document.getElementById("hidden-location-id");
        const hiddenFull = document.getElementById("hidden-full-name");
        if (!input) return;

        // Events
        input.addEventListener("focus", () => { if (!input.value.trim()) buildDefaultMenu(list, input, 'location'); });
        input.addEventListener("click", () => { if (!input.value.trim()) buildDefaultMenu(list, input, 'location'); });

        // Enter Key
        input.addEventListener("keypress", (e) => { if (e.key === "Enter") { list.classList.remove('active'); executeSearch(); }});

        // Typing Logic
        input.addEventListener('input', function() {
            hiddenId.value = ''; hiddenFull.value = '';
            const val = this.value.toUpperCase().trim();
            list.innerHTML = ''; 
            if (!val) { buildDefaultMenu(list, input, 'location'); return; }

            let matchCount = 0;
            for (let i = 0; i < locationsData.length; i++) {
                if (matchCount >= 8) break;
                const item = locationsData[i];
                const label = item.label ? item.label.toUpperCase() : "";
                const postcode = item.postcode ? item.postcode.toString() : "";

                if (label.startsWith(val) || postcode.startsWith(val)) {
                    matchCount++;
                    const li = document.createElement("li");
                    if (postcode.startsWith(val)) {
                         li.innerHTML = `${item.label} (<strong>${item.postcode}</strong>)`;
                    } else {
                         const displayLabel = item.label;
                         const matchPart = displayLabel.substr(0, val.length);
                         const restPart = displayLabel.substr(val.length);
                         const postcodeDisplay = item.postcode ? `(${item.postcode})` : '';
                         li.innerHTML = `<strong>${matchPart}</strong>${restPart} ${postcodeDisplay}`;
                    }
                    li.addEventListener("click", function() {
                        input.value = item.label;          
                        hiddenId.value = item.location_id || ''; 
                        hiddenFull.value = item.full_name || item.label; 
                        list.classList.remove('active');
                    });
                    list.appendChild(li);
                }
            }
            list.classList.toggle('active', matchCount > 0);
        });
        
        document.addEventListener('click', e => { if (e.target !== input && e.target !== list) list.classList.remove('active'); });
    }

    // --- 9. EXECUTE SEARCH ---
    // Exposed to window so the button can call it
    window.executeSearch = function() {
        let keyword = document.getElementById('input-keyword').value;
        let locationName = document.getElementById('hidden-full-name').value;
        let locationId = document.getElementById('hidden-location-id').value;
        const typedLocation = document.getElementById('input-location').value.trim();

        // 1. Handle "All jobs" -> Treat as empty string
        if (keyword === "All jobs") {
            keyword = "";
        }

        // 2. Handle "All of Gippsland" -> Treat as empty location
        if (typedLocation === "All of Gippsland") {
            locationName = "";
            locationId = "";
        }
        // 3. Strict Logic: If ID is missing, check for valid text match
        else if (!locationId && typedLocation) {
            const match = locationsData.find(loc => 
                (loc.label && loc.label.toLowerCase() === typedLocation.toLowerCase()) || 
                (loc.postcode && loc.postcode.toString() === typedLocation)
            );

            if (match) {
                locationName = match.full_name || match.label;
                locationId = match.location_id;
            } else {
                locationName = ""; 
                locationId = "";
            }
        }

        const params = new URLSearchParams();
        if (keyword) params.append('q', keyword);
        if (locationName) params.append('location', locationName);
        if (locationId) params.append('location_id', locationId);

        window.location.href = 'https://gippslander.com.au/jobs?' + params.toString();
    }

    loadData();
})();
