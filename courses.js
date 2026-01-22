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
      const noise = ['and', 'the', 'for', 'with', 'hiring', 'job', 'experienced', 'test']; 
      const keywords = slug.split('-').filter(word => word.length > 2 && !noise.includes(word));
      if (slug === 'test') keywords.push('test');
      return keywords;
    } catch (e) { return []; }
  }

  async function fetchCourses() {
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
      
      if (!result.data || !result.data.courses) {
        container.innerHTML = '<p style="text-align:center;padding:20px;">No course data found.</p>';
        return;
      }

      let allCourses = result.data.courses;

      // 1. Filter for Active Status
      let activeCourses = allCourses.filter(c => c && (c.active === true || c.active === 1 || String(c.active) === "true"));

      let displayCourses = [];

      if (mode === 'compact') {
        const urlKeywords = getUrlKeywords();
        // 2. Filter for Featured courses for the widget
        let featured = activeCourses.filter(c => c.featured === true || c.featured === 1 || String(c.featured) === "true");

        // 3. Smart Scoring
        featured.forEach(c => {
          c._score = 0;
          let searchHaystack = [];
          
          if (c.tags) {
            if (Array.isArray(c.tags)) {
              searchHaystack.push(...c.tags.map(t => String(t).toLowerCase()));
            } else {
              searchHaystack.push(String(c.tags).toLowerCase());
            }
          }
          
          if (c.courseTitle) searchHaystack.push(c.courseTitle.toLowerCase());

          const combinedText = searchHaystack.join(' ');
          urlKeywords.forEach(word => {
            const cleanWord = word.toLowerCase().trim();
            if (combinedText.includes(cleanWord)) {
              c._score++;
            }
          });
        });

        // 4. Sort: Highest score first, then shuffle non-matches
        let matches = featured.filter(c => c._score > 0).sort((a,b) => b._score - a._score);
        let others = featured.filter(c => c._score === 0).sort(() => 0.5 - Math.random());
        
        displayCourses = [...matches, ...others].slice(0, 3);

      } else {
        // Full mode: Alphabetical sorting
        displayCourses = activeCourses.sort((a, b) => (a.courseTitle || "").localeCompare(b.courseTitle || ""));
      }

      // --- Rendering Logic ---
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
          card.innerHTML = `
            <div class="g-compact-header">
              <div class="g-brand-mini"><img src="${logoUrl}" class="g-logo-sm"><span class="g-provider-sm">${pName}</span></div>
              <h3 class="g-title-sm">${course.courseTitle || 'Untitled'}</h3>
            </div>
            <div class="g-compact-footer"><span>⏱ ${course.duration || 'Flexible'}</span><span>💻 ${course.delivery || 'Online'}</span></div>
          `;
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
              <div class="g-row"><span>⏱ ${course.duration || 'Flexible'}</span></div>
              <div class="g-row"><span>💻 ${course.delivery || 'Online'}</span></div>
              <div class="g-row"><span class="g-desc-clamp">${course.description || ''}</span></div>
            </div>
            <div class="g-footer"><button class="g-btn-more">Learn more</button></div>
          `;
        }
        container.appendChild(card);
      });
    } catch (err) { 
      container.innerHTML = '<p style="text-align:center;padding:20px;">Unable to load courses.</p>';
    }
  }
  fetchCourses();
})();
