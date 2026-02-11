
(function() {
    // --- 1. CONFIGURATION ---
    const cacheBuster = new Date().getTime(); 
    
    const DATA_URLS = {
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
            return JSON.parse(raw).slice(0, 3);
        } catch (e) { return []; }
    }

    // --- 4. LOAD DATA ---
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
        
        // --- A. RECENT SEARCHES (Jobs Only) ---
        if (type === 'job') {
            let recent = getRecentSearches();
            if (recent.length > 0) {
                const historyLabel = document.createElement("li");
                historyLabel.innerHTML = `<span style="font-size:0.75rem; color:#9ca3af; text-transform:uppercase; letter-spacing:0.05em; font-weight:700;">Recent Searches</span>`;
                historyLabel.style.cursor = "default";
                historyLabel.style.background = "transparent";
                list.appendChild(historyLabel);

                recent.forEach(item => {
                    const li = document.createElement("li");
                    li.innerHTML = `<svg style="width:12px; height:12px; opacity:0.5; margin-right:6px;" viewBox="0 0 24 24"><path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg> ${item.title}`;
                    li.style.color = "#333";
                    li.addEventListener("click", () => { window.location.href = item.url; });
                    list.appendChild(li);
                });
                const divider = document.createElement("li");
                divider.style.height = "1px"; divider.style.background = "#f3f4f6"; divider.style.margin = "5px 0"; divider.style.padding = "0"; divider.style.cursor = "default";
                list.appendChild(divider);
            }
        }

        // --- B. LOCATION SPECIFIC OPTIONS ---
        if (type === 'location') {
            // 1. Current Location Option
            const currentLi = document.createElement("li");
            const targetIcon = `<svg style="width:18px; height:18px; fill:#4CAF50; vertical-align:middle; margin-right:10px;" viewBox="0 0 24 24"><path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></svg>`;
            currentLi.innerHTML = `<span style="display:flex; align-items:center;"><strong style="color:#4CAF50;">${targetIcon}Current Location</strong></span>`;
            
            currentLi.addEventListener("click", () => {
                resolveCurrentLocation(input, list);
            });
            list.appendChild(currentLi);
        }

        // 2. All Options
        const allLi = document.createElement("li");
        const allText = type === 'job' ? "All jobs" : "All of Gippsland";
        let iconHtml = "";
        if (type === 'location') {
            iconHtml = `<svg style="width:18px; height:18px; fill:#4CAF50; vertical-align:middle; margin-right:10px;" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>`;
        }
        
        allLi.innerHTML = `<span style="display:flex; align-items:center;"><strong style="color:#4CAF50;">${iconHtml}${allText}</strong></span>`;
        allLi.addEventListener("click", () => {
            input.value = allText; 
            if (type === 'location') {
                document.getElementById("hidden-location-id").value = ""; 
                document.getElementById("hidden-full-name").value = ""; 
            }
            list.classList.remove('active');
        });
        list.appendChild(allLi);

        // --- C. PRIORITY ITEMS ---
        const dataSet = type === 'job' ? jobsData : locationsData;
        const topItems = dataSet
            .filter(x => x.priority && x.priority >= 7)
            .sort((a,b) => b.priority - a.priority)
            .slice(0, 5); 

        topItems.forEach(item => {
            const li = document.createElement("li");
            const pin = type === 'location' ? `<svg style="width:16px; height:16px; opacity:0.4; margin-right:8px; vertical-align:middle;" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>` : '';
            
            li.innerHTML = `<span style="display:flex; align-items:center;">${pin}${item.label}</span>`;
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

        input.addEventListener("focus", () => { if (!input.value.trim()) buildDefaultMenu(list, input, 'job'); });
        input.addEventListener("click", () => { if (!input.value.trim()) buildDefaultMenu(list, input, 'job'); });
        input.addEventListener("keypress", (e) => { if (e.key === "Enter") { list.classList.remove('active'); executeSearch(); }});

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

        input.addEventListener("focus", () => { if (!input.value.trim()) buildDefaultMenu(list, input, 'location'); });
        input.addEventListener("click", () => { if (!input.value.trim()) buildDefaultMenu(list, input, 'location'); });
        input.addEventListener("keypress", (e) => { if (e.key === "Enter") { list.classList.remove('active'); executeSearch(); }});

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
    window.executeSearch = function() {
        let keyword = document.getElementById('input-keyword').value;
        let locationName = document.getElementById('hidden-full-name').value;
        let locationId = document.getElementById('hidden-location-id').value;
        const typedLocation = document.getElementById('input-location').value.trim();

        if (keyword === "All jobs") keyword = "";
        
        // Handle explicit "All" or "Locating..." states
        if (typedLocation === "All of Gippsland" || typedLocation === "Locating...") {
            locationName = ""; 
            locationId = "";
        }
        else if (!locationId && typedLocation) {
            const match = locationsData.find(loc => 
                (loc.label && loc.label.toLowerCase() === typedLocation.toLowerCase()) || 
                (loc.postcode && loc.postcode.toString() === typedLocation)
            );
            if (match) {
                locationName = match.full_name || match.label;
                locationId = match.location_id;
            } else {
                locationName = ""; locationId = "";
            }
        }

        const params = new URLSearchParams();
        if (keyword) params.append('q', keyword);
        if (locationName) params.append('location', locationName);
        if (locationId) params.append('location_id', locationId);

        window.location.href = 'https://gippslander.com.au/jobs?' + params.toString();
    }

    // --- 10. GEOLOCATION HELPER (RETRY STRATEGY) ---
    function resolveCurrentLocation(input, list) {
        const MAX_DISTANCE_KM = 50;
        
        if (!navigator.geolocation) {
            fallbackToAll(input);
            return;
        }
        
        input.value = "Locating...";
        
        // Internal helper to run the request
        function runGeo(isRetry) {
            const options = {
                // Attempt 1: Low Accuracy (Fast, cache ok). Attempt 2: High Accuracy (Force GPS).
                enableHighAccuracy: isRetry, 
                // Attempt 1: 4s timeout. Attempt 2: 10s timeout.
                timeout: isRetry ? 10000 : 4000, 
                maximumAge: isRetry ? 0 : 600000 
            };
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    if (input.value !== "Locating...") return;

                    const userLat = position.coords.latitude;
                    const userLon = position.coords.longitude;
                    
                    let nearest = null;
                    let minDist = Infinity;

                    for (let i = 0; i < locationsData.length; i++) {
                        const loc = locationsData[i];
                        if (loc.lat && loc.lon) {
                            const d = getDistanceFromLatLonInKm(userLat, userLon, loc.lat, loc.lon);
                            if (d < minDist) {
                                minDist = d;
                                nearest = loc;
                            }
                        }
                    }

                    if (nearest && minDist <= MAX_DISTANCE_KM) {
                        input.value = nearest.label; 
                        document.getElementById("hidden-location-id").value = nearest.location_id || '';
                        document.getElementById("hidden-full-name").value = nearest.full_name || nearest.label;
                    } else {
                        fallbackToAll(input);
                    }
                    list.classList.remove('active');
                },
                (error) => {
                    console.warn(`Geo Attempt ${isRetry ? 2 : 1} failed:`, error);
                    
                    // If first attempt failed AND it wasn't because user clicked "Block" (Code 1)
                    if (!isRetry && error.code !== 1) {
                         console.log("Retrying with High Accuracy...");
                         runGeo(true); // Recursive retry
                    } else {
                         if (input.value === "Locating...") fallbackToAll(input);
                         list.classList.remove('active');
                    }
                },
                options
            );
        }
        
        // Start Attempt 1
        runGeo(false);
    }

    // Helper: Sets "All of Gippsland" if geolocation fails/denied
    function fallbackToAll(input) {
        input.value = "All of Gippsland";
        document.getElementById("hidden-location-id").value = ""; 
        document.getElementById("hidden-full-name").value = ""; 
    }

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        const R = 6371; 
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; 
    }

    function deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    loadData();
})();
