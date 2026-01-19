(function() {
    const wrapper = document.getElementById('directory-container');
    if (!wrapper) return;

    const targetRegion = wrapper.getAttribute('data-region');
    const root = document.getElementById('town-grid-root');
    const endpoint = "https://api.baseql.com/airtable/graphql/appSZkqeqOYX4mUYb";
    
    const query = `{
      locations {
        town
        region
        url
      }
    }`;

    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    })
    .then(res => res.json())
    .then(result => {
        const allLocations = result?.data?.locations;

        if (!allLocations) {
            wrapper.style.display = 'none';
            return;
        }

        // FILTER: Client-side filtering is more stable for Airtable multi-select fields
        const filtered = allLocations.filter(loc => {
            return loc.region && 
                   loc.region.includes(targetRegion) && 
                   loc.town && 
                   loc.url;
        });

        if (filtered.length === 0) {
            wrapper.style.display = 'none';
            return;
        }

        // SORT: Alphabetical A-Z
        filtered.sort((a, b) => a.town.localeCompare(b.town));

        // RENDER: Use DocumentFragment to minimize browser "reflow" (faster painting)
        const fragment = document.createDocumentFragment();
        filtered.forEach(loc => {
            const a = document.createElement('a');
            a.href = loc.url;
            a.className = 'town-card';
            a.target = '_top';
            // SEO: Adds "Jobs" for crawlers without cluttering the UI
            a.innerHTML = `${loc.town}<span class="seo-text"> Jobs</span>`;
            fragment.appendChild(a);
        });

        root.innerHTML = '';
        root.appendChild(fragment);
    })
    .catch(err => {
        console.error("Directory Error:", err);
        wrapper.style.display = 'none';
    });
})();
