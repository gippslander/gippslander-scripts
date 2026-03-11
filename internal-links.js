async function linkifyText(selector, jsonUrl) {
    try {
        const response = await fetch(jsonUrl);
        const linkMap = await response.json();

        const containers = document.querySelectorAll(selector);
        if (containers.length === 0) return;

        // NEW: Figure out what page we are currently on (ignoring trailing slashes)
        const currentPath = window.location.pathname.replace(/\/$/, '');

        // NEW: Filter out any keywords that point to the page we are already on
        const validKeywords = Object.keys(linkMap).filter(keyword => {
            const targetUrl = linkMap[keyword];
            // Safely check the target path, whether you used a full URL or a relative one in your JSON
            const targetPath = new URL(targetUrl, window.location.origin).pathname.replace(/\/$/, '');
            return targetPath !== currentPath && targetPath !== ''; 
        });

        // Sort keywords longest to shortest
        const keywords = validKeywords.sort((a, b) => b.length - a.length);
        
        // Track the URL so we only link to each page once
        const linkedUrls = new Set(); 
        const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        containers.forEach(container => {
            const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
            const nodesToProcess = [];

            let node;
            while (node = walker.nextNode()) {
                const parentElement = node.parentElement;
                if (parentElement && !parentElement.closest('a, script, style, h1, h2, h3')) {
                    nodesToProcess.push(node);
                }
            }

            nodesToProcess.forEach(textNode => {
                let text = textNode.nodeValue;
                
                // Only look for keywords whose destination URL hasn't been used yet
                const activeKeywords = keywords.filter(k => !linkedUrls.has(linkMap[k]));
                if (activeKeywords.length === 0) return;

                const pattern = activeKeywords.map(escapeRegExp).join('|');
                const regex = new RegExp(`\\b(${pattern})\\b`, 'gi');

                if (regex.test(text)) {
                    let replacedAny = false;

                    const newHtml = text.replace(regex, (match) => {
                        const matchedKeyword = activeKeywords.find(k => k.toLowerCase() === match.toLowerCase());
                        
                        if (!matchedKeyword || linkedUrls.has(linkMap[matchedKeyword])) {
                            return match; 
                        }

                        linkedUrls.add(linkMap[matchedKeyword]);
                        replacedAny = true;
                        return `<a href="${linkMap[matchedKeyword]}" class="gipps-auto-link">${match}</a>`;                    });

                    if (replacedAny) {
                        const span = document.createElement('span');
                        span.innerHTML = newHtml;
                        textNode.parentNode.replaceChild(span, textNode);
                    }
                }
            });
        });

    } catch (error) {
        console.error("Error generating internal links:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    linkifyText('#about-content, .blog-post-details-content', 'https://cdn.jsdelivr.net/gh/gippslander/assets@main/links.json'); 
});
