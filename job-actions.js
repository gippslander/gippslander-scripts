(function() {
    const STORAGE_KEY = 'gippslander_saved_jobs';
    
    // We use a slight delay or check to ensure the DOM is ready
    const initToolbar = () => {
        const toolbar = document.querySelector('.job-action-toolbar');
        if (!toolbar) return;

        // Internal helper to find elements only inside this toolbar
        const qs = (sel) => toolbar.querySelector(sel);

        const updateUI = () => {
            const savedJobs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
            const currentUrl = window.location.href;
            const isSaved = savedJobs.some(job => job.url === currentUrl);
            
            // 1. Update Saved Counter Button
            const countEl = qs('#savedCount');
            const counterBtn = qs('#counterBtn');
            if (countEl) countEl.innerText = savedJobs.length;
            if (counterBtn) {
                counterBtn.classList.toggle('has-saved-items', savedJobs.length > 0);
            }

            // 2. Update Save Button State
            const saveBtn = qs('#saveBtn');
            const saveIcon = qs('#saveIcon');
            const saveText = qs('#saveText');
            
            if (saveBtn) {
                saveBtn.classList.toggle('is-saved', isSaved);
                if (saveIcon) saveIcon.setAttribute('fill', isSaved ? '#e91e63' : 'none');
                if (saveText) saveText.innerText = isSaved ? "Saved" : "Save";
            }
        };

        // Execution Logic
        const handleSave = () => {
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
        };

        const handleShare = () => {
            const shareData = {
                title: document.title.split('|')[0].trim(),
                text: 'Check out this job on Gippslander:',
                url: window.location.href
            };
            
            // Mobile Native Share or fallback to Email
            if (navigator.share) {
                navigator.share(shareData).catch(() => {});
            } else {
                const subject = encodeURIComponent(shareData.title);
                const body = encodeURIComponent(shareData.text + " " + shareData.url);
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
            }
        };

        // Attach Event Listeners (This replaces the old 'onclick')
        qs('#saveBtn')?.addEventListener('click', handleSave);
        qs('#shareBtn')?.addEventListener('click', handleShare);

        // Run once on load to set initial colors/counts
        updateUI();
    };

    // Ensure script runs even if loaded after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToolbar);
    } else {
        initToolbar();
    }
})();
