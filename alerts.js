  document.addEventListener("DOMContentLoaded", () => {
    let payload = { keyword: "", location_id: "", location_name: "" };
    let validTowns = [];
    let validKeywords = [];

    const cardContainer = document.getElementById('gipps-card-container');
    const mainTitle = document.getElementById('gipps-main-title');
    
    // Mode Wrappers
    const kwInputMode = document.getElementById('kw-input-mode');
    const kwTagMode = document.getElementById('kw-tag-mode');
    const locInputMode = document.getElementById('loc-input-mode');
    const locTagMode = document.getElementById('loc-tag-mode');
    
    const keywordInput = document.getElementById('f-keyword-input');
    const keywordSuggestions = document.getElementById('gipps-keyword-suggestions');
    const townInput = document.getElementById('f-town-input');
    const locSuggestions = document.getElementById('gipps-loc-suggestions');
    const emailInput = document.getElementById('f-email');
    const submitBtn = document.getElementById('gipps-submit-btn');
    
    const errorBox = document.getElementById('gipps-error-box');
    const errorText = document.getElementById('gipps-error-text');

    // Prevent inputs from losing focus when clicking the suggestion list scrollbar
    keywordSuggestions.addEventListener('mousedown', (e) => e.preventDefault());
    locSuggestions.addEventListener('mousedown', (e) => e.preventDefault());

    if (window.$jBoard && window.$jBoard.currentUser && window.$jBoard.currentUser.email) {
      emailInput.value = window.$jBoard.currentUser.email;
    }

    // 1. FETCH AND SORT JSONS
    const fetchLocations = fetch('https://cdn.jsdelivr.net/gh/gippslander/assets@main/locations.json')
      .then(res => res.json())
      .then(data => {
        validTowns = data.filter(t => t.location_id && t.location_id.trim() !== "")
                         .sort((a, b) => (b.priority || 0) - (a.priority || 0) || a.label.localeCompare(b.label));
      });

    const fetchJobs = fetch('https://cdn.jsdelivr.net/gh/gippslander/assets@main/jobs.json')
      .then(res => res.json())
      .then(data => {
        validKeywords = data.sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label));
      });

    Promise.all([fetchLocations, fetchJobs])
      .then(() => {
        parseURLParameters();
      })
      .catch(err => {
        console.error("Failed to fetch autocomplete data:", err);
        parseURLParameters(); 
      });

    // 2. SMART SLUG PARSING
    function parseURLParameters() {
      const params = new URLSearchParams(window.location.search);
      const path = window.location.pathname; 

      if (params.get('q')) payload.keyword = params.get('q');

      if (params.get('location_id')) {
        payload.location_id = params.get('location_id');
        if (params.get('location')) {
          payload.location_name = decodeURIComponent(params.get('location')).split(',')[0].trim();
        } else {
          const match = validTowns.find(t => t.location_id === payload.location_id);
          if (match) payload.location_name = match.label.split(',')[0].trim();
        }
      } else if (path.includes('/jobs/in-')) {
        const slugMatch = path.match(/\/jobs\/in-([^/]+)/);
        if (slugMatch) {
          const urlSlug = slugMatch[1].toLowerCase();
          const match = validTowns.find(t => {
            const townSlug = t.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return urlSlug === townSlug || urlSlug.startsWith(townSlug);
          });
          if (match) {
            payload.location_id = match.location_id;
            payload.location_name = match.label.split(',')[0].trim(); 
          }
        }
      }
      renderUI();
    }

    // 3. UI RENDERING
    function renderUI() {
      kwTagMode.innerHTML = "";
      locTagMode.innerHTML = "";
      
      // Dynamic Title Logic
      if (payload.location_name && mainTitle) {
        mainTitle.innerHTML = `Never miss a job in <span style="color: #4aae55;">${payload.location_name}</span>`;
      } else if (mainTitle) {
        mainTitle.textContent = "Never miss a job match";
      }
      
      if (payload.keyword) {
        kwInputMode.classList.add('gipps-hidden');
        kwTagMode.classList.remove('gipps-hidden');
        kwTagMode.appendChild(createTag(payload.keyword, 'keyword', '<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>'));
      } else { 
        kwInputMode.classList.remove('gipps-hidden'); 
        kwTagMode.classList.add('gipps-hidden');
        keywordInput.value = ""; 
      }
      
      if (payload.location_id && payload.location_name) {
        locInputMode.classList.add('gipps-hidden');
        locTagMode.classList.remove('gipps-hidden');
        locTagMode.appendChild(createTag(payload.location_name, 'location', '<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>'));
      } else { 
        locInputMode.classList.remove('gipps-hidden');
        locTagMode.classList.add('gipps-hidden');
        townInput.value = ""; 
      }
    }

    function createTag(text, type, svgPath) {
      const tag = document.createElement('div');
      tag.className = 'gipps-tag';
      tag.innerHTML = `
        <div class="gipps-tag-left">
          <svg viewBox="0 0 24 24">${svgPath}</svg>
          <span>${text}</span>
        </div>
        <button type="button" class="gipps-tag-close" aria-label="Remove tag">&times;</button>
      `;
      tag.querySelector('.gipps-tag-close').addEventListener('click', () => {
        if (type === 'keyword') payload.keyword = "";
        if (type === 'location') { payload.location_id = ""; payload.location_name = ""; }
        renderUI();
      });
      return tag;
    }

    // 4. AUTO LOCK-IN LOGIC
    function lockInKeyword() {
      if (kwInputMode.classList.contains('gipps-hidden')) return; 
      const val = keywordInput.value.trim();
      if (val) {
        const match = validKeywords.find(k => k.label.toLowerCase() === val.toLowerCase());
        payload.keyword = match ? match.label : val;
      }
      keywordSuggestions.style.display = 'none';
      renderUI();
    }

    function lockInTown() {
      if (locInputMode.classList.contains('gipps-hidden')) return; 
      const val = townInput.value.trim().toLowerCase();
      if (val) {
        const match = validTowns.find(t => t.label.toLowerCase().includes(val));
        if (match) {
          payload.location_id = match.location_id;
          payload.location_name = match.label.split(',')[0].trim();
        } else {
          townInput.value = ""; 
        }
      }
      locSuggestions.style.display = 'none';
      renderUI();
    }

    keywordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lockInKeyword(); } });
    townInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); lockInTown(); } });

    keywordInput.addEventListener('blur', () => setTimeout(lockInKeyword, 150));
    townInput.addEventListener('blur', () => setTimeout(lockInTown, 150));

    // 5. DROPDOWN LOGIC
    function handleKeywordSuggestions(q) {
      keywordSuggestions.innerHTML = '';
      let matches = !q ? validKeywords.slice(0, 10) : validKeywords.filter(k => k.label.toLowerCase().includes(q)).slice(0, 10);
      keywordSuggestions.style.display = 'block';

      if (!q) {
        const allLi = document.createElement('li');
        allLi.innerHTML = '<strong>All jobs</strong>';
        allLi.addEventListener('click', () => { payload.keyword = ""; keywordSuggestions.style.display = 'none'; renderUI(); });
        keywordSuggestions.appendChild(allLi);
      }

      if (matches.length > 0) {
        matches.forEach(k => {
          const li = document.createElement('li');
          li.textContent = k.label;
          li.addEventListener('click', () => { payload.keyword = k.label; keywordSuggestions.style.display = 'none'; renderUI(); });
          keywordSuggestions.appendChild(li);
        });
      }
    }

    function handleTownSuggestions(q) {
      locSuggestions.innerHTML = '';
      let matches = !q ? validTowns.slice(0, 10) : validTowns.filter(t => t.label.toLowerCase().includes(q)).slice(0, 10);
      locSuggestions.style.display = 'block';

      if (!q) {
        const allLi = document.createElement('li');
        allLi.innerHTML = '<strong>All towns</strong>';
        allLi.addEventListener('click', () => { payload.location_id = ""; payload.location_name = ""; locSuggestions.style.display = 'none'; renderUI(); });
        locSuggestions.appendChild(allLi);
      }

      if (matches.length > 0) {
        matches.forEach(t => {
          const li = document.createElement('li');
          li.textContent = t.label;
          li.addEventListener('click', () => { payload.location_id = t.location_id; payload.location_name = t.label.split(',')[0].trim(); locSuggestions.style.display = 'none'; renderUI(); });
          locSuggestions.appendChild(li);
        });
      }
    }

    keywordInput.addEventListener('focus', function() { handleKeywordSuggestions(this.value.toLowerCase()); });
    keywordInput.addEventListener('input', function() { handleKeywordSuggestions(this.value.toLowerCase()); });
    
    townInput.addEventListener('focus', function() { handleTownSuggestions(this.value.toLowerCase()); });
    townInput.addEventListener('input', function() { handleTownSuggestions(this.value.toLowerCase()); });

    document.addEventListener('click', (e) => {
      if (!kwInputMode.contains(e.target)) keywordSuggestions.style.display = 'none';
      if (!locInputMode.contains(e.target)) locSuggestions.style.display = 'none';
    });

    // 6. FORM SUBMISSION & ERROR HANDLING
    document.getElementById('gipps-alert-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      lockInKeyword();
      lockInTown();

      errorBox.classList.add('gipps-hidden');
      submitBtn.textContent = "Creating...";
      submitBtn.disabled = true;

      // Fixed Payload: Appends state and country formatting for the API
      const finalPayload = {
        email: emailInput.value,
        alert_condition: { 
          q: payload.keyword || null, 
          location_id: payload.location_id || null,
          location: payload.location_name ? `${payload.location_name}, Victoria, Australia` : null
        }
      };

      try {
        const res = await fetch('https://gippsland-jobs-proxy.vercel.app/api/create-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalPayload)
        });
        
        const data = await res.json();

        if (res.ok) {
          // Fixed UI mapping: Pulls from original payload to keep location names short in success message
          const uiKeyword = payload.keyword || 'jobs';
          const uiLocation = payload.location_name || 'Gippsland';
          
          cardContainer.innerHTML = `
            <h2 class="gipps-card-title">You're all set!</h2>
            <p class="gipps-card-subtitle">Alerts for <strong>${uiKeyword}</strong> in <strong>${uiLocation}</strong> will be sent to ${finalPayload.email}.</p>
            <div class="gipps-tag" style="margin-top:10px; display:inline-flex; width:auto; padding: 10px 20px; background-color: #dcfce7; border-color: #bbf7d0;">
              <svg viewBox="0 0 24 24" style="width:18px; height:18px; fill:#22c55e; margin-right:8px;"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              Daily updates enabled
            </div>
          `;
        } else {
          let errorMsg = data.error || "Something went wrong. Please try again.";
          const rawError = errorMsg.toLowerCase();
          
          if (rawError.includes('jboard') || rawError.includes('already') || rawError.includes('duplicate')) {
            errorMsg = "It looks like you're already subscribed to these alerts!";
          } else if (rawError.includes('invalid')) {
            errorMsg = "Please double-check your email address and try again.";
          } else {
            errorMsg = "We couldn't set up your alert right now. Please try again in a moment.";
          }

          errorText.textContent = errorMsg;
          errorBox.classList.remove('gipps-hidden');
          submitBtn.textContent = "Create alert";
          submitBtn.disabled = false;
        }
      } catch (err) {
        errorText.textContent = "Connection error. Please check your internet and try again.";
        errorBox.classList.remove('gipps-hidden');
        submitBtn.textContent = "Create alert";
        submitBtn.disabled = false;
      }
    });
  });
