(function() {
    const BASEQL_URL = 'https://api.baseql.com/airtable/graphql/appaTcwUeox93i9Su';
    let partnerData = [];
    let selectedRegions = [];

    async function initPromoWidget() {
        const gridContainer = document.getElementById('promo-grid-container');
        if (!gridContainer) return;

        try {
            const response = await fetch(BASEQL_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `{ partners { partner region domain active image description } }`
                }),
            });
            const json = await response.json();
            partnerData = json.data.partners.filter(p => p.active);
            renderPromoGrid();
        } catch (err) { 
            console.error("Promo Widget Error:", err); 
        }
    }

    window.renderPromoGrid = function() {
        const container = document.getElementById('promo-grid-container');
        if (!container) return;

        const filtered = (selectedRegions.length === 0) 
            ? partnerData 
            : partnerData.filter(p => p.region && (p.region.some(r => selectedRegions.includes(r)) || p.region.length >= 6));

        container.innerHTML = filtered.map((p, index) => `
            <div class="promo-card" 
                 style="animation-delay: ${index * 0.05}s"
                 onclick="openPromoModal('${p.partner.replace(/'/g, "\\'")}')">
              <div class="promo-img-wrapper">
                <img src="${p.image}" alt="${p.partner}">
              </div>
              <span>${p.partner}</span>
            </div>
        `).join('');

        setupScrollObserver();
    };

    function setupScrollObserver() {
        const observerOptions = { threshold: 0.15 };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.promo-card').forEach(card => observer.observe(card));
    }

    window.toggleRegion = function(btn) {
        const region = btn.getAttribute('data-region');
        if (selectedRegions.includes(region)) {
            selectedRegions = selectedRegions.filter(r => r !== region);
            btn.classList.remove('active');
        } else {
            selectedRegions.push(region);
            btn.classList.add('active');
        }
        renderPromoGrid();
    };

    window.openPromoModal = function(name) {
        const p = partnerData.find(item => item.partner === name);
        if (!p) return;
        
        const modalImg = document.getElementById('promo-modal-img');
        const modalName = document.getElementById('promo-modal-name');
        const modalBody = document.getElementById('promo-modal-body');
        const overlay = document.getElementById('promo-modal-overlay');

        if (modalImg) modalImg.src = p.image;
        if (modalName) modalName.innerText = p.partner;
        if (modalBody) {
            modalBody.innerHTML = `<p>${p.description || "Promoting your job vacancy to a highly engaged local audience in the Gippsland region."}</p>`;
        }
        if (overlay) overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };

    window.closePromoModal = function() {
        const overlay = document.getElementById('promo-modal-overlay');
        if (overlay) overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    };

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePromoModal();
    });

    initPromoWidget();
})();
