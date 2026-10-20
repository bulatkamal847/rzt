const STORAGE_KEY = "graphite_releases_v1";
const WINNERS_KEY = "graphite_winners_v1";

const categories = {
    single_year: "Сингл года",
    album_year: "Альбом года",
    producer_year: "Продюсер года",
    cover_year: "Обложка года"
};

function loadReleases() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

function loadWinners() {
    try {
        const data = localStorage.getItem(WINNERS_KEY);
        return data ? JSON.parse(data) : {};
    } catch {
        return {};
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

// 1. Отображение выбранных победителей в карточках номинаций на главной
function renderMainNominations() {
    const releases = loadReleases();
    const winners = loadWinners();

    const categoryKeys = ["single_year", "album_year", "producer_year", "cover_year"];

    categoryKeys.forEach(catKey => {
        const winnerId = winners[catKey];
        const winnerRelease = releases.find(r => String(r.id) === String(winnerId));
        const cardElement = document.querySelector(`[data-nomination="${catKey}"]`);

        if (!cardElement) return;

        // Ищем элементы для текста и обложки
        const titleEl = cardElement.querySelector(".nomination-winner-name") || cardElement.querySelector("h3");
        const artistEl = cardElement.querySelector(".nomination-winner-artist") || cardElement.querySelector("p");
        const coverEl = cardElement.querySelector(".nomination-cover") || cardElement.querySelector(".nomination-image") || cardElement.querySelector(".nomination-media");

        if (winnerRelease) {
            if (titleEl) titleEl.textContent = winnerRelease.title;
            if (artistEl) {
                artistEl.textContent = catKey === "producer_year" 
                    ? (winnerRelease.producer || winnerRelease.artist)
                    : winnerRelease.artist;
            }

            if (coverEl) {
                if (winnerRelease.cover) {
                    // Исправлено: object-fit: contain и класс для отображения картинки целиком (квадратом)
                    coverEl.innerHTML = `<img src="${winnerRelease.cover}" alt="${escapeHTML(winnerRelease.title)}" class="nomination-real-cover">`;
                    coverEl.style.background = "#151619";
                } else if (winnerRelease.demoCover) {
                    coverEl.style.background = winnerRelease.demoCover;
                    coverEl.innerHTML = "";
                }
            }
            cardElement.classList.add("has-winner");
        } else {
            cardElement.classList.remove("has-winner");
        }
    });
}

// 2. Расчет и отображение общей статистики на главной
function renderStatistics() {
    const releases = loadReleases();

    const totalCountEl = document.getElementById("statTotalReleases");
    const ratedCountEl = document.getElementById("statRatedReleases");
    const topArtistEl = document.getElementById("statTopArtist");
    const topProducerEl = document.getElementById("statTopProducer");

    if (!totalCountEl) return;

    // Общее число релизов
    totalCountEl.textContent = releases.length;

    // Релизы с сохраненной оценкой
    const ratedReleases = releases.filter(r => r.rating !== null && r.rating !== undefined && Number.isFinite(Number(r.rating)));
    if (ratedCountEl) ratedCountEl.textContent = ratedReleases.length;

    // Подсчет самого частой исполнителя и продюсера
    const artistCounts = {};
    const producerCounts = {};

    releases.forEach(r => {
        if (r.artist) {
            artistCounts[r.artist] = (artistCounts[r.artist] || 0) + 1;
        }
        if (r.producer) {
            producerCounts[r.producer] = (producerCounts[r.producer] || 0) + 1;
        }
    });

    const getTopKey = (obj) => {
        let topKey = "—";
        let max = 0;
        for (const [key, val] of Object.entries(obj)) {
            if (val > max) {
                max = val;
                topKey = key;
            }
        }
        return topKey;
    };

    if (topArtistEl) topArtistEl.textContent = getTopKey(artistCounts);
    if (topProducerEl) topProducerEl.textContent = getTopKey(producerCounts);
}

// Поиск и быстрая навигация по Ctrl/Cmd + K
const globalSearch = document.getElementById("globalSearch");
if (globalSearch) {
    globalSearch.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && globalSearch.value.trim()) {
            window.location.href = `releases.html?search=${encodeURIComponent(globalSearch.value.trim())}`;
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderMainNominations();
    renderStatistics();
});