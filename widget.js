/* Gippslander Job Widget 
   Hosted via jsDelivr
*/
(function() {
    // 1. Get User Configuration (with defaults)
    var config = window.GippslanderConfig || {};
    var TOWNS = config.towns || "Inverloch,Wonthaggi";
    var COLOR = config.accentColor || "#4CAF50"; // Default Green
    var SELECTOR = config.containerId || "gippslander-job-board";
    // POINT THIS TO YOUR VERCEL PROXY
    var PROXY_URL = "https://gippsland-jobs-proxy.vercel.app/api/jobs?towns=" + encodeURIComponent(TOWNS);

    // 2. Inject CSS (Dynamic Color)
    var style = document.createElement('style');
    style.innerHTML = `
        #gp-board { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 900px; margin: 0 auto; color: #333; }
        .gp-header { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .gp-search-box { flex-grow: 1; position: relative; }
        .gp-search-input { width: 100%; padding: 12px 15px; padding-left: 40px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; outline: none; transition: border 0.2s; }
        .gp-search-input:focus { border-color: ${COLOR}; }
        .gp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #888; pointer-events: none; }
        .gp-post-btn { background-color: ${COLOR}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; white-space: nowrap; transition: opacity 0.2s; display: inline-block; text-align: center; border: none; cursor: pointer; }
        .gp-post-btn:hover { opacity: 0.9; }
        .gp-job-list { display: flex; flex-direction: column; gap: 10px; min-height: 200px; }
        .gp-job-card { display: flex; align-items: center; background: white; border: 1px solid #e1e4e8; border-radius: 8px; padding: 15px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
        .gp-job-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: ${COLOR}; }
        .gp-logo-box { width: 50px; height: 50px; border-radius: 6px; overflow: hidden; flex-shrink: 0; margin-right: 15px; background: #f9f9f9; display: flex; align-items: center; justify-content: center; border: 1px solid #eee; }
        .gp-logo-img { width: 100%; height: 100%; object-fit: contain; }
        .gp-logo-placeholder { font-weight: bold; color: #ccc; font-size: 20px; }
        .gp-job-details { flex-grow: 1; min-width: 0; }
        .gp-job-title { font-size: 18px; font-weight: 700; color: #333; margin: 0 0 4px 0; }
        .gp-job-company { font-size: 14px; color: #666; }
        .gp-job-badge { background: #f0f0f0; color: #333; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; white-space: nowrap; margin-left: 10px; }
        .gp-footer { margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .gp-footer p { font-size: 12px; color: #999; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
        .gp-footer img { height: 30px; opacity: 0.8; }
        
        /* Modal */
        .gp-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; backdrop-filter: blur(2px); }
        .gp-modal-container { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; width: 90%; max-width: 700px; max-height: 90vh; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
        .gp-modal-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
        .gp-close-btn { background: none; border: none; font-size: 28px; cursor: pointer; color: #888; padding: 0; line-height: 1; }
        .gp-modal-scroll { padding: 25px; overflow-y: auto; line-height: 1.6; color: #333; flex-grow: 1; }
        .gp-modal-scroll img { max-width: 100%; height: auto; }
        .gp-modal-footer { padding: 20px; border-top: 1px solid #eee; background: #fafafa; border-radius: 0 0 12px 12px; text-align: right; }
        .gp-apply-btn { background-color: ${COLOR}; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; transition: opacity 0.2s; }
        .gp-apply-btn:hover { opacity: 0.9; }
        @media (max-width: 600px) { .gp-header { flex-direction: column; } .gp-post-btn { width: 100%; box-sizing: border-box; } .gp-job-badge { display: none; } }
    `;
    document.head.appendChild(style);

    // 3. Inject HTML Structure
    var targetElement = document.getElementById(SELECTOR);
    if (!targetElement) { console.error("Gippslander Widget: Container element not found"); return; }
    
    targetElement.innerHTML = `
        <div id="gp-board">
            <div class="gp-header">
                <div class="gp-search-box">
                    <span class="gp-search-icon">&#128269;</span>
                    <input type="text" id="gp-search" class="gp-search-input" placeholder="Search jobs...">
                </div>
                <a href="https://gippslander.com.au/pricing" target="_blank" class="gp-post-btn">+ Post a Job</a>
            </div>
            <div id="gp-list-container" class="gp-job-list">
                <p style="text-align:center; color:#666; padding: 20px;">Loading...</p>
            </div>
            <div class="gp-footer">
                <p>Powered by</p>
                <a href="https://gippslander.com.au" target="_blank"><img src="https://d3535lqr6sqxto.cloudfront.net/logos/rEkuQybTnVw95OUPNTLLVxtGB7t4BbAVgbRJTndj.png" alt="Gippslander"></a>
            </div>
        </div>
        <div id="gp-modal" class="gp-modal-overlay">
            <div class="gp-modal-container">
                <div class="gp-modal-header"><h3 id="gp-modal-title" style="margin:0;">Job Details</h3><button class="gp-close-btn">&times;</button></div>
                <div id="gp-modal-body" class="gp-modal-scroll"></div>
                <div class="gp-modal-footer"><a href="#" id="gp-modal-apply" target="_blank" class="gp-apply-btn">Apply Now</a></div>
            </div>
        </div>
    `;

    // 4. Logic (Fetch & Render)
    var allJobs = [];
    
    function render(jobs) {
        var list = document.getElementById('gp-list-container');
        if (!jobs.length) { list.innerHTML = "<p style='text-align:center; padding:20px;'>No active jobs found.</p>"; return; }
        list.innerHTML = jobs.map(function(j) {
            var logo = j.employer && j.employer.logo ? `<img src="${j.employer.logo}" class="gp-logo-img">` : `<span class="gp-logo-placeholder">?</span>`;
            var badge = j.job_type || "Full Time";
            return `<div class="gp-job-card" data-id="${j.id}">
                <div class="gp-logo-box">${logo}</div>
                <div class="gp-job-details"><div class="gp-job-title">${j.title}</div><div class="gp-job-company">${j.employer?.name || ''} • ${j.location}</div></div>
                <div class="gp-job-badge">${badge}</div>
            </div>`;
        }).join('');
    }

    // Modal Logic
    var modal = document.getElementById('gp-modal');
    var close = function() { modal.style.display = 'none'; document.body.style.overflow = 'auto'; };
    
    document.querySelector('.gp-close-btn').addEventListener('click', close);
    modal.addEventListener('click', function(e) { if(e.target === modal) close(); });

    document.getElementById('gp-list-container').addEventListener('click', function(e) {
        var card = e.target.closest('.gp-job-card');
        if (card) {
            var job = allJobs.find(function(j) { return j.id == card.dataset.id; });
            if (job) {
                document.getElementById('gp-modal-title').innerText = job.title;
                document.getElementById('gp-modal-body').innerHTML = `<strong>${job.employer?.name||''}</strong> - ${job.location}<br><br>${job.description}`;
                document.getElementById('gp-modal-apply').href = job.apply_url || job.job_details_url;
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        }
    });

    // Search Logic
    document.getElementById('gp-search').addEventListener('input', function(e) {
        var term = e.target.value.toLowerCase();
        render(allJobs.filter(function(j) { 
            return j.title.toLowerCase().includes(term) || (j.employer && j.employer.name && j.employer.name.toLowerCase().includes(term));
        }));
    });

    // Initial Fetch
    fetch(PROXY_URL)
        .then(function(res) { return res.json(); })
        .then(function(data) { 
            allJobs = Array.isArray(data) ? data : []; 
            render(allJobs); 
        })
        .catch(function(err) { 
            document.getElementById('gp-list-container').innerHTML = "Unable to load jobs."; 
        });

})();
