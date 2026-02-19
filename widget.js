/* Gippslander Job Widget 
*/
(function() {
    var config = window.GippslanderConfig || {};
    var TOWNS = config.towns || "Inverloch,Wonthaggi";
    var COLOR = config.accentColor || "#4CAF50";
    var SELECTOR = config.containerId || "gippslander-job-board";
    var PROXY_URL = "https://gippsland-jobs-proxy.vercel.app/api/jobs?towns=" + encodeURIComponent(TOWNS);

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
        .gp-job-company { font-size: 14px; color: #666; }
        .gp-job-badge { background: #f0f0f0; color: #333; font-size: 12px; font-weight: 600; padding: 4px 12px; border-radius: 20px; white-space: nowrap; margin-left: 10px; }
        .gp-job-arrow { margin-left: 15px; color: #ccc; font-size: 18px; transition: all 0.2s ease; }
        .gp-job-card:hover .gp-job-arrow { color: ${COLOR}; transform: translateX(5px); }

        /* Load More Section */
        #gp-load-more-container { margin: 30px 0; }
        .gp-load-more-btn { background-color: transparent; color: ${COLOR}; padding: 12px 30px; border: 2px solid ${COLOR}; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-size: 15px; display: inline-block; }
        .gp-load-more-btn:hover { background-color: ${COLOR}; color: white; }

        /* Footer - FIXED CENTERING */
        .gp-footer { margin-top: 40px; text-align: center; border-top: 1px solid #eee; padding-top: 25px; width: 100%; display: block; clear: both; }
        .gp-footer p { font-size: 14px; color: #333; margin-bottom: 15px; display: block; }
        .gp-footer img { height: 32px; display: inline-block; }
        
        /* Modal Styles */
        .gp-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; backdrop-filter: blur(2px); }
        .gp-modal-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; width: 90%; max-width: 700px; max-height: 90vh; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        .gp-modal-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .gp-modal-scroll { padding: 25px; overflow-y: auto; line-height: 1.6; color: #333; flex-grow: 1; }
        .gp-modal-footer { padding: 20px; border-top: 1px solid #eee; background: #fafafa; border-radius: 0 0 12px 12px; text-align: right; }
        .gp-apply-btn { background-color: ${COLOR}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; }
        .gp-perks-container { display: flex; flex-wrap: wrap; gap: 6px; margin: 15px 0; }
        .gp-perk-tag { background: #e8f5e9; color: #2e7d32; font-size: 12px; padding: 4px 10px; border-radius: 4px; font-weight: 600; }

        @media (max-width: 600px) { .gp-job-arrow, .gp-featured-tag, .gp-job-badge { display: none; } }
    `;
    document.head.appendChild(style);

    var targetElement = document.getElementById(SELECTOR);
    if (!targetElement) return;
    
    targetElement.innerHTML = `
        <div id="gp-board">
            <div class="gp-header">
                <div class="gp-search-box">
                    <span class="gp-search-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                    <input type="text" id="gp-search" class="gp-search-input" placeholder="Search jobs...">
                </div>
                <a href="https://gippslander.com.au/pricing" target="_blank" class="gp-post-btn">+ Post a Job</a>
            </div>
            <div id="gp-list-container" class="gp-job-list"><p style="text-align:center; padding:20px;">Loading...</p></div>
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
                <div class="gp-modal-header"><h3 id="gp-modal-title" style="margin:0;">Job Details</h3><button class="gp-close-btn" style="background:none; border:none; font-size:28px; cursor:pointer;">&times;</button></div>
                <div id="gp-modal-body" class="gp-modal-scroll"></div>
                <div class="gp-modal-footer"><a href="#" id="gp-modal-apply" target="_blank" class="gp-apply-btn">Apply Now</a></div>
            </div>
        </div>
    `;

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
        if (!jobs.length) { list.innerHTML = "<p style='text-align:center; padding:20px;'>No jobs found.</p>"; return; }

        list.innerHTML = jobs.slice(0, displayLimit).map(function(j) {
            var isFeatured = j.featured ? 'is-featured' : '';
            var featTag = j.featured ? '<div class="gp-featured-tag">Featured</div>' : '';
            return `<div class="gp-job-card ${isFeatured}" data-id="${j.id}">
                ${featTag}
                <div class="gp-logo-box"><img src="${j.employer?.logo || ''}" class="gp-logo-img" onerror="this.parentElement.innerHTML='?'"></div>
                <div class="gp-job-details">
                    <div class="gp-job-title">${j.title}</div>
                    <div class="gp-job-company">${j.employer?.name || ''} • ${j.location} • ${timeAgo(j.posted_at)}</div>
                </div>
                <div class="gp-job-badge">${j.job_type || 'Full Time'}</div>
                <div class="gp-job-arrow">&rarr;</div>
            </div>`;
        }).join('');
        loadMoreContainer.style.display = jobs.length > displayLimit ? 'block' : 'none';
    }

    document.getElementById('gp-load-more-btn').addEventListener('click', function() { displayLimit += 15; render(currentJobsList); });

    document.getElementById('gp-list-container').addEventListener('click', function(e) {
        var card = e.target.closest('.gp-job-card');
        if (card) {
            var job = allJobs.find(function(j) { return j.id == card.dataset.id; });
            if (job) {
                var perks = job.custom_fields?.["146383"]?.selected_options || [];
                var perksHtml = perks.length ? `<div class="gp-perks-container">${perks.map(p => `<span class="gp-perk-tag">${p.option}</span>`).join('')}</div>` : '';
                
                document.getElementById('gp-modal-title').innerText = job.title;
                document.getElementById('gp-modal-body').innerHTML = `
                    <strong>${job.employer?.name||''}</strong> | ${job.category?.name || ''}<br>
                    <small style="color:#666">${job.location}</small>
                    ${perksHtml}
                    <div style="margin-top:20px;">${job.description}</div>
                `;
                document.getElementById('gp-modal-apply').href = job.apply_to || job.job_details_url;
                document.getElementById('gp-modal').style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }
    });

    document.querySelector('.gp-close-btn').addEventListener('click', function() { document.getElementById('gp-modal').style.display = 'none'; document.body.style.overflow = 'auto'; });

    document.getElementById('gp-search').addEventListener('input', function(e) {
        var term = e.target.value.toLowerCase();
        displayLimit = 15;
        render(allJobs.filter(j => j.title.toLowerCase().includes(term) || j.employer?.name?.toLowerCase().includes(term)));
    });

    fetch(PROXY_URL).then(res => res.json()).then(data => {
        allJobs = (Array.isArray(data) ? data : []).sort((a, b) => {
            if (a.featured !== b.featured) return b.featured - a.featured;
            return new Date(b.posted_at) - new Date(a.posted_at);
        });
        render(allJobs);
    }).catch(() => { document.getElementById('gp-list-container').innerHTML = "Unable to load jobs."; });
})();
