document.addEventListener('DOMContentLoaded', () => {
    const noteList = document.getElementById('note-list');
    const addLineBtn = document.getElementById('add-line-btn');
    const absorbBtn = document.getElementById('absorb-btn');
    const inputContainer = document.getElementById('input-container');
    const vortexContainer = document.getElementById('vortex-container');
    const sunnyContent = document.getElementById('sunny-content');
    const startOverBtn = document.getElementById('start-over-btn');
    const body = document.body;

    // Add new line functionality
    addLineBtn.addEventListener('click', () => {
        const item = document.createElement('div');
        item.className = 'note-item';
        item.innerHTML = `
            <input type="text" class="note-input" placeholder="Enter another thought...">
            <button class="remove-btn">&times;</button>
        `;

        // Focus new input
        const input = item.querySelector('.note-input');

        // Remove functionality for new item
        item.querySelector('.remove-btn').addEventListener('click', () => item.remove());

        noteList.appendChild(item);
        input.focus();
    });

    // Swirl particle generation
    function createSwirlParticles() {
        const vortexContainer = document.querySelector('.vortex-container');
        for (let i = 0; i < 40; i++) {
            const p = document.createElement('div');
            p.className = 'swirl-particle';
            const size = Math.random() * 3 + 1;
            const orbit = Math.random() * 80 + 140; // Relative to center
            const duration = Math.random() * 3 + 2;
            const delay = Math.random() * -5;

            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.background = 'var(--accent)';
            p.style.position = 'absolute';
            p.style.borderRadius = '50%';
            p.style.boxShadow = '0 0 5px var(--accent)';
            p.style.opacity = Math.random() * 0.5 + 0.3;

            // CSS Animation via JS
            p.animate([
                { transform: `rotate(0deg) translateX(${orbit}px) rotate(0deg)` },
                { transform: `rotate(360deg) translateX(${orbit * 0.8}px) rotate(-360deg)` }
            ], {
                duration: duration * 1000,
                iterations: Infinity,
                delay: delay * 1000,
                easing: 'linear'
            });

            vortexContainer.appendChild(p);
        }
    }

    createSwirlParticles();

    // Cloud generation for realistic sky
    function createClouds() {
        const sky = document.getElementById('sky-background');
        // Do not clear the overlay
        const clouds = sky.querySelectorAll('.cloud');
        clouds.forEach(c => c.remove());

        for (let i = 0; i < 15; i++) { // More clouds
            const cloud = document.createElement('div');
            cloud.className = 'cloud';
            const size = Math.random() * 300 + 200; // Larger clouds
            const top = Math.random() * 100; // Full spread
            const duration = Math.random() * 100 + 100; // Very slow: 100-200s
            const delay = Math.random() * -200;
            const opacity = Math.random() * 0.3 + 0.2;

            cloud.style.width = `${size}px`;
            cloud.style.height = `${size * 0.4}px`;
            cloud.style.top = `${top}%`;
            cloud.style.opacity = opacity;
            cloud.style.setProperty('--duration', `${duration}s`);
            cloud.style.animationDelay = `${delay}s`;

            sky.appendChild(cloud);
        }
    }

    // Absorption logic
    absorbBtn.addEventListener('click', async () => {
        const items = Array.from(document.querySelectorAll('.note-item'));
        const texts = items.map(item => item.querySelector('.note-input').value.trim()).filter(v => v !== '');

        if (texts.length === 0) {
            alert('Write something down first.');
            return;
        }

        // Disable button to prevent double clicks
        absorbBtn.disabled = true;
        absorbBtn.style.opacity = '0.5';

        // Hide input UI smoothly
        inputContainer.style.opacity = '0';
        inputContainer.style.transform = 'translateY(30px)';

        // Wait a moment for the fade out
        await new Promise(r => setTimeout(r, 600));
        inputContainer.style.visibility = 'hidden';

        // Sequence absorption - ONE BY ONE
        for (let i = 0; i < texts.length; i++) {
            await absorbItem(texts[i]);
        }

        // Final transition
        setTimeout(() => {
            transitionToSunny();
        }, 1200);
    });

    function absorbItem(text) {
        return new Promise(resolve => {
            const flyingItem = document.createElement('div');
            flyingItem.className = 'flying-item';
            flyingItem.textContent = text;

            // Start from the position of the input container area
            // Randomize slightly so they don't all look identical
            const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 50;
            const startY = window.innerHeight - 200;

            flyingItem.style.left = `${startX}px`;
            flyingItem.style.top = `${startY}px`;
            flyingItem.style.transform = 'translate(-50%, -50%) scale(0.9) rotate(-2deg)';
            flyingItem.style.opacity = '0';
            flyingItem.style.transition = 'all 2.5s ease-in-out'; // Controls the flight to center

            document.body.appendChild(flyingItem);

            // Phase 1: Appear and Float to Center
            requestAnimationFrame(() => {
                // Trigger reflow
                flyingItem.getBoundingClientRect();

                flyingItem.style.opacity = '1';
                flyingItem.style.left = `${window.innerWidth / 2}px`;
                flyingItem.style.top = `${window.innerHeight / 2}px`;
                flyingItem.style.transform = 'translate(-50%, -50%) scale(1) rotate(5deg)';

                // Phase 2: Suck into Void
                setTimeout(() => {
                    // Change transition for the suck phase to be faster/different if needed, 
                    // or keep it smooth. Let's make the suck-in separate.
                    flyingItem.style.transition = 'all 1.5s cubic-bezier(0.55, 0.085, 0.68, 0.53)';

                    flyingItem.style.transform = 'translate(-50%, -50%) scale(0.0) rotate(720deg)';
                    flyingItem.style.opacity = '0';

                    setTimeout(() => {
                        flyingItem.remove();
                        resolve();
                    }, 1600);
                }, 2600); // 2.5s flight + small buffer
            });
        });
    }

    function transitionToSunny() {
        createClouds();
        body.classList.add('sunny');
        const sky = document.getElementById('sky-background');
        sky.style.opacity = '1';

        vortexContainer.style.transition = 'opacity 3s ease';
        vortexContainer.style.opacity = '0';

        setTimeout(() => {
            vortexContainer.style.display = 'none';
            sunnyContent.style.display = 'flex';

            requestAnimationFrame(() => {
                sunnyContent.style.opacity = '1';
            });
        }, 3000);
    }

    // Start Over
    startOverBtn.addEventListener('click', () => {
        // Quickly fade out sunny content
        sunnyContent.style.opacity = '0';

        setTimeout(() => {
            sunnyContent.style.display = 'none';
            body.classList.remove('sunny');

            // Reset Sky
            const sky = document.getElementById('sky-background');
            sky.style.opacity = '0';

            // Reset Vortex
            // To ensure animation doesn't get stuck in a "fading out" state if user clicks fast,
            // we remove the transition property momentarily.
            vortexContainer.style.display = 'flex';
            vortexContainer.style.transition = 'none';
            vortexContainer.style.opacity = '0';

            // Force reflow
            vortexContainer.getBoundingClientRect();

            vortexContainer.style.transition = 'opacity 2s ease';
            vortexContainer.style.opacity = '1';

            // Reset Button
            absorbBtn.disabled = false;
            absorbBtn.style.opacity = '1';

            // Reset Input Container
            inputContainer.style.display = 'flex';
            inputContainer.style.visibility = 'visible';
            inputContainer.style.opacity = '0';
            inputContainer.style.transform = 'translateY(30px)';

            setTimeout(() => {
                inputContainer.style.transition = 'opacity 1s ease, transform 1s ease';
                inputContainer.style.opacity = '1';
                inputContainer.style.transform = 'translateY(0)';

                // Reset list to one item
                noteList.innerHTML = `
                    <div class="note-item">
                        <input type="text" class="note-input" placeholder="Enter a thought...">
                        <button class="remove-btn">&times;</button>
                    </div>
                `;

                // Re-bind remove listener
                noteList.querySelector('.remove-btn').addEventListener('click', (e) => {
                    e.target.parentElement.remove();
                });
            }, 100);

        }, 500); // Wait for sunny content to fade out slightly
    });
});
