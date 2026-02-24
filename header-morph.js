// Scroll Detection & Dropdown Fix for Gippslander Header
(function() {
    function applyHeaderScroll() {
        var header = document.querySelector('header .fixed-top');
        if (!header) return;

        if (window.scrollY > 40) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    }

    window.addEventListener('scroll', applyHeaderScroll, { passive: true });
    setTimeout(applyHeaderScroll, 500); 

    function fixDropdownJumps() {
        var dropdownLinks = document.querySelectorAll('#header1-navbar a[href="#"]');
        dropdownLinks.forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault(); 
            });
        });
    }
    window.addEventListener('DOMContentLoaded', fixDropdownJumps);
    setTimeout(fixDropdownJumps, 1000); 
})();
