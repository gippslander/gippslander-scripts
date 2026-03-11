/**
 * Gippslander Internal Linking Script
 * Optimized for SEO & Performance
 */
async function linkifyText(selector, jsonUrl) {
    try {
        // Fetch JSON with a timestamp to bypass CDN cache for instant updates
        const response = await fetch(jsonUrl + '?v=' + Date.now());
        const rawData = await response.json();

        // 1. Auto-inject CSS for the bold/underlined links if not already present
        if (!document.getElementById('gipps-link-style')) {
            const style = document.createElement('style');
            style.id = 'gipps-link-style';
            style.textContent = `
                .gipps-auto-link { 
                    font-weight: bold; 
                    text-decoration: underline; 
                    color: inherit; 
                    transition: opacity 0.2s; 
                }
                .gipps-auto-link:hover { 
                    text-decoration: none; 
                    opacity: 0.7; 
                }
            `;
            document.head.appendChild(style);
        }

        const containers = document.querySelectorAll(selector);
        if (containers.length === 0) return;

        const currentPath = window.location.pathname.replace(/\/$/, '');
        const linkedUrls = new Set();
        
        // 2. Flatten the JSON (URL -> Array) into a sortable list
        let flatMap = [];
        for (const [url, terms] of Object.entries(rawData)) {
            // Ignore notes/comments starting with underscore
            if (url.startsWith('_')) continue;

            // Figure out the path to prevent self-linking
            const targetPath = new URL(url, window.location.origin).pathname.replace(/\/$/, '');
            if (targetPath === currentPath) continue;

            // Ensure terms is always an array
            const termList = Array.isArray(terms) ? terms : [terms];
            termList.forEach(term => {
                flatMap.push({ term: term.trim(), url: url.trim() });
            });
        }

        // 3. Sort by length (longest phrases first) to prevent 'Wonthaggi' breaking 'Wonthaggi North'
        flatMap.sort((a, b) => b.term.length - a.term.length);

        const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        containers.forEach(container => {
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
            const nodesToProcess = [];
            let node;
            while (node = walker.nextNode()) {
                const parent = node.parentElement;
                // Avoid links, scripts, styles, and headers
                if (parent && !parent.closest('a, script, style, h1, h2, h3')) {
                    nodesToProcess.push(node);
                }
            }

            nodesToProcess.forEach(textNode => {
                let text = textNode.nodeValue;
                
                // Filter only for URLs that haven't been linked on this page yet
                const activeMap = flatMap.filter(item => !linkedUrls.has(item.url));
                if (activeMap.length === 0) return;

                // Create Master Regex for this specific text node
                const pattern = activeMap.map(i => escapeRegExp(i.term)).join('|');
                const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

                if (regex.test(text)) {
                    let replacedAny = false;
                    const newHtml = text.replace(regex, (match) => {
                        // Find which keyword matched
                        const hit = activeMap.find(i => i.term.toLowerCase() === match.toLowerCase());
                        
                        // Safety check: skip if URL already linked elsewhere on page
                        if (!hit || linkedUrls.has(hit.url)) return match;

                        linkedUrls.add(hit.url);
                        replacedAny = true;
                        return `<a href="${hit.url}" class="gipps-auto-link">${match}</a>`;
                    });

                    if (replacedAny) {
                        const span = document.createElement('span');
                        span.innerHTML = newHtml;
                        textNode.parentNode.replaceChild(span, textNode);
                    }
                }
            });
        });
    } catch (e) { 
        console.error("Gippslander Linkify Error:", e); 
    }
}

// 4. Initialize for your specific containers
document.addEventListener('DOMContentLoaded', () => {
    linkifyText(
        '#about-content, .blog-post-details-content', 
        'https://cdn.jsdelivr.net/gh/gippslander/assets@main/links.json'
    );
});
