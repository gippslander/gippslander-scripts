(function() {
  const container = document.getElementById('g-container');
  const overlay = document.getElementById('g-modal-overlay');
  const mode = container.getAttribute('data-mode') || 'full';

  // --- Modal Logic ---
  window.openModal = (c) => {
    document.getElementById('m-logo').src = c.finalLogo || '';
    document.getElementById('m-title').innerText = c.courseTitle || 'Course Details';
    document.getElementById('m-desc').innerText = c.description || '';
    
    const durLabel = document.getElementById('m-dur');
    const delLabel = document.getElementById('m-del');
    if (durLabel) durLabel.innerText = c.duration || 'Flexible';
    if (delLabel) delLabel.innerText = c.delivery || 'Online';
    
    document.getElementById('m-link').href = c.url || '#';
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = () => { 
    overlay.style.display = 'none'; 
    document.body.style.overflow = 'auto'; 
  };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  // --- Helper: Get Keywords from URL ---
  function getUrlKeywords() {
    try {
      const path = window.location.pathname.toLowerCase();
      const slug = path.split('/').pop().replace(/^\d+-/, ''); 
      const noise = ['and', 'the', 'for', 'with', 'hiring', 'job', 'experienced'];
      return slug.split('-').filter(word => word.length > 2 && !noise.includes(word));
    } catch (e) { return []; }
  }

  async function fetchCourses() {
    // MINIMAL QUERY: Removed filters to prevent API "handshake" errors
    const query = `{ 
      courses { 
        courseId courseTitle delivery description duration logo active featured tags
        provider { name } url 
      } 
    }`;

    try {
      const response = await fetch("https://api.baseql.com/airtable/graphql/appnoS15udCLKToYs", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const result = await response.json();
      
      // Check if the API actually returned data
      if (!result.data || !result.data.courses) {
        console.error("API Response Error:", result);
        container.innerHTML = '<p style="text-align:center;padding:20px;">No course data found.</p>';
        return;
      }

      let allCourses = result.data.courses;

      // 1. Safe Filter for "Active"
      let activeCourses = allCourses.filter(c => c && (c.active === true || c.active === 1 || String(c.active) === "true"));

      let displayCourses = [];

      if (mode === 'compact') {
        const urlKeywords = getUrlKeywords();
        // Safe Filter for "Featured"
        let featured = activeCourses.filter(c => c.featured === true || c.featured === 1 || String(c.featured) === "true");

        featured.forEach(c => {
          c._score = 0;
          // Only score if 'tags' actually exists and isn't null
          if (c.tags && typeof c.tags === 'string') {
            const courseTags = c.tags.toLowerCase();
            urlKeywords.forEach(word => {
              if (courseTags.includes(word)) c._score++;
            });
          }
        });

        let matches = featured.filter(c => c._score > 0).sort((a,b) => b._score - a._score);
        let others = featured.filter(c => c._score === 0).sort(() => 0.5 - Math.random());
        displayCourses = [...matches, ...others].slice(0, 3);
      } else {
        displayCourses = activeCourses.sort((a, b) => (a.courseTitle || "").localeCompare(b.courseTitle || ""));
      }

      // --- RENDERING ---
      container.innerHTML = '';
      displayCourses.forEach(course => {
        let logoUrl = "https://via.placeholder.com/60?text=Logo";
        if (course.logo && course.logo[0]) {
            logoUrl = (typeof course.logo[0] === 'string') ? course.logo[0] : (course.logo[0].url || logoUrl);
        }
        const pName = (course.provider && course.provider[0]) ? course.provider[0].name : "Provider";
        const normalized = { ...course, finalLogo: logoUrl };

        const card = document.createElement('div');
        if (mode === 'compact') {
          card.className = 'g-card-compact';
          card.onclick = () => openModal(normalized);
          card.innerHTML = `<div class="g-compact-header"><div class="g-brand-mini"><img src="${logoUrl}" class="g-logo-sm"><span class="g-provider-sm">${pName}</span></div><h3 class="g-title-sm">${course.courseTitle || 'Untitled'}</h3></div><div class="g-compact-footer"><span>⏱ ${course.duration || 'Flexible'}</span><span>💻 ${course.delivery || 'Online'}</span></div>`;
        } else {
          card.className = 'g-card';
          card.onclick = () => openModal(normalized);
          card.innerHTML = `
            <div class="g-header">
              <div class="g-brand"><div class="g-logo-box"><img src="${logoUrl}"></div><span class="g-provider-name">${pName}</span></div>
              <h3 class="g-title">${course.courseTitle || 'Untitled'}</h3>
              <div class="g-course-id">${course.courseId || ''}</div>
            </div>
            <div class="g-body">
              <div class="g-row"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${course.duration || 'Flexible'}</span></div>
              <div class="g-row"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg><span>${course.delivery || 'Online'}</span></div>
              <div class="g-row"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg><span class="g-desc-clamp">${course.description || ''}</span></div>
            </div>
            <div class="g-footer"><button class="g-btn-more">Learn more</button></div>`;
        }
        container.appendChild(card);
      });
    } catch (err) { 
      container.innerHTML = '<p style="text-align:center;padding:20px;">Connection Error. Please check Airtable tags.</p>';
      console.error(err);
    }
  }
  fetchCourses();
})();
