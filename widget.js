/* Gippslander Job Widget 
   v3.3 (Max z-index, isolated title, dynamic UTM tracking)
*/
(function() {
    var config = window.GippslanderConfig || {};
    var TOWNS = config.towns || "Inverloch,Wonthaggi";
    var COLOR = config.accentColor || "#4CAF50";
    var SELECTOR = config.containerId || "gippslander-job-board";
    var PROXY_URL = "https://gippsland-jobs-proxy.vercel.app/api/jobs?towns=" + encodeURIComponent(TOWNS);

    // DYNAMIC UTM GENERATION
    // Grabs the host website's domain so you know exactly who sent the traffic
    var hostName = window.location.hostname || "unknown_widget_host";
    var baseUtm = "?utm_source=" + encodeURIComponent(hostName) + "&utm_medium=embedded_widget&utm_campaign=gippslander_widget";

    // Job Type ID Mapping
    var JOB_TYPES = {
        27006: "Full Time",
        27007: "Casual",
        27008: "Casual",
        36600: "Volunteer"
    };

    var style = document.createElement('style');
    style.innerHTML = `
        #gp-board { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #333; }
        .gp-header { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .gp-search-box { flex-grow: 1; position: relative; }
        .gp-search-input { width: 100%; padding: 12px 15px; padding-left: 40px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; outline: none; transition: border 0.2s; }
        .gp-search-input:focus { border-color: ${COLOR}; }
        .gp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; display: flex; align-items: center; justify-content: center; }
        .gp-post-btn { background-color: ${COLOR}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; white-space: nowrap; transition: opacity 0.2s; display: inline-block; text-align: center; border: none; cursor: pointer; }
        .gp-post-btn:hover { opacity: 0.9; }
        
        /* Job List & Cards */
        .gp-job-list { display: flex; flex-direction: column; gap: 10px; min-height: 200px; }
        .gp-job-card { display: flex; align-items: center; background: white; border: 1px solid #e1e4e8; border-radius: 12px; padding: 15px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; position: relative; }
        .gp-job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: ${COLOR}; }
        .gp-job-card.is-featured { border-left: 4px solid ${COLOR}; background: #f9fff9; }
        
        .gp-featured-tag { position: absolute; top: 0; right: 100px; background: ${COLOR}; color: white; font-size: 10px; padding: 2px 8px; border-radius: 0 0 6px 6px; font-weight: bold; text-transform: uppercase; }

        .gp-logo-box { width: 50px; height: 50px; border-radius: 8px; overflow: hidden; flex-shrink: 0; margin-right: 15px; background: #f9f9f9; display: flex; align-items: center; justify-content: center; border: 1px solid #eee; }
        .gp-logo-img { width: 100%; height: 100%; object-fit: contain; }
        .gp-job-details { flex-grow: 1; min-width: 0; }
        .gp-job-title { font-size: 18px; font-weight: 700; color: #333; margin: 0 0 4px 0; }
        
        /* Formatted Metadata Section */
        .gp-job-meta { font-size: 13px; color: #666; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 6px; }
        .gp-meta-item { display: flex; align-items: center; white-space: nowrap; }
        .gp-meta-comp { font-weight: 600; color: #2e7d32; background: #e8f5e9; padding: 3px 8px; border-radius: 6px; }
        .gp-meta-divider { color: #ddd; }
        
        /* Unified Job Badge */
        .gp-job-badge { font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; white-space: nowrap; margin-left: 10px; background-color: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
        
        .gp-job-arrow { margin-left: 15px; color: #ccc; font-size: 18px; transition: all 0.2s ease; }
        .gp-job-card:hover .gp-job-arrow { color: ${COLOR}; transform: translateX(5px); }

        /* Skeleton Loaders */
        @keyframes gpShimmer {
            0% { background-position: -468px 0; }
            100% { background-position: 468px 0; }
        }
        .gp-skeleton {
            background: #f6f7f8;
            background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
            background-repeat: no-repeat;
            background-size: 800px 100%;
            animation: gpShimmer 1.5s infinite linear forwards;
        }

        /* Load More Section */
        #gp-load-more-container { margin: 30px 0; }
        .gp-load-more-btn { background-color: transparent; color: ${COLOR}; padding: 12px 30px; border: 2px solid ${COLOR}; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 15px; display: inline-block; }
        .gp-load-more-btn:hover { background-color: ${COLOR}; color: white; }

        /* Footer */
        .gp-footer { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 25px; width: 100%; display: block; clear: both; }
        .gp-footer p { font-size: 14px; color: #333; margin-bottom: 15px; display: block; }
        .gp-footer img { height: 32px; display: inline-block; }
        
        /* Modal Styles */
        .gp-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2147483647; backdrop-filter: blur(2px); }
        .gp-modal-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; width: 90%; max-width: 700px; max-height: 90vh; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.3); overflow: hidden; }
        .gp-modal-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: white; z-index: 2; }
        .gp-modal-scroll { padding: 25px; overflow-y: auto; line-height: 1.6; color: #333; flex-grow: 1; }
        
        /* Sticky Modal Footer */
        .gp-modal-footer { padding: 20px; border-top: 1px solid #eee; background: #fafafa; text-align: right; position: sticky; bottom: 0; z-index: 2; box-shadow: 0 -4px 10px rgba(0,0,0,0.05); }
        
        .gp-apply-btn { background-color: ${COLOR}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; transition: opacity 0.2s; }
        .gp-apply-btn:hover { opacity: 0.9; }
        .gp-perks-container { display: flex; flex-wrap: wrap; gap: 6px; margin: 15px 0; }
        .gp-perk-tag { background: #e8f5e9; color: #2e7d32; font-size: 12px; padding: 4px 10px; border-radius: 4px; font-weight: 600; }

        /* Responsive Mobile Layout */
        @media (max-width: 600px) { 
            .gp-job-arrow, .gp-featured-tag { display: none; } 
            .gp-job-badge { margin-top: 12px; margin-left: 0; align-self: flex-start; }
            .gp-job-card { flex-direction: column; align-items: flex-start; }
            .gp-logo-box { margin-bottom: 12px; }
        }
    `;
    document.head.appendChild(style);

    var targetElement = document.getElementById(SELECTOR);
    if (!targetElement) return;

    // Build the skeleton cards HTML 
    var skeletonCardHTML = `
        <div class="gp-job-card" style="pointer-events: none; border-color: #f3f4f6;">
            <div class="gp-logo-box gp-skeleton" style="border:none;"></div>
            <div class="gp-job-details">
                <div class="gp-skeleton" style="height: 18px; width: 50%; margin-bottom: 8px; border-radius: 4px;"></div>
                <div class="gp-skeleton" style="height: 14px; width: 80%; border-radius: 4px;"></div>
            </div>
            <div class="gp-skeleton" style="width: 70px; height: 24px; border-radius: 20px; margin-left: 10px;"></div>
        </div>
    `;
    var skeletons = [1, 2, 3, 4].map(() => skeletonCardHTML).join('');
    
    // INJECT UTMs into the "Post a Job" and "Powered by" links below
    targetElement.innerHTML = `
        <div id="gp-board">
            <div class="gp-header">
                <div class="gp-search-box">
                    <span class="gp-search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                    <input type="text" id="gp-search" class="gp-search-input" placeholder="Search jobs..." aria-label="Search jobs">
                </div>
                <a href="https://gippslander.com.au/pricing${baseUtm}" target="_blank" class="gp-post-btn">+ Post a Job</a>
            </div>
            <div id="gp-list-container" class="gp-job-list">${skeletons}</div>
            <div id="gp-load-more-container" style="display: none; text-align: center;"><button id="gp-load-more-btn" class="gp-load-more-btn">Load More Jobs</button></div>
            <div class="gp-footer">
                <p>Powered by</p>
                <a href="https://gippslander.com.au${baseUtm}" target="_blank">
                    <img src="https://d3535lqr6sqxto.cloudfront.net/logos/rEkuQybTnVw95OUPNTLLVxtGB7t4BbAVgbRJTndj.png" alt="Gippslander">
                </a>
            </div>
        </div>
        <div id="gp-modal" class="gp-modal-overlay">
            <div class="gp-modal-container">
                <div class="gp-modal-header">
                    <div id="gp-modal-title" style="margin:0; font-size: 22px; font-weight: bold; line-height: 1.2; color: #333;">Job Details</div>
                    <button id="gp-close-btn" class="gp-close-btn" aria-label="Close Modal" style="background:none; border:none; outline:none; font-size:28px; cursor:pointer; color: #333;">&times;</button>
                </div>
                <div id="gp-modal-body" class="gp-modal-scroll"></div>
                <div class="gp-modal-footer"><a href="#" id="gp-modal-apply" target="_blank" class="gp-apply-btn">Apply on Gippslander</a></div>
            </div>
        </div>
    `;

    // Security: Basic HTML Escaper for text injected into the DOM
    function escapeHTML(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Helper: Safely add UTM parameters to dynamic URLs that might already have query strings (?)
    function appendUtmToUrl(urlStr) {
        if (!urlStr || urlStr === '#') return '#';
        try {
            var separator = urlStr.indexOf('?') !== -1 ? '&' : '?';
            return urlStr + separator + "utm_source=" + encodeURIComponent(hostName) + "&utm_medium=embedded_widget&utm_campaign=gippslander_widget";
        } catch(e) {
            return urlStr;
        }
    }

    // Performance: Search Debouncer
    function debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => { func.apply(this, args); }, delay);
        };
    }

    function timeAgo(dateString) {
        var diffDays = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return "Today";
        return diffDays + "d ago";
    }

    // Compensation Formatting Logic
    function formatComp(j) {
        if (!j.min_compensation && !j.max_compensation) return '';
        var sym = (j.compensation_currency || 'aud').toLowerCase() === 'aud' ? '$' : (j.compensation_currency + ' ').toUpperCase();
        var min = j.min_compensation ? sym + j.min_compensation.toLocaleString() : '';
        var max = j.max_compensation ? sym + j.max_compensation.toLocaleString() : '';
        var range = min && max ? min + ' - ' + max : (min || max);
        
        var tfMap = { 'annually': '/yr', 'hourly': '/hr', 'monthly': '/mo', 'weekly': '/wk' };
        var tf = tfMap[j.compensation_time_frame] || '';
        
        return '<span class="gp-meta-comp">' + range + tf + '</span>';
    }

    var allJobs = [];
    var currentJobsList = []; 
    var displayLimit = 15;    
    
    function render(jobs) {
        currentJobsList = jobs; 
        var list = document.getElementById('gp-list-container');
        var loadMoreContainer = document.getElementById('gp-load-more-container');
        
        // Better UX: Search Empty State
        if (!jobs.length) { 
            list.innerHTML = `
                <div style='text-align:center; padding:40px 20px;'>
                    <p style='color:#666; margin-bottom:15px; font-size:16px;'>We couldn't find any jobs matching your search.</p>
                    <button onclick="document.getElementById('gp-search').value=''; document.getElementById('gp-search').dispatchEvent(new Event('input'));" class="gp-load-more-btn">Clear Search</button>
                </div>`; 
            loadMoreContainer.style.display = 'none';
            return; 
        }

        list.innerHTML = jobs.slice(0, displayLimit).map(function(j) {
            var isFeatured = j.featured ? 'is-featured' : '';
            var featTag = j.featured ? '<div class="gp-featured-tag">Featured</div>' : '';
            
            var badgeText = escapeHTML(JOB_TYPES[j.job_type_id] || j.job_type || 'Full Time');
            var compText = formatComp(j);

            var safeTitle = escapeHTML(j.title);
            var safeEmployer = escapeHTML(j.employer?.name || '');
            var safeLocation = escapeHTML(j.location);
            var safeLogo = escapeHTML(j.employer?.logo || '');

            return `<div class="gp-job-card ${isFeatured}" data-id="${j.id}">
                ${featTag}
                <div class="gp-logo-box"><img src="${safeLogo}" class="gp-logo-img" onerror="this.style.display='none'; this.parentElement.innerText='?'"></div>
                <div class="gp-job-details">
                    <div class="gp-job-title">${safeTitle}</div>
                    
                    <div class="gp-job-meta">
                        <span class="gp-meta-item">${safeEmployer}</span>
                        <span class="gp-meta-divider">|</span>
                        <span class="gp-meta-item">${safeLocation}</span>
                        <span class="gp-meta-divider">|</span>
                        <span class="gp-meta-item">${timeAgo(j.posted_at)}</span>
                        ${compText ? `<span class="gp-meta-item">${compText}</span>` : ''}
                    </div>

                </div>
                <div class="gp-job-badge">${badgeText}</div>
                <div class="gp-job-arrow">&rarr;</div>
            </div>`;
        }).join('');
        
        loadMoreContainer.style.display = jobs.length > displayLimit ? 'block' : 'none';
    }

    document.getElementById('gp-load-more-btn').addEventListener('click', function() { displayLimit += 15; render(currentJobsList); });

    // MODAL LOGIC & ESCAPE KEY
    var modal = document.getElementById('gp-modal');
    var closeBtn = document.getElementById('gp-close-btn');
    
    function closeModal() { 
        modal.style.display = 'none'; 
        document.body.style.overflow = 'auto'; 
    }
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function(e) { if(e.target === modal) closeModal(); });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') closeModal();
    });

    document.getElementById('gp-list-container').addEventListener('click', function(e) {
        var card = e.target.closest('.gp-job-card');
        if (card) {
            var job = allJobs.find(function(j) { return j.id == card.dataset.id; });
            if (job) {
                var perks = job.custom_fields?.["146383"]?.selected_options || [];
                var perksHtml = perks.length ? `<div class="gp-perks-container">${perks.map(p => `<span class="gp-perk-tag">${escapeHTML(p.option)}</span>`).join('')}</div>` : '';
                
                var safeTitle = escapeHTML(job.title);
                var safeEmployer = escapeHTML(job.employer?.name || '');
                var safeCategory = escapeHTML(job.category?.name || '');
                var safeLocation = escapeHTML(job.location);
                var compText = formatComp(job);

                document.getElementById('gp-modal-title').innerText = safeTitle;
                
                document.getElementById('gp-modal-body').innerHTML = `
                    <strong>${safeEmployer}</strong> | ${safeCategory}<br>
                    
                    <div class="gp-job-meta" style="margin-bottom:15px;">
                        <span class="gp-meta-item">${safeLocation}</span>
                        ${compText ? `<span class="gp-meta-item">${compText}</span>` : ''}
                    </div>
                    
                    ${perksHtml}
                    <div style="margin-top:20px;">${job.description}</div>
                `;
                
                // INJECT UTMs to the specific Job Details Application link
                document.getElementById('gp-modal-apply').href = escapeHTML(appendUtmToUrl(job.job_details_url));
                
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                
                // Accessibility: Shift focus to modal so keyboard users know it opened
                closeBtn.focus();
            }
        }
    });

    // Debounced Search Input 
    document.getElementById('gp-search').addEventListener('input', debounce(function(e) {
        var term = e.target.value.toLowerCase();
        displayLimit = 15;
        render(allJobs.filter(j => j.title.toLowerCase().includes(term) || j.employer?.name?.toLowerCase().includes(term)));
    }, 250)); // Waits 250ms after typing stops

    fetch(PROXY_URL).then(res => res.json()).then(data => {
        allJobs = (Array.isArray(data) ? data : []).sort((a, b) => {
            if (a.featured !== b.featured) return b.featured - a.featured;
            return new Date(b.posted_at) - new Date(a.posted_at);
        });
        render(allJobs);
    }).catch(() => { document.getElementById('gp-list-container').innerHTML = "<p style='text-align:center; padding:20px;'>Unable to load jobs.</p>"; });
})();
