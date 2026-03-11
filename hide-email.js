document.addEventListener("DOMContentLoaded", function() {
    const container = document.getElementById('quill-container-with-job-details');
    if (!container) return;

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

    // 1. Clean up existing links first (those already wrapped in <a> tags)
    const links = container.querySelectorAll('a[href^="mailto:"]');
    links.forEach(link => {
        const email = link.href.replace('mailto:', '');
        const span = document.createElement('span');
        span.className = 'reveal-email';
        span.dataset.enc = btoa(email); 
        span.innerHTML = '[Click to reveal email]';
        // Style set to black (#000000)
        span.setAttribute('style', 'color:#000000; cursor:pointer; font-weight:bold; text-decoration:underline;');
        link.parentNode.replaceChild(span, link);
    });

    // 2. Clean up any remaining plain text emails
    container.innerHTML = container.innerHTML.replace(emailRegex, function(match) {
        if (match.includes('data-enc')) return match;
        const encoded = btoa(match);
        return `<span class="reveal-email" data-enc="${encoded}" style="color:#000000; cursor:pointer; font-weight:bold; text-decoration:underline;">[Click to reveal email]</span>`;
    });

    // 3. Handle the click to reveal
    container.addEventListener('click', function(e) {
        const target = e.target.closest('.reveal-email');
        if (target) {
            const decoded = atob(target.dataset.enc);
            const newLink = document.createElement('a');
            newLink.href = 'mailto:' + decoded;
            newLink.textContent = decoded;
            // You can keep the revealed link black, or remove the color line to use your site's default link color
            newLink.style.color = "#000000"; 
            newLink.style.fontWeight = "bold";
            target.parentNode.replaceChild(newLink, target);
        }
    });
});
