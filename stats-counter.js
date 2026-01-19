(function() {
    const initStats = () => {
        const statsSection = document.querySelector("#stats-section");
        const valueDisplays = document.querySelectorAll(".stat-number-clean");
        if (!statsSection || valueDisplays.length === 0) return;

        const totalDuration = 2000; // 2 seconds

        const startCounter = (el) => {
            let startValue = 0;
            const endValue = parseInt(el.getAttribute("data-val"));
            if (isNaN(endValue)) return;

            // Calculate step time to ensure all counters finish at roughly the same time
            const stepTime = Math.max(Math.floor(totalDuration / endValue), 20);
            
            const counter = setInterval(function () {
                startValue += Math.ceil(endValue / 100); // Increment proportionally for smoother animation on large numbers
                if (startValue >= endValue) {
                    startValue = endValue; // Snap to final value
                    clearInterval(counter);
                }

                // Formatting logic based on the data-val
                if (endValue === 12) {
                    el.textContent = startValue + "k+";
                } else if (endValue === 450) {
                    el.textContent = startValue + "+";
                } else if (endValue === 100) {
                    el.textContent = startValue + "%";
                } else {
                    el.textContent = startValue;
                }
            }, stepTime);
        };

        const observerOptions = {
            root: null,
            threshold: 0.3 
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    valueDisplays.forEach((display) => startCounter(display));
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        observer.observe(statsSection);
    };

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStats);
    } else {
        initStats();
    }
})();
