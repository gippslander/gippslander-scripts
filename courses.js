(function() {
  const container = document.getElementById('g-container');
  const overlay = document.getElementById('g-modal-overlay');
  const mode = container.getAttribute('data-mode') || 'compact';

  // --- ICONS ---
  const iconClock = `<svg class="g-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  const iconLaptop = `<svg class="g-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;
  const iconClockSm = `<svg class="g-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`;
  const iconLaptopSm = `<svg class="g-icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`;

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

  window.closeModal = () => { overlay.style.display = 'none'; document.body.style.overflow = 'auto'; };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  function getUrlKeywords() {
    try {
      const path = window.location.pathname.toLowerCase();
      const slug = path.split('/').pop().replace(/^\d+-/, ''); 
      const noise = ['and', 'the', 'for', 'with', 'hiring', 'job', 'experienced']; 
      const keywords = slug.split('-').filter(word => word.length > 2 && !noise.includes(word));
      if (slug === 'test') keywords.push('test');
      return keywords;
    } catch (e) { return []; }
  }

  async function fetchCourses() {
    const query = `{ courses { courseId courseTitle delivery description duration logo active featured tags provider { name } url } }`;
    try {
      const response = await fetch("https://api.baseql.com/airtable/graphql/appnoS15udCLKToYs", {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
      });
      const result = await response.json();
      if (!result.data || !result.data.courses) return;

      let allCourses = result.data.courses;
      let activeCourses = allCourses.filter(c => c && (c.active === true || c.active === 1 || String(c.active) === "true"));
      let displayCourses = [];

      if (mode === 'compact') {
        container.className = 'g-swipe-wrapper'; 
        const urlKeywords = getUrlKeywords();
        
        // --- UPDATED: Look at ALL active courses, not just featured ---
        activeCourses.forEach(c => {
          c._score = 0;
          let searchHaystack = [];
          if (c.tags) {
            if (Array.isArray(c.tags)) searchHaystack.push(...c.tags.map(t => String(t).toLowerCase()));
            else searchHaystack.push(String(c.tags).toLowerCase());
          }
          if (c.courseTitle) searchHaystack.push(c.courseTitle.toLowerCase());
          const combinedText = searchHaystack.join(' ');
          urlKeywords.forEach(word => { if (combinedText.includes(word.toLowerCase().trim())) c._score++; });
        });
        
        let matches = activeCourses.filter(c => c._score > 0).sort((a,b) => b._score - a._score);
        let others = activeCourses.filter(c => c._score === 0).sort(() => 0.5 - Math.random());
        displayCourses = [...matches, ...others].slice(0, 3);
        
      } else {
        container.className = 'g-grid'; 
        displayCourses = activeCourses.sort((a, b) => (a.courseTitle || "").localeCompare(b.courseTitle || ""));
      }

      container.innerHTML = '';
      displayCourses.forEach(course => {
        let logoUrl = "https://via.placeholder.com/60?text=Logo";
        if (course.logo && course.logo[0]) logoUrl = (typeof course.logo[0] === 'string') ? course.logo[0] : (course.logo[0].url || logoUrl);
        const pName = (course.provider && course.provider[0]) ? course.provider[0].name : "Provider";
        const normalized = { ...course, finalLogo: logoUrl };

        const hasId = course.courseId && String(course.courseId).trim().length > 0;
        
        // --- BADGE LOGIC (Still works for featured items) ---
        const isFeatured = course.featured === true || course.featured === 1 || String(course.featured) === "true";
        const badgeHtml = isFeatured ? `<div class="g-badge-pop">POPULAR</div>` : '';

        const card = document.createElement('div');
        if (mode === 'compact') {
          card.className = 'g-card-compact';
          card.onclick = () => openModal(normalized);
          card.innerHTML = `
            ${badgeHtml}
            <div class="g-compact-header">
              <div class="g-brand-mini"><img src="${logoUrl}" class="g-logo-sm"><span class="g-provider-sm">${pName}</span></div>
              <h3 class="g-title-sm">${course.courseTitle || 'Untitled'}</h3>
            </div>
            <div class="g-compact-footer">
              <div class="g-row-mini">${iconClockSm} <span>${course.duration || 'Flexible'}</span></div>
              <div class="g-row-mini">${iconLaptopSm} <span>${course.delivery || 'Online'}</span></div>
            </div>
          `;
        } else {
          card.className = 'g-card';
          card.onclick = () => openModal(normalized);
          
          card.innerHTML = `
            ${badgeHtml}
            <div class="g-header">
              <div class="g-brand"><div class="g-logo-box"><img src="${logoUrl}"></div><span class="g-provider-name">${pName}</span></div>
              <h3 class="g-title">${course.courseTitle || 'Untitled'}</h3>
              ${hasId ? `<div class="g-course-id">${course.courseId}</div>` : ''}
            </div>
            <div class="g-body">
              <div class="g-row">${iconClock} <span>${course.duration || 'Flexible'}</span></div>
              <div class="g-row">${iconLaptop} <span>${course.delivery || 'Online'}</span></div>
              <div class="g-row"><span class="g-desc-clamp">${course.description || ''}</span></div>
            </div>
            <div class="g-footer"><button class="g-btn-more">Learn more</button></div>
          `;
        }
        container.appendChild(card);
      });
    } catch (err) { console.error(err); }
  }
  fetchCourses();
})();
