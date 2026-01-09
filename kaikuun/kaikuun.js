// Kaikuun Prototype Logic
// Simulated data for Plan 1 (Vibe coding)

const DATA = {
    topic: "Tekoäly ja tulevaisuuden työelämä",
    description: "Kaikuun on alusta, jolla etsitään yhteistä näkemystä vaikeisiin kysymyksiin. Äänestä väitteitä ja tutustu lähteisiin.",
    statements: [
        {
            id: 1,
            text: "Tekoäly tulee korvaamaan suuren osan nykyisistä asiantuntijatehtävistä seuraavan 10 vuoden aikana.",
            sources: [
                { title: "OECD: AI and the labor market", url: "https://www.oecd.org/en/topics/policy-issues/ai-and-the-labour-market.html" },
                { title: "Goldman Sachs Report", url: "https://www.goldmansachs.com/insights/pages/gs-research/potentially-large-effects-of-artificial-intelligence-on-economic-growth-stacker/report.pdf" }
            ]
        },
        {
            id: 2,
            text: "Sääntelyn hitaus on suurin este tekoälyn turvalliselle hyödyntämiselle.",
            sources: [
                { title: "EU AI Act overview", url: "https://artificialintelligenceact.eu/" }
            ]
        },
        {
            id: 3,
            text: "Tekoäly poistaa rutiinitöitä ja vapauttaa aikaa luovempaan tekemiseen.",
            sources: []
        },
        {
            id: 4,
            text: "Yleissivistävän koulutuksen merkitys korostuu tekoälysovellusten yleistyessä.",
            sources: []
        }
    ]
};

let currentIndex = 0;
const votes = [];

// DOM Elements
const elCurrentTopic = document.getElementById('current-topic');
const elStatementText = document.getElementById('statement-text');
const elSourceIndicators = document.getElementById('source-indicators');
const elProgressFill = document.getElementById('progress-fill');
const elProgressText = document.getElementById('progress-text');
const elSourcePanel = document.getElementById('source-management');
const elSourceList = document.getElementById('source-list');

// Initialization
function init() {
    elCurrentTopic.textContent = DATA.topic;
    document.getElementById('topic-description').textContent = DATA.description;
    renderStatement();

    // Event Listeners
    document.getElementById('vote-agree').addEventListener('click', () => handleVote('agree'));
    document.getElementById('vote-disagree').addEventListener('click', () => handleVote('disagree'));
    document.getElementById('vote-pass').addEventListener('click', () => handleVote('pass'));
    document.getElementById('close-source').addEventListener('click', toggleSourcePanel);
}

function renderStatement() {
    if (currentIndex >= DATA.statements.length) {
        showSummary();
        return;
    }

    const statement = DATA.statements[currentIndex];
    elStatementText.textContent = statement.text;

    // Render source indicators
    elSourceIndicators.innerHTML = '';
    statement.sources.forEach((source, idx) => {
        const icon = document.createElement('div');
        icon.className = 'source-icon';
        icon.textContent = 'i';
        icon.title = source.title;
        icon.onclick = (e) => {
            e.stopPropagation();
            openSources(statement.sources);
        };
        elSourceIndicators.appendChild(icon);
    });

    updateProgress();
}

function handleVote(type) {
    votes.push({
        id: DATA.statements[currentIndex].id,
        vote: type
    });

    // Animation effect
    const card = document.querySelector('.statement-card');
    card.style.transform = type === 'agree' ? 'translateX(50px) rotate(5deg)' :
        type === 'disagree' ? 'translateX(-50px) rotate(-5deg)' :
            'translateY(-30px)';
    card.style.opacity = '0';

    setTimeout(() => {
        currentIndex++;
        card.style.transform = 'none';
        card.style.opacity = '1';
        renderStatement();
    }, 300);
}

function updateProgress() {
    const percent = (currentIndex / DATA.statements.length) * 100;
    elProgressFill.style.width = `${percent}%`;
    elProgressText.textContent = `${currentIndex} / ${DATA.statements.length} väitettä käsitelty`;
}

function openSources(sources) {
    elSourceList.innerHTML = '';
    if (sources.length === 0) {
        elSourceList.innerHTML = '<p>Ei vielä lähteitä tälle väitteelle.</p>';
    } else {
        sources.forEach(s => {
            const di = document.createElement('div');
            di.className = 'source-item';
            di.innerHTML = `<strong>${s.title}</strong><br><a href="${s.url}" target="_blank">${s.url}</a>`;
            elSourceList.appendChild(di);
        });
    }
    elSourcePanel.classList.remove('hidden');
    setTimeout(() => elSourcePanel.classList.add('active'), 10);
}

function toggleSourcePanel() {
    elSourcePanel.classList.remove('active');
    setTimeout(() => elSourcePanel.classList.add('hidden'), 400);
}

function showSummary() {
    document.getElementById('voting-area').innerHTML = `
        <div class="statement-card">
            <h2>Kiitos osallistumisesta!</h2>
            <p>Mielipiteesi on kirjattu. Tässä prototyypissä äänet tallentuvat vain istunnon ajaksi.</p>
            <button class="vote-btn pass" style="margin-top: 2rem; width: auto; padding: 1rem 2rem;" onclick="location.reload()">Aloita alusta</button>
        </div>
    `;
    updateProgress();
}

// Start
init();
