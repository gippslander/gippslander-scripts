/**
 * Gippslander Trending Pills Logic
 * Optimized for performance and layout stability.
 */
(function() {
  const SEARCH_KEY = 'gippslander_saved_searches';
  const JOBS_KEY = 'gippslander_saved_jobs';
  const CACHE_KEY = 'gippslander_trending_cache';
  const MAX_PILLS = 4;
  let trendingCache = [];

  const FALLBACK_TAGS = [
    { label: 'Traralgon', href: '/jobs/in-traralgon-victoria-australia', type: 'loc', weight: 10 },
    { label: 'Warragul', href: '/jobs/in-warragul-victoria-australia', type: 'loc', weight: 9 },
    { label: 'Inverloch', href: '/jobs/in-inverloch-victoria-australia', type: 'loc', weight: 8 },
    { label: 'Retail', href: '/jobs?q=Retail', type: 'work', weight: 7 }
  ];

  const ICONS = {
    star: `<svg aria-hidden="true" style="color:#f59e0b" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`,
    history: `<svg aria-hidden="true" style="color:#6b7280" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
    bookmark: `<svg aria-hidden="true" style="color:#4caf50" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>`,
    pin: `<svg aria-hidden="true" style="color:#e11d48" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><circle cx="12" cy="11" r="3"/></svg>`,
    briefcase: `<svg aria-hidden="true" style="color:#2563eb" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`,
    sparkle: `<svg aria-hidden="true" style="color:#d97706" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>`
  };

  function getWeightedSelection(arr, count) {
    const seed = new Date().setHours(0,0,0,0);
    let tempArr = [...arr];
    let selected = [];
    const seededRandom = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };

    for (let i = 0; i < count && tempArr.length > 0; i++) {
      const totalWeight = tempArr.reduce((sum, item) => sum + (Number(item.weight) || 1), 0);
      let r = seededRandom(seed + i) * totalWeight;
      for (let j = 0; j < tempArr.length; j++) {
        r -= (Number(tempArr[j].weight) || 1);
        if (r <= 0) {
          selected.push(tempArr.splice(j, 1)[0]);
          break;
        }
      }
    }
    return selected;
  }

  window.renderTags = function(data = []) {
    const listEl = document.getElementById('popular-list');
    if (!listEl) return;

    const history = JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]").sort((a,b) => (b.isPinned - a.isPinned) || (b.lastUsed - a.lastUsed));
    const savedJobs = JSON.parse(localStorage.getItem(JOBS_KEY) || "[]");

    let pills = [];
    history.slice(0, 3).forEach(i => pills.push({ ...i, label: i.title, href: i.url, type: i.isPinned ? 'star' : 'history', isPers: true }));
    if (savedJobs.length > 0 && pills.length < MAX_PILLS) pills.push({ label: `Saved jobs (${savedJobs.length})`, href: '/my?tab=jobs', type: 'bookmark', isPers: true });

    const remaining = MAX_PILLS - pills.length;
    if (remaining > 0) {
      getWeightedSelection(data.length ? data : FALLBACK_TAGS, remaining).forEach(t => pills.push({ ...t, isPers: false }));
    }

    const fragment = document.createDocumentFragment();
    pills.forEach(p => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = p.isPers ? 'pill pill-personal' : 'pill';
      a.href = p.href;
      const iconKey = p.type === 'loc' ? 'pin' : (p.type === 'work' ? 'briefcase' : p.type);
      a.innerHTML = `${ICONS[iconKey] || ICONS.sparkle}<span>${p.label}</span>${(p.isPers && p.type !== 'bookmark') ? `<button class="pill-delete" data-url="${p.href}">✕</button>` : ''}`;
      li.appendChild(a);
      fragment.appendChild(li);
    });

    listEl.innerHTML = '';
    listEl.appendChild(fragment);
  };

  // EXECUTION FLOW
  const run = () => {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      trendingCache = JSON.parse(cached);
      window.renderTags(trendingCache);
    } else {
      window.renderTags([]);
    }

    fetch("https://api.baseql.com/airtable/graphql/appTMeaoWv5aUSBVp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `{ tags { label url type weight } }` })
    })
    .then(res => res.json())
    .then(result => {
      if (result.data?.tags?.length > 0) {
        trendingCache = result.data.tags.map(t => ({ label: t.label, href: t.url, type: t.type, weight: t.weight }));
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(trendingCache));
        window.renderTags(trendingCache);
      }
    }).catch(() => { if(!cached) window.renderTags(FALLBACK_TAGS); });
  };

  // Ensure DOM is ready before running
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.pill-delete');
    if (btn) {
      e.preventDefault();
      const url = btn.dataset.url;
      let h = JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]");
      localStorage.setItem(SEARCH_KEY, JSON.stringify(h.filter(i => i.url !== url)));
      window.renderTags(trendingCache);
    }
  });
})();
