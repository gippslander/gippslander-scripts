(function() {
    const STORAGE_KEY = 'gippslander_saved_jobs';
    const toolbar = document.querySelector('.job-action-toolbar');
    if (!toolbar) return;

    // Helper to get elements within THIS toolbar
    const qs = (sel) => toolbar.querySelector(sel);

    const updateUI = () => {
        const savedJobs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        const currentUrl = window.location.href;
        const isSaved = savedJobs.some(job => job.url === currentUrl);
        
        // Update Counter
        const countEl = qs('#savedCount');
        const counterBtn = qs('#counterBtn');
        if (countEl) countEl.innerText = savedJobs.length;
        if (counterBtn) counterBtn.classList.toggle('has-saved-items', savedJobs.length > 0);

        // Update Save Button
        const saveBtn = qs('#saveBtn');
        const saveIcon = qs('#saveIcon');
        const saveText = qs('#saveText');
        
        if (saveBtn) {
            saveBtn.classList.toggle('is-saved', isSaved);
            if (saveIcon) saveIcon.setAttribute('fill', isSaved ? '#e91e63' : 'none');
            if (saveText) saveText.innerText = isSaved ? "Saved" : "Save";
        }
    };

    // Actions
    const actions = {
        save: () => {
            let savedJobs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const currentUrl = window.location.href;
            const index = savedJobs.findIndex(job => job.url === currentUrl);

            if (index > -1) {
                savedJobs.splice(index, 1);
            } else {
                savedJobs.push({ 
                    url: currentUrl, 
                    title: document.title.split('|')[0].trim(), 
                    date: new Date().toLocaleDateString('en-AU') 
                });
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedJobs));
            updateUI();
        },
        copy: (btn) => {
            navigator.clipboard.writeText(window.location.href).then(() => {
                const textEl = btn.querySelector('span');
                const oldText = textEl.innerText;
                textEl.innerText = "Copied!";
                setTimeout(() => { textEl.innerText = oldText; }, 2000);
            });
        },
        share: () => {
            const shareData = {
                title: document.title,
                url: window.location.href
            };
            // Use native mobile share if available, otherwise fallback to email
            if (navigator.share) {
                navigator.share(shareData).catch(() => {});
            } else {
                window.location.href = `mailto:?subject=Job Link&body=${window.location.href}`;
            }
        },
        report: () => {
            const msg = encodeURIComponent("I would like to report this job: " + window.location.href);
            window.location.href = "https://gippslander.com.au/contact-us?message=" + msg;
        }
    };

    // Attach Events (Optimized: No 'onclick' in HTML needed)
    qs('#saveBtn')?.addEventListener('click', actions.save);
    qs('#copyBtn')?.addEventListener('click', (e) => actions.copy(e.currentTarget));
    qs('#shareBtn')?.addEventListener('click', actions.share);
    qs('#reportBtn')?.addEventListener('click', actions.report);

    updateUI();
})();
