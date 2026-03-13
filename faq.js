(function() {
    var FAQ_URL = 'https://cdn.jsdelivr.net/gh/gippslander/assets@main/faq.json?v=2';
    var container = document.getElementById('faqList');
 
    if (!container) return;
 
    var PAGE_TAG = container.getAttribute('data-faq-tag');
 
    if (!PAGE_TAG) return;
 
    fetch(FAQ_URL)
        .then(function(res) { return res.json(); })
        .then(function(data) {
            var faqs = data.faqs.filter(function(faq) {
                return faq.tags.indexOf(PAGE_TAG) !== -1;
            });
 
            container.innerHTML = '';
 
            faqs.forEach(function(faq) {
                var item = document.createElement('div');
                item.className = 'faq-item';
                item.innerHTML =
                    '<button class="faq-question" aria-expanded="false">' +
                        '<span>' + faq.question + '</span>' +
                        '<span class="faq-icon"></span>' +
                    '</button>' +
                    '<div class="faq-answer">' +
                        '<div class="faq-answer-inner">' + faq.answer + '</div>' +
                    '</div>';
                container.appendChild(item);
 
                item.querySelector('.faq-question').addEventListener('click', function() {
                    var isActive = item.classList.contains('active');
 
                    document.querySelectorAll('.faq-item.active').forEach(function(openItem) {
                        openItem.classList.remove('active');
                        openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                    });
 
                    if (!isActive) {
                        item.classList.add('active');
                        this.setAttribute('aria-expanded', 'true');
                    }
                });
            });
 
            // Inject FAQ Schema for SEO
            var schema = {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                'mainEntity': faqs.map(function(faq) {
                    return {
                        '@type': 'Question',
                        'name': faq.question,
                        'acceptedAnswer': {
                            '@type': 'Answer',
                            'text': faq.answer
                        }
                    };
                })
            };
            var script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(schema);
            document.head.appendChild(script);
        })
        .catch(function(err) {
            container.innerHTML =
                '<div class="faq-loading">Unable to load FAQs. Please refresh the page.</div>';
        });
})();
