(function() {
    const wrapper = document.getElementById('directory-container');
    if (!wrapper) return;

    const region = wrapper.getAttribute('data-region');
    const endpoint = "https://api.baseql.com/airtable/graphql/appSZkqeqOYX4mUYb";
    
    // GraphQL query with server-side filtering
    const query = `{
      locations(filter: "{region} = '${region}'") {
        town
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
        const root = document.getElementById('town-grid-root');
        const data = result?.data?.locations;

        if (!data || data.length === 0) {
            wrapper.style.display = 'none';
            return;
        }

        // Sort alphabetically
        data.sort((a, b) => a.town.localeCompare(b.town));

        const fragment = document.createDocumentFragment();
        data.forEach(loc => {
            const a = document.createElement('a');
            a.href = loc.url;
            a.className = 'town-card';
            a.target = '_top';
            // Hidden text for SEO benefit
            a.innerHTML = `${loc.town}<span style="font-size:0; color:transparent;"> Jobs</span>`;
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
