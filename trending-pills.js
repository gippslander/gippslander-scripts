document.addEventListener('DOMContentLoaded', function() {
  const SEARCH_KEY = 'gippslander_saved_searches';
  const JOBS_KEY = 'gippslander_saved_jobs';
  let trendingCache = [];
  let apiCalled = false;

  // Optimized Fallbacks (Always Free)
  const FALLBACK_TAGS = [
    { label: 'Sale', href: '/jobs/in-sale-victoria-australia', type: 'loc', weight: 10 },
    { label: 'Traralgon', href: '/jobs/in-traralgon-victoria-australia', type: 'loc', weight: 9 },
    { label: 'Warragul', href: '/jobs/in-warragul-victoria-australia', type: 'loc', weight: 8 },
    { label: 'Inverloch', href: '/jobs/in-inverloch-victoria-australia', type: 'loc', weight: 7 },
    { label: 'Retail', href: '/jobs?q=Retail', type: 'work', weight: 6 }
  ];

  const ICONS = {
    star: `<svg style="color:#f59e0b" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    history: `<svg style="color:#6b7280" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    bookmark: `<svg style="color:#4caf50" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>`,
    pin: `<svg style="color:#e11d48" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>`,
    briefcase: `<svg style="color:#2563eb" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    sparkle: `<svg style="color:#d97706" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>`
  };

  function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function getWeightedRandomDaily(arr, count) {
    let selected = [];
    let tempArr = [...arr];
    if (tempArr.length === 0) return [];
    const today = new Date();
    let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    for (let i = 0; i < count; i++) {
      if (tempArr.length === 0) break;
      const totalWeight = tempArr.reduce((sum, item) => sum + (Number(item.weight) || 1), 0);
      let randomVal = seededRandom(seed + i) * totalWeight; 
      for (let j = 0; j < tempArr.length; j++) {
        const itemWeight = Number(tempArr[j].weight) || 1;
        randomVal -= itemWeight;
        if (randomVal <= 0) {
          selected.push(tempArr.splice(j, 1)[0]);
          break;
        }
      }
    }
    return selected;
  }

  function addPill(container, href, label, type, isPers) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = isPers ? 'pill pill-personal' : 'pill';
    a.href = href;
    let icon = ICONS[type] || ICONS.sparkle;
    if (type === 'loc') icon = ICONS.pin;
    if (type === 'work') icon = ICONS.briefcase;
    let content = `${icon}<span>${label}</span>`;
    if (isPers && type !== 'bookmark') {
      content += `<button class="pill-delete" onclick="deleteSearchTag(event, '${href}')" title="Remove">✕</button>`;
    }
    a.innerHTML = content;
    li.appendChild(a);
    container.appendChild(li);
  }

  window.renderTags = function(trendingData = []) {
    const listEl = document.getElementById('popular-list');
    if (!listEl) return 0;
    
    const savedJobs = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");
    const history = JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]");
    const sorted = [...history].sort((a,b) => (b.isPinned - a.isPinned) || (b.lastUsed - a.lastUsed));

    listEl.innerHTML = ''; 
    let count = 0;

    // 1. Personal History (Max 3)
    for (let i = 0; i < sorted.length && count < 3; i++) {
      addPill(listEl, sorted[i].url, sorted[i].title, sorted[i].isPinned ? 'star' : 'history', true);
      count++;
    }

    // 2. Saved Jobs Link (Max 1)
    if (savedJobs.length > 0 && count < 4) {
      addPill(listEl, '/my?tab=jobs', `Saved jobs (${savedJobs.length})`, 'bookmark', true);
      count++;
    }
    
    // 3. Filler logic
    const remainingSlots = 4 - count;
    if (remainingSlots > 0) {
      if (trendingData.length > 0) {
        const selection = getWeightedRandomDaily(trendingData, remainingSlots);
        selection.forEach(t => addPill(listEl, t.href, t.label, t.type, false));
        count += selection.length;
      }
    }
    return count;
  };

  // --- INITIAL EXECUTION ---
  const initialCount = renderTags([]);

  if (initialCount < 4 && !apiCalled) {
    apiCalled = true;
    fetch("https://api.baseql.com/airtable/graphql/appTMeaoWv5aUSBVp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `{ tags { label url type weight } }` })
    })
    .then(res => res.json())
    .then(result => {
      if (result.data && result.data.tags && result.data.tags.length > 0) {
        trendingCache = result.data.tags.map(t => ({ 
          label: t.label, href: t.url, type: t.type, weight: t.weight 
        }));
        renderTags(trendingCache);
      } else {
        renderTags(FALLBACK_TAGS);
      }
    })
    .catch(() => renderTags(FALLBACK_TAGS));
  }

  window.deleteSearchTag = function(e, url) {
    e.preventDefault(); e.stopPropagation();
    let history = JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]");
    history = history.filter(item => item.url !== url);
    localStorage.setItem(SEARCH_KEY, JSON.stringify(history));
    renderTags(trendingCache.length > 0 ? trendingCache : FALLBACK_TAGS); 
  };
});
