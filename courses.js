(function() {
  const container = document.getElementById('g-container');
  const overlay = document.getElementById('g-modal-overlay');
  const mode = container.getAttribute('data-mode') || 'full';

  // --- Modal Logic ---
  window.openModal = (c) => {
    document.getElementById('m-logo').src = c.finalLogo;
    document.getElementById('m-title').innerText = c.courseTitle;
    document.getElementById('m-desc').innerText = c.description || '';
    document.getElementById('m-dur').innerText = c.duration || 'Flexible';
    document.getElementById('m-del').innerText = c.delivery || 'Online';
    document.getElementById('m-link').href = c.url;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = () => { overlay.style.display = 'none'; document.body.style.overflow = 'auto'; };
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  // --- Data Fetching & Rendering ---
  async function fetchCourses() {
    // We fetch 'active' as a field but remove the GraphQL filter 
    // to avoid API syntax errors.
    const query = `{ 
      courses { 
        courseId 
        courseTitle 
        delivery 
        description 
        duration 
        logo 
        active
        provider { name } 
        url 
      } 
    }`;

    try {
      const response = await fetch("https://api.baseql.com/airtable/graphql/appnoS15udCLKToYs", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      
      const result = await response.json();
      
      if (result.errors) {
        container.innerHTML = `<p style="text-align:center; color:red;">API Error: ${result.errors[0].message}</p>`;
        return;
      }

      // --- CRITICAL FILTER STEP ---
      // This filters the data in the browser. 
      // It will work regardless of whether Airtable sees 'active' as a boolean or a 1/0.
      let courses = result.data.courses.filter(course => {
          return course.active === true || course.active === 1 || course.active === "true";
      });

      if (!courses || courses.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:20px;">No courses are currently marked as active.</p>';
        return;
      }

      if (mode === 'compact') {
        courses = courses.sort(() => 0.5 - Math.random()).slice(0, 3);
      }

      container.innerHTML = '';

      courses.forEach(course => {
        let logoUrl = "https://via.placeholder.com/60?text=No+Logo";
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
              <div class="g-brand-mini">
                <img src="${logoUrl}" class="g-logo-sm" onerror="this.src='https://via.placeholder.com/60'">
                <span class="g-provider-sm">${pName}</span>
              </div>
              <h3 class="g-title-sm">${course.courseTitle || 'Untitled'}</h3>
            </div>
            <div class="g-compact-footer">
              <span>⏱ ${course.duration || 'Flexible'}</span>
              <span>💻 ${course.delivery || 'Online'}</span>
            </div>
          `;
        } else {
          card.className = 'g-card';
          card.onclick = () => openModal(normalized);
          card.innerHTML = `
            <div class="g-header">
              <div class="g-brand">
                <div class="g-logo-box"><img src="${logoUrl}" loading="lazy"></div>
                <span class="g-provider-name">${pName}</span>
              </div>
              <h3 class="g-title">${course.courseTitle || 'Untitled'}</h3>
              <div class="g-course-id">${course.courseId || ''}</div>
            </div>
            <div class="g-body">
              <div class="g-row"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg><span>${course.duration || 'Flexible'}</span></div>
              <div class="g-row"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg><span>${course.delivery || 'Online'}</span></div>
              <div class="g-row"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="18"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg><span style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${course.description || ''}</span></div>
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
