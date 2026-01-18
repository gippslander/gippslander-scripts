(function() {
  const ENDPOINT = "https://api.baseql.com/airtable/graphql/appfB7mr9QeUAqsPL";
  const TABLE = "table1";
  let allEvents = [];

  const getVal = (obj, ...keys) => {
    for (let k of keys) if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    return "";
  };

  const createSlug = (title, eventid) => {
    const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `${cleanTitle}-${eventid || '0'}`;
  };

  window.clearFocusMode = function() {
    const url = new URL(window.location);
    url.searchParams.delete('event');
    window.history.pushState({}, '', url);
    
    const focusHeader = document.getElementById('expo-focus-header');
    const filterBar = document.getElementById('expo-filter-bar');
    if (focusHeader) focusHeader.style.display = 'none';
    if (filterBar) filterBar.style.display = 'block';
    
    document.title = "Jobs Expos | Gippslander";
    renderList(allEvents);
  };

  function injectGoogleSchema(events) {
    document.querySelectorAll('.gipps-dynamic-schema').forEach(el => el.remove());
    const confirmed = events.filter(e => getVal(e, 'status', 'Status').toLowerCase() === 'confirmed');
    const baseUrl = window.location.origin + window.location.pathname;

    const eventSchema = confirmed.map(event => {
      const slug = createSlug(getVal(event, 'title', 'Title'), getVal(event, 'eventid'));
      const sDate = getVal(event, 'seoDate', 'seo_date') || getVal(event, 'displayDate', 'display_date');
      return {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": getVal(event, 'title', 'Title'),
        "startDate": sDate,
        "endDate": sDate,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "description": getVal(event, 'description', 'Description'),
        "url": `${baseUrl}?event=${slug}`,
        "location": {
          "@type": "Place",
          "name": getVal(event, 'venueName', 'venue_name') || "Gippsland Venue",
          "address": { "@type": "PostalAddress", "streetAddress": getVal(event, 'venueAddress', 'venue_address'), "addressRegion": "VIC", "addressCountry": "AU" }
        },
        "offers": { "@type": "Offer", "url": `${baseUrl}?event=${slug}`, "price": "0", "priceCurrency": "AUD", "availability": "https://schema.org/InStock" },
        "performer": { "@type": "Organization", "name": getVal(event, 'organizer', 'Organizer') },
        "image": [getVal(event, 'image', 'Image')],
        "organizer": { "@type": "Organization", "name": getVal(event, 'organizer', 'Organizer'), "url": "https://gippslander.com.au" }
      };
    });

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.className = 'gipps-dynamic-schema';
    script.text = JSON.stringify(eventSchema);
    document.head.appendChild(script);
  }

  function handleDeepLink(events) {
    const targetSlug = new URLSearchParams(window.location.search).get('event');
    if (targetSlug) {
      const target = events.find(e => createSlug(getVal(e, 'title', 'Title'), getVal(e, 'eventid')) === targetSlug);
      if (target) {
        renderList([target]);
        const focusHeader = document.getElementById('expo-focus-header');
        const filterBar = document.getElementById('expo-filter-bar');
        if (focusHeader) focusHeader.style.display = 'block';
        if (filterBar) filterBar.style.display = 'none';
        document.title = `${getVal(target, 'title', 'Title')} | Gippslander`;
        
        setTimeout(() => {
          const el = document.querySelector(`[data-event-slug="${targetSlug}"]`);
          if (el) el.classList.add('active');
        }, 100);
        return;
      }
    }
    renderList(events);
    const filterBar = document.getElementById('expo-filter-bar');
    if (filterBar) filterBar.style.display = 'block';
  }

  window.copyEventLink = function(btn, slug) {
    const url = `${window.location.origin}${window.location.pathname}?event=${slug}`;
    const oldText = btn.innerText;
    navigator.clipboard.writeText(url).then(() => {
      btn.innerText = "Copied";
      btn.classList.add('copied');
      setTimeout(() => { btn.innerText = oldText; btn.classList.remove('copied'); }, 2000);
    });
  };

  function renderList(events) {
    const container = document.getElementById('expo-list-target');
    if (!container) return;
    if (!events.length) {
      container.innerHTML = "<p>No upcoming events found for this selection.</p>";
      return;
    }
    
    container.innerHTML = events.map(event => {
      const statusRaw = getVal(event, 'status', 'Status').toLowerCase();
      const isConfirmed = statusRaw === 'confirmed';
      const d = new Date(getVal(event, 'displayDate', 'display_date'));
      const friendlyDate = isNaN(d) ? 'Date TBA' : d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
      const slug = createSlug(getVal(event, 'title', 'Title'), getVal(event, 'eventid'));
      const imgUrl = getVal(event, 'image', 'Image');

      return `
        <div class="expo-item ${isConfirmed ? 'confirmed' : 'tba'}" data-event-slug="${slug}" onclick="this.classList.toggle('active')">
          <div class="expo-bar">
            ${imgUrl ? `<img src="${imgUrl}" class="expo-img" alt="logo">` : ''}
            <div class="expo-date-pill">${isConfirmed ? friendlyDate : 'Coming soon'}</div>
            <div class="expo-content">
              <div class="expo-title">${getVal(event, 'title', 'Title')}</div>
              <div class="expo-meta">${getVal(event, 'organizer', 'Organizer')} • ${getVal(event, 'region', 'Region')}</div>
            </div>
            <a href="${getVal(event, 'linkUrl', 'link_url') || '#'}" class="expo-btn" onclick="event.stopPropagation()" ${isConfirmed ? 'target="_blank"' : ''}>
              ${isConfirmed ? 'Visit website' : 'Coming soon'}
            </a>
          </div>
          <div class="expo-drawer">
            <div class="drawer-inner">
              <strong>About:</strong><br>${getVal(event, 'description', 'Description') || 'Details are being finalized.'}
              <div class="drawer-actions">
                ${isConfirmed && getVal(event, 'venueAddress') ? `
                  <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getVal(event, 'venueAddress'))}" target="_blank" class="action-btn map-btn" onclick="event.stopPropagation()">View map</a>
                ` : ''}
                <button class="action-btn" onclick="event.stopPropagation(); copyEventLink(this, '${slug}')">Copy link</button>
              </div>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  window.filterEvents = function() {
    const filterEl = document.getElementById('region-filter');
    if (!filterEl) return;
    const val = filterEl.value;
    renderList(val === 'all' ? allEvents : allEvents.filter(e => getVal(e, 'region', 'Region') === val));
  };

  // Initialization
  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: `{ ${TABLE} { id eventid title organizer displayDate seoDate status region image description linkUrl venueAddress venueName } }` })
  })
  .then(res => res.json())
  .then(json => {
    allEvents = json.data[TABLE] || [];
    if (allEvents.length > 0) {
      injectGoogleSchema(allEvents);
      handleDeepLink(allEvents);
      
      const regions = [...new Set(allEvents.map(e => getVal(e, 'region', 'Region')).filter(Boolean))].sort();
      const select = document.getElementById('region-filter');
      if (select) {
        regions.forEach(r => { select.innerHTML += `<option value="${r}">${r}</option>`; });
      }
    }
  }).catch(err => {
    const target = document.getElementById('expo-list-target');
    if (target) target.innerHTML = "Error loading events. Please try again later.";
    console.error("Gipps Expo Error:", err);
  });
})();
