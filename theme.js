(function () {
    // 1. Check for saved theme preference, default to 'dark' if none
    const savedTheme = localStorage.getItem('theme') || 'dark';

    // 2. Apply theme immediately to prevent flash
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        document.body.classList.remove('dark-mode');
    } else {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    }

    // 3. Create Toggle Button
    function createToggle() {
        // Prevent duplicates
        if (document.getElementById('global-theme-toggle')) return;

        const btn = document.createElement('button');
        btn.id = 'global-theme-toggle';
        btn.setAttribute('aria-label', 'Toggle Dark/Light Mode');
        // Fixed position top-right (matching Kirjavinkit original)
        btn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 1px solid var(--border) !important;
            background: var(--bg) !important;
            color: var(--text) !important;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            z-index: 9999 !important;
            transition: all 0.2s ease;
            margin: 0; /* Reset margins */
            padding: 0; /* Reset padding */
        `;

        // Icons
        const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
        const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

        function updateIcon() {
            const isLight = document.body.classList.contains('light-mode');
            // If light mode (Sun is out), show Moon to switch to dark. If dark mode, show Sun.
            // Wait, usually: Icon represents current state OR target state.
            // Visual standard: Show SUN when in Dark mode (to switch to day), Show MOON when in Light mode.
            btn.innerHTML = isLight ? moonIcon : sunIcon;

            // Adjust button style for visibility
            if (isLight) {
                btn.style.setProperty('background', '#ffffff', 'important');
                btn.style.setProperty('color', '#0f172a', 'important');
                btn.style.setProperty('border-color', '#e2e8f0', 'important');
            } else {
                btn.style.setProperty('background', '#1e293b', 'important'); // Slate 800
                btn.style.setProperty('color', '#fbbf24', 'important'); // Amber
                btn.style.setProperty('border-color', '#334155', 'important');
            }
        }

        updateIcon();

        btn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            document.body.classList.toggle('dark-mode'); // Sync dark class
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            updateIcon();
        });

        document.body.appendChild(btn);
    }

    // Initialize UI when simple DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createToggle);
    } else {
        createToggle();
    }
})();
