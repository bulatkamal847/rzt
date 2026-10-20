const STORAGE_KEY = "graphite_releases_v1";
const WINNERS_KEY = "graphite_winners_v1";

const categories = {
    single_year: { title: "Сингл года", desc: "Главный трек по твоей версии" },
    album_year: { title: "Альбом года", desc: "Работа, которая запомнилась" },
    producer_year: { title: "Продюсер года", desc: "Звук, который создаёт настроение" },
    cover_year: { title: "Обложка года", desc: "Оформление, которое цепляет" }
};

let currentCategory = "single_year";

function loadReleases() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

function loadWinners() {
    try {
        return JSON.parse(localStorage.getItem(WINNERS_KEY)) || {};
    } catch {
        return {};
    }
}

function saveWinners(winners) {
    try {
        localStorage.setItem(WINNERS_KEY, JSON.stringify(winners));
        return true;
    } catch {
        alert("Не удалось сохранить победителя.");
        return false;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

const tabs = document.querySelectorAll(".nom-tab");
const categoryTitle = document.getElementById("currentCategoryTitle");
const categoryDesc = document.getElementById("currentCategoryDesc");
const grid = document.getElementById("nomineesGrid");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentCategory = tab.dataset.category;
        
        categoryTitle.textContent = categories[currentCategory].title;
        categoryDesc.textContent = categories[currentCategory].desc;
        
        renderNominees();
    });
});

function renderNominees() {
    const releases = loadReleases();
    const winners = loadWinners();
    const currentWinnerId = winners[currentCategory];

    // Фильтруем релизы, у которых отмечена текущая номинация
    const nominees = releases.filter(release => 
        release.nominations && release.nominations.includes(currentCategory)
    );

    if (nominees.length === 0) {
        grid.innerHTML = `
            <div class="catalog-empty">
                <h3>Нет номинантов в этой категории</h3>
                <p>Отметьте релизы в номинациях на странице их оценивания.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = nominees.map(release => {
        const isWinner = currentWinnerId === release.id;
        const coverStyle = release.cover
            ? ""
            : `background: ${release.demoCover || "linear-gradient(145deg, #343b45, #191a1e)"}`;

        const coverImage = release.cover
            ? `<img src="${release.cover}" alt="Обложка: ${escapeHTML(release.title)}" style="width:100%;height:100%;object-fit:cover;">`
            : "";

        return `
            <article class="release-card ${isWinner ? 'is-winner-card' : ''}" data-id="${escapeHTML(release.id)}">
                <a
                    class="release-cover release-open-link"
                    href="release.html?id=${encodeURIComponent(release.id)}"
                    style="${coverStyle}"
                >
                    ${coverImage}
                    <span class="cover-tag">
                        ${release.type === "single" ? "SINGLE" : "ALBUM"}
                    </span>
                    ${isWinner ? '<span class="winner-badge">ПОБЕДИТЕЛЬ</span>' : ''}
                </a>

                <div class="release-details">
                    <h3>
                        <a class="release-title-link" href="release.html?id=${encodeURIComponent(release.id)}">
                            ${escapeHTML(release.title)}
                        </a>
                    </h3>
                    <p>${escapeHTML(release.artist)}</p>
                </div>

                <div class="release-divider"></div>

                <div class="release-meta">
                    <span>Оценка: ${release.rating ? `${release.rating}/80` : '—'}</span>
                </div>

                <div class="release-actions">
                    <button
                        class="button ${isWinner ? 'button-secondary' : 'button-primary'}"
                        type="button"
                        data-action="toggle-winner"
                        data-id="${escapeHTML(release.id)}"
                        style="width: 100%;"
                    >
                        ${isWinner ? 'Снять победителя' : 'Сделать победителем'}
                    </button>
                </div>
            </article>
        `;
    }).join("");
}

// Обработка клика по кнопке выбора победителя
grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action='toggle-winner']");
    if (!button) return;

    const releaseId = button.dataset.id;
    let winners = loadWinners();

    if (winners[currentCategory] === releaseId) {
        delete winners[currentCategory]; // Снимаем выбор
    } else {
        winners[currentCategory] = releaseId; // Назначаем победителем
    }

    if (saveWinners(winners)) {
        renderNominees();
    }
});

renderNominees();