function() {
    const wrapper = document.getElementById('directory-container');
    const targetRegion = wrapper.getAttribute('data-region');
    const root = document.getElementById('town-grid-root');
    const endpoint = "https://api.baseql.com/airtable/graphql/appSZkqeqOYX4mUYb";
    
    // Simple query without API-side filtering to ensure 100% success rate
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
        // If API fails or data is missing, hide the widget
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

        // Generate HTML with SEO support
        root.innerHTML = filtered.map(loc => `
            <a href="${loc.url}" class="town-card" target="_top">
                ${loc.town}
                <span class="seo-text">Jobs</span>
            </a>
        `).join('');
    })
    .catch(() => {
        // Fail silently so the page looks fine if Airtable is down
        wrapper.style.display = 'none';
    });
})();
