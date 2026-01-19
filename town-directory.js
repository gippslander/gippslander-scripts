(function() {
    const wrapper = document.getElementById('directory-container');
    if (!wrapper) return;

    const targetRegion = wrapper.getAttribute('data-region');
    const root = document.getElementById('town-grid-root');
    const endpoint = "https://api.baseql.com/airtable/graphql/appSZkqeqOYX4mUYb";
    
    // Querying all to handle filtering in-browser for better reliability
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
        if (!result?.data?.locations) {
            wrapper.style.display = 'none';
            return;
        }

        const allLocations = result.data.locations;

        // Filter for the region specified in the data-region attribute
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

        // Sort A-Z
        filtered.sort((a, b) => a.town.localeCompare(b.town));

        // Generate HTML with accessible SEO support
        root.innerHTML = filtered.map(loc => `
            <a href="${loc.url}" class="town-card" target="_top">
                ${loc.town}
                <span class="seo-text">Jobs</span>
            </a>
        `).join('');
    })
    .catch(() => {
        wrapper.style.display = 'none';
    });
})();
