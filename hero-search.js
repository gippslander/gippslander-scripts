
// --- 1. CONFIGURATION ---
    const cacheBuster = new Date().getTime(); 
    const DATA_URLS = {
        // JOBS: Raw (Instant updates)
        jobs: `https://raw.githubusercontent.com/gippslander/assets/main/jobs.json?v=${cacheBuster}`,
        
        // LOCATIONS: Switched BACK to Raw for now (Bypasses CDN cache delay)
        locations: `https://raw.githubusercontent.com/gippslander/assets/main/locations.json?v=${cacheBuster}`
    };

    // --- 2. FALLBACK DATA ---
    const FALLBACK_DATA = {
        jobs: [ { "label": "Nurse", "priority": 10 }, { "label": "Retail", "priority": 5 }, { "label": "Chef", "priority": 5 } ],
        locations: [ { "label": "Inverloch", "postcode": "3996", "full_name": "Inverloch, Victoria, Australia", "location_id": "7272827", "priority": 10 }, { "label": "Moe", "postcode": "3825", "full_name": "Moe, Victoria, Australia", "location_id": "882291", "priority": 8 } ]
    };

    let jobsData = [];
    let locationsData = [];

    // --- 3. LOAD DATA ---
    async function loadData() {
        try {
            const [jobsResponse, locationsResponse] = await Promise.all([
                fetch(DATA_URLS.jobs),
                fetch(DATA_URLS.locations)
            ]);

            if (!jobsResponse.ok || !locationsResponse.ok) throw new Error("Fetch failed");

            jobsData = await jobsResponse.json();
            locationsData = await locationsResponse.json();

        } catch (error) {
            jobsData = FALLBACK_DATA.jobs;
            locationsData = FALLBACK_DATA.locations;
        }

        setupKeywordSearch();
        setupLocationSearch();
        renderDynamicTags();
    }

    // --- 4. TAG RENDERER (Daily Seeded) ---
    function renderDynamicTags() {
        const container = document.getElementById('tags-container');
        if (!container) return;

        const labelHTML = '<span class="tag-label">Trending:</span>';
        let tagsHTML = '';

        // Daily Seed: Same tags for 24 hours for consistency
        const date = new Date();
        let dailySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

        const seededRandom = () => {
            var x = Math.sin(dailySeed++) * 10000;
            return x - Math.floor(x);
        };

        const getWeightedRandom = (arr, count) => {
            const pool = arr.filter(item => {
                if (typeof item === 'string') return true; 
                return item.priority && item.priority > 0;
            });
            if (pool.length === 0) return [];
            
            const selected = [];
            for (let i = 0; i < count; i++) {
                let totalWeight = 0;
                pool.forEach(item => totalWeight += (typeof item === 'string' ? 1 : (item.priority || 1)));
                
                let random = seededRandom() * totalWeight; // Uses Daily Seed
                
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

    // --- 5. SEARCH LOGIC (Enter Key + Loose Matching) ---
    function setupKeywordSearch() {
        const input = document.getElementById("input-keyword");
        const list = document.getElementById("list-keyword");
        if (!input) return;

        // Enter Key Listener
        input.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                list.classList.remove('active');
                executeSearch();
            }
        });

        input.addEventListener('input', function() {
            const val = this.value.toUpperCase().trim();
            list.innerHTML = ''; 
            if (!val) { list.classList.remove('active'); return; }

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
        document.addEventListener('click', e => { if (e.target !== input) list.classList.remove('active'); });
    }

    // --- 6. LOCATION LOGIC (Enter Key + Strict Matching) ---
    function setupLocationSearch() {
        const input = document.getElementById("input-location");
        const list = document.getElementById("list-location");
        const hiddenId = document.getElementById("hidden-location-id");
        const hiddenFull = document.getElementById("hidden-full-name");
        if (!input) return;

        // Enter Key Listener
        input.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                list.classList.remove('active');
                executeSearch();
            }
        });

        input.addEventListener('input', function() {
            hiddenId.value = ''; // Auto-clear ID on type
            hiddenFull.value = '';

            const val = this.value.toUpperCase().trim();
            list.innerHTML = ''; 
            if (!val) { list.classList.remove('active'); return; }

            let matchCount = 0;
            for (let i = 0; i < locationsData.length; i++) {
                if (matchCount >= 8) break;
                const item = locationsData[i];
                const label = item.label ? item.label.toUpperCase() : (typeof item === 'string' ? item.toUpperCase() : "");
                const postcode = item.postcode ? item.postcode.toString() : "";

                if (label.startsWith(val) || postcode.startsWith(val)) {
                    matchCount++;
                    const li = document.createElement("li");
                    if (postcode.startsWith(val)) {
                         li.innerHTML = `${item.label || item} (<strong>${item.postcode || ''}</strong>)`;
                    } else {
                         const displayLabel = item.label || item;
                         const matchPart = displayLabel.substr(0, val.length);
                         const restPart = displayLabel.substr(val.length);
                         const postcodeDisplay = item.postcode ? `(${item.postcode})` : '';
                         li.innerHTML = `<strong>${matchPart}</strong>${restPart} ${postcodeDisplay}`;
                    }
                    li.addEventListener("click", function() {
                        input.value = item.label || item;          
                        hiddenId.value = item.location_id || ''; 
                        hiddenFull.value = item.full_name || item; 
                        list.classList.remove('active');
                    });
                    list.appendChild(li);
                }
            }
            list.classList.toggle('active', matchCount > 0);
        });
        document.addEventListener('click', e => { if (e.target !== input) list.classList.remove('active'); });
    }

    // --- 7. EXECUTE SEARCH (Strict Mode) ---
    function executeSearch() {
        const keyword = document.getElementById('input-keyword').value;
        let locationName = document.getElementById('hidden-full-name').value;
        let locationId = document.getElementById('hidden-location-id').value;
        const typedLocation = document.getElementById('input-location').value.trim();

        // Strict Logic: If ID is missing, check for valid text match. If none, ignore (Blank).
        if (!locationId && typedLocation) {
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
