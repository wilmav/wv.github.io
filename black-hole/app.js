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
    // Swirl particle generation
    function createSwirlParticles() {
        const vortexContainer = document.querySelector('.vortex-container');
        // Clear existing to avoid dupes if called again
        const oldParticles = vortexContainer.querySelectorAll('.swirl-particle');
        oldParticles.forEach(p => p.remove());

        for (let i = 0; i < 60; i++) { // More particles
            const p = document.createElement('div');
            p.className = 'swirl-particle';

            // Randomness
            const size = Math.random() * 3 + 1;
            const orbit = Math.random() * 100 + 130; // Wider valid range
            const duration = Math.random() * 5 + 3; // Slower individual periods
            const delay = Math.random() * -10;
            const opacity = Math.random() * 0.4 + 0.1;

            p.style.width = `${size}px`;
            p.style.height = `${size}px`;
            p.style.background = 'var(--accent)';
            p.style.position = 'absolute';
            p.style.borderRadius = '50%';
            p.style.boxShadow = '0 0 5px var(--accent)';
            p.style.opacity = opacity;

            // CSS Animation via JS
            p.animate([
                { transform: `rotate(0deg) translateX(${orbit}px) rotate(0deg)` },
                { transform: `rotate(360deg) translateX(${orbit * (0.8 + Math.random() * 0.2)}px) rotate(-360deg)` } // Varied end radius
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
            flyingItem.style.opacity = '0';

            // 1. Calculate Vortex Center Dynamically
            // Use the inner .vortex or container to find the true black hole center
            const vortexContainer = document.getElementById('vortex-container');
            const vortexRect = vortexContainer.getBoundingClientRect();
            const vortexCenterX = vortexRect.left + vortexRect.width / 2;
            const vortexCenterY = vortexRect.top + vortexRect.height / 2;

            // 2. Random Start Position
            const side = Math.floor(Math.random() * 3); // 0: Left, 1: Right, 2: Bottom
            let startX, startY;

            if (side === 0) { // Left
                startX = Math.random() * (window.innerWidth * 0.2); // Left 20%
                startY = window.innerHeight * 0.5 + Math.random() * (window.innerHeight * 0.5); // Bottom half
            } else if (side === 1) { // Right
                startX = window.innerWidth * 0.8 + Math.random() * (window.innerWidth * 0.2); // Right 20%
                startY = window.innerHeight * 0.5 + Math.random() * (window.innerHeight * 0.5); // Bottom half
            } else { // Bottom
                startX = Math.random() * window.innerWidth;
                startY = window.innerHeight - Math.random() * 150; // Bottom 150px
            }

            flyingItem.style.left = `${startX}px`;
            flyingItem.style.top = `${startY}px`;

            // Randomize rotation
            const startRotation = (Math.random() - 0.5) * 40; // +/- 20deg
            flyingItem.style.transform = `translate(-50%, -50%) scale(0.9) rotate(${startRotation}deg)`;

            // Set transitions initially to handle the "appear" phase
            flyingItem.style.transition = 'opacity 0.6s ease-out';

            document.body.appendChild(flyingItem);

            // Phase 1: Appear
            requestAnimationFrame(() => {
                flyingItem.getBoundingClientRect(); // reflow
                flyingItem.style.opacity = '1';

                // Phase 2: The Vacuum Flight
                setTimeout(() => {
                    // Define the "Suction" transition curve
                    const flightDuration = 4000;
                    const suctionPhaseDuration = 1500;
                    const delaySuction = flightDuration - suctionPhaseDuration;

                    // Complex transition string
                    flyingItem.style.transition = `
                        top ${flightDuration}ms cubic-bezier(0.55, 0.055, 0.675, 0.19),
                        left ${flightDuration}ms cubic-bezier(0.55, 0.055, 0.675, 0.19),
                        transform ${suctionPhaseDuration}ms cubic-bezier(0.55, 0.085, 0.68, 0.53) ${delaySuction}ms,
                        background-color ${suctionPhaseDuration}ms ease ${delaySuction}ms,
                        color ${suctionPhaseDuration}ms ease ${delaySuction}ms,
                        opacity ${suctionPhaseDuration / 2}ms ease ${flightDuration - 500}ms
                    `;

                    // Target: The Calculated Center
                    flyingItem.style.left = `${vortexCenterX}px`;
                    flyingItem.style.top = `${vortexCenterY}px`;

                    // Target: Shrink and Spin
                    flyingItem.style.transform = 'translate(-50%, -50%) scale(0.0) rotate(720deg)';

                    // Target: Darken
                    flyingItem.style.backgroundColor = '#000';
                    flyingItem.style.color = '#000';
                    flyingItem.style.opacity = '0';

                    // Cleanup
                    setTimeout(() => {
                        flyingItem.remove();
                        resolve();
                    }, flightDuration + 100);
                }, 200); // 200ms delay to ensure user sees it appear
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
