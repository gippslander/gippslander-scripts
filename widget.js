/* Gippslander Job Widget 
   v 2.0.0
*/
(function() {
    var config = window.GippslanderConfig || {};
    var TOWNS = config.towns || "Inverloch,Wonthaggi";
    var COLOR = config.accentColor || "#4CAF50";
    var SELECTOR = config.containerId || "gippslander-job-board";
    var PROXY_URL = "https://gippsland-jobs-proxy.vercel.app/api/jobs?towns=" + encodeURIComponent(TOWNS);

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
        
        /* Job List & Cards (Updated Design) */
        .gp-job-list { display: flex; flex-direction: column; gap: 15px; min-height: 200px; }
        .gp-job-card { display: flex; align-items: flex-start; gap: 15px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s; position: relative; }
        .gp-job-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.06); border-color: #d1d5db; }
        
        /* Featured Styling */
        .gp-job-card.is-featured { border: 1px solid ${COLOR}; background: #fafffa; }
        .gp-pin-icon { color: #fbbf24; flex-shrink: 0; }

        /* Logo & Content Layout */
        .gp-logo-box { width: 56px; height: 56px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: #fff; display: flex; align-items: center; justify-content: center; border: 1px solid #f3f4f6; padding: 4px; box-sizing: border-box; }
        .gp-logo-img { width: 100%; height: 100%; object-fit: contain; border-radius: 50%; }
        
        .gp-job-details { flex-grow: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
        
        /* Header: Title & Pin */
        .gp-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .gp-job-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0; line-height: 1.3; }
        
        /* Meta row (Company • Type • Location) */
        .gp-job-meta { font-size: 14px; color: #4b5563; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
        .gp-meta-divider { color: #9ca3af; }
        
        /* Tags (Pills) */
        .gp-job-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .gp-job-tag { background-color: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 100px; font-size: 12px; font-weight: 500; }
        
        /* Description Snippet */
        .gp-job-snippet { font-size: 14px; color: #6b7280; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        
        /* Footer (Easy Apply & Time) */
        .gp-card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-top: 4px; }
        .gp-easy-apply { color: ${COLOR}; display: flex; align-items: center; gap: 6px; font-weight: 500; }
        .gp-time-ago { color: #6b7280; display: flex; align-items: center; gap: 4px; }

        /* Skeleton Loaders (Updated to match layout) */
        @keyframes gpShimmer { 0% { background-position: -468px 0; } 100% { background-position: 468px 0; } }
        .gp-skeleton { background: #f6f7f8; background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%); background-repeat: no-repeat; background-size: 800px 100%; animation: gpShimmer 1.5s infinite linear forwards; }

        /* Load More Section */
        #gp-load-more-container { margin: 30px 0; }
        .gp-load-more-btn { background-color: transparent; color: ${COLOR}; padding: 12px 30px; border: 2px solid ${COLOR}; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 15px; display: inline-block; }
        .gp-load-more-btn:hover { background-color: ${COLOR}; color: white; }

        /* Footer */
        .gp-footer { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 25px; width: 100%; display: block; clear: both; }
        .gp-footer p { font-size: 14px; color: #333; margin-bottom: 15px; display: block; }
        .gp-footer img { height: 32px; display: inline-block; }
        
        /* Modal Styles */
        .gp-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 2147483647 !important; backdrop-filter: blur(2px); }
        .gp-modal-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; width: 90%; max-width: 700px; max-height: 90vh; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.3); overflow: hidden; }
        .gp-modal-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: white; z-index: 2; }
        .gp-modal-scroll { padding: 25px; overflow-y: auto; line-height: 1.6; color: #333; flex-grow: 1; }
        .gp-modal-footer { padding: 20px; border-top: 1px solid #eee; background: #fafafa; text-align: right; position: sticky; bottom: 0; z-index: 2; box-shadow: 0 -4px 10px rgba(0,0,0,0.05); }
        
        /* Aggressive fix for the close button border */
        .gp-close-btn { background: transparent !important; border: none !important; outline: none !important; box-shadow: none !important; font-size: 28px; cursor: pointer; padding: 0; line-height: 1; color: #333; }
        .gp-close-btn:hover { color: #000; }
        
        .gp-apply-btn { background-color: ${COLOR}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; transition: opacity 0.2s; }
        .gp-apply-btn:hover { opacity: 0.9; }

        @media (max-width: 600px) { 
            .gp-job-card { flex-direction: column; align-items: flex-start; }
            .gp-logo-box { width: 48px; height: 48px; }
        }
    `;
    document.head.appendChild(style);

    var targetElement = document.getElementById(SELECTOR);
    if (!targetElement) return;

    // Updated Skeleton Cards
    var skeletonCardHTML = `
        <div class="gp-job-card" style="pointer-events: none; border-color: #f3f4f6;">
            <div class="gp-logo-box gp-skeleton" style="border:none;"></div>
            <div class="gp-job-details">
                <div class="gp-skeleton" style="height: 20px; width: 60%; border-radius: 4px;"></div>
                <div class="gp-skeleton" style="height: 14px; width: 40%; border-radius: 4px;"></div>
                <div style="display:flex; gap:8px; margin-top:4px;">
                    <div class="gp-skeleton" style="height: 24px; width: 80px; border-radius: 100px;"></div>
                    <div class="gp-skeleton" style="height: 24px; width: 100px; border-radius: 100px;"></div>
                </div>
            </div>
        </div>
    `;
    var skeletons = [1, 2, 3, 4].map(() => skeletonCardHTML).join('');
    
    targetElement.innerHTML = `
        <div id="gp-board">
            <div class="gp-header">
                <div class="gp-search-box">
                    <span class="gp-search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                    <input type="text" id="gp-search" class="gp-search-input" placeholder="Search jobs..." aria-label="Search jobs">
                </div>
                <a href="https://gippslander.com.au/pricing" target="_blank" class="gp-post-btn">+ Post a Job</a>
            </div>
            <div id="gp-list-container" class="gp-job-list">${skeletons}</div>
            <div id="gp-load-more-container" style="display: none; text-align: center;"><button id="gp-load-more-btn" class="gp-load-more-btn">Load More Jobs</button></div>
            <div class="gp-footer">
                <p>Powered by</p>
                <a href="https://gippslander.com.au" target="_blank">
                    <img src="https://d3535lqr6sqxto.cloudfront.net/logos/rEkuQybTnVw95OUPNTLLVxtGB7t4BbAVgbRJTndj.png" alt="Gippslander">
                </a>
            </div>
        </div>
        <div id="gp-modal" class="gp-modal-overlay">
            <div class="gp-modal-container">
                <div class="gp-modal-header">
                    <h3 id="gp-modal-title" style="margin:0; font-size:20px;">Job Details</h3>
                    <button id="gp-close-btn" class="gp-close-btn" aria-label="Close Modal">&times;</button>
                </div>
                <div id="gp-modal-body" class="gp-modal-scroll"></div>
                <div class="gp-modal-footer"><a href="#" id="gp-modal-apply" target="_blank" class="gp-apply-btn">Apply on Gippslander</a></div>
            </div>
        </div>
    `;

    // Security: Escaping user strings
    function escapeHTML(str) {
        if (!str) return '';
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Strips HTML from description for the preview snippet
    function stripHTML(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, ''); // Removes all HTML tags
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

    var allJobs = [];
    var currentJobsList = []; 
    var displayLimit = 15;    
    
    function render(jobs) {
        currentJobsList = jobs; 
        var list = document.getElementById('gp-list-container');
        var loadMoreContainer = document.getElementById('gp-load-more-container');
        
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
            var pinIcon = j.featured ? `<svg class="gp-pin-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/></svg>` : '';
            
            var badgeText = escapeHTML(JOB_TYPES[j.job_type_id] || j.job_type || 'Full Time');
            var safeTitle = escapeHTML(j.title);
            var safeEmployer = escapeHTML(j.employer?.name || '');
            var safeLocation = escapeHTML(j.location);
            var safeLogo = escapeHTML(j.employer?.logo || '');
            var safeCategory = escapeHTML(j.category?.name || '');
            
            // Build Snippet text (truncate at 140 chars)
            var snippetText = stripHTML(j.description);
            if(snippetText.length > 140) snippetText = snippetText.substring(0, 140) + '...';

            // Build Tags (Category + up to 2 perks)
            var tagsHtml = '';
            if (safeCategory) tagsHtml += `<span class="gp-job-tag">${safeCategory}</span>`;
            
            var perks = j.custom_fields?.["146383"]?.selected_options || [];
            perks.slice(0, 2).forEach(p => { tagsHtml += `<span class="gp-job-tag">${escapeHTML(p.option)}</span>`; });
            var tagsContainer = tagsHtml ? `<div class="gp-job-tags">${tagsHtml}</div>` : '';

            return `<div class="gp-job-card ${isFeatured}" data-id="${j.id}">
                <div class="gp-logo-box"><img src="${safeLogo}" class="gp-logo-img" onerror="this.style.display='none'; this.parentElement.innerText='?'"></div>
                
                <div class="gp-job-details">
                    <div class="gp-card-header">
                        <h4 class="gp-job-title">${safeTitle}</h4>
                        ${pinIcon}
                    </div>
                    
                    <div class="gp-job-meta">
                        <span>${safeEmployer}</span>
                        <span class="gp-meta-divider">•</span>
                        <span>${badgeText}</span>
                        <span class="gp-meta-divider">•</span>
                        <span>${safeLocation}</span>
                    </div>
                    
                    ${tagsContainer}
                    
                    <div class="gp-job-snippet">${snippetText}</div>
                    
                    <div class="gp-card-footer">
                        <span class="gp-easy-apply">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> 
                            Apply Now
                        </span>
                        <span class="gp-time-ago">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            ${timeAgo(j.posted_at)}
                        </span>
                    </div>
                </div>
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
                var safeTitle = escapeHTML(job.title);
                var safeEmployer = escapeHTML(job.employer?.name || '');
                var safeCategory = escapeHTML(job.category?.name || '');
                var safeLocation = escapeHTML(job.location);
                var badgeText = escapeHTML(JOB_TYPES[job.job_type_id] || job.job_type || 'Full Time');

                // Re-fetch tags just for the modal
                var perks = job.custom_fields?.["146383"]?.selected_options || [];
                var tagsHtml = '';
                if (safeCategory) tagsHtml += `<span class="gp-job-tag">${safeCategory}</span>`;
                perks.forEach(p => { tagsHtml += `<span class="gp-job-tag">${escapeHTML(p.option)}</span>`; });
                var tagsContainer = tagsHtml ? `<div class="gp-job-tags" style="margin-top:15px; margin-bottom:15px;">${tagsHtml}</div>` : '';

                document.getElementById('gp-modal-title').innerText = safeTitle;
                
                document.getElementById('gp-modal-body').innerHTML = `
                    <div style="font-size:15px; color:#4b5563; margin-bottom: 5px;">
                        <strong>${safeEmployer}</strong>
                    </div>
                    <div class="gp-job-meta" style="margin-bottom:15px;">
                        <span>${badgeText}</span>
                        <span class="gp-meta-divider">•</span>
                        <span>${safeLocation}</span>
                    </div>
                    
                    ${tagsContainer}
                    <hr style="border:0; border-top:1px solid #eee; margin:20px 0;">
                    <div style="margin-top:20px; color:#111827;">${job.description}</div>
                `;
                
                document.getElementById('gp-modal-apply').href = escapeHTML(job.job_details_url || '#');
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
                
                // Accessibility: Shift focus
                closeBtn.focus();
            }
        }
    });

    // Debounced Search Input 
    document.getElementById('gp-search').addEventListener('input', debounce(function(e) {
        var term = e.target.value.toLowerCase();
        displayLimit = 15;
        render(allJobs.filter(j => j.title.toLowerCase().includes(term) || j.employer?.name?.toLowerCase().includes(term)));
    }, 250));

    fetch(PROXY_URL).then(res => res.json()).then(data => {
        allJobs = (Array.isArray(data) ? data : []).sort((a, b) => {
            if (a.featured !== b.featured) return b.featured - a.featured;
            return new Date(b.posted_at) - new Date(a.posted_at);
        });
        render(allJobs);
    }).catch(() => { document.getElementById('gp-list-container').innerHTML = "<p style='text-align:center; padding:20px;'>Unable to load jobs.</p>"; });
})();
