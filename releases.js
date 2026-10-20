
const STORAGE_KEY = "graphite_releases_v1";

const demoReleases = [
    {
        id: "demo-1",
        title: "Ночной город",
        artist: "Exicun",
        producer: "",
        type: "single",
        rating: 72,
        date: "2026-10-15",
        cover: null,
        demoCover: "linear-gradient(145deg, #28313b, #101113)"
    },
    {
        id: "demo-2",
        title: "Без названия",
        artist: "Example Artist",
        producer: "",
        type: "album",
        rating: 68,
        date: "2026-10-12",
        cover: null,
        demoCover: "linear-gradient(145deg, #574b60, #191a1e)"
    },
    {
        id: "demo-3",
        title: "На повторе",
        artist: "Demo",
        producer: "",
        type: "single",
        rating: 61,
        date: "2026-10-08",
        cover: null,
        demoCover: "linear-gradient(145deg, #475a50, #191a1e)"
    },
    {
        id: "demo-4",
        title: "Черновик",
        artist: "Another Artist",
        producer: "",
        type: "album",
        rating: 75,
        date: "2026-10-01",
        cover: null,
        demoCover: "linear-gradient(145deg, #625347, #191a1e)"
    }
];

function loadReleases() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            return JSON.parse(saved);
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(demoReleases)
        );

        return [...demoReleases];
    } catch {
        return [...demoReleases];
    }
}

let releases = loadReleases();
let selectedCover = null;
let editingReleaseId = null;

const grid = document.getElementById("releaseGrid");
const searchInput = document.getElementById("searchInput");
const globalSearch = document.getElementById("globalSearch");
const typeFilter = document.getElementById("typeFilter");
const sortSelect = document.getElementById("sortSelect");
const releaseCount = document.getElementById("releaseCount");

const modal = document.getElementById("releaseModal");
const form = document.getElementById("releaseForm");
const coverInput = document.getElementById("coverInput");
const coverPreview = document.getElementById("coverPreview");
const coverError = document.getElementById("coverError");
const formMessage = document.getElementById("formMessage");

const modalTitle = document.getElementById("modalTitle");
const submitButton = form.querySelector('button[type="submit"]');

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function saveReleases() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(releases));
        return true;
    } catch {
        alert(
            "Не удалось сохранить изменения. Возможно, хранилище браузера заполнено. Попробуй изображение меньшего размера."
        );
        return false;
    }
}

function renderReleases() {
    const search = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;
    const sort = sortSelect.value;

    let filtered = releases.filter(release => {
        const matchesSearch =
            release.title.toLowerCase().includes(search) ||
            release.artist.toLowerCase().includes(search) ||
            (release.producer || "").toLowerCase().includes(search);

        const matchesType = type === "all" || release.type === type;

        return matchesSearch && matchesType;
    });

    if (sort === "title") {
        filtered.sort((a, b) =>
            a.title.localeCompare(b.title, "ru")
        );
    } else if (sort === "rating") {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
        filtered.sort((a, b) =>
            new Date(b.date || 0) - new Date(a.date || 0)
        );
    }

    releaseCount.textContent = `Найдено релизов: ${filtered.length}`;

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="catalog-empty">
                <h3>Ничего не найдено</h3>
                <p>Попробуй изменить запрос или фильтры.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(release => {
        const coverStyle = release.cover
            ? ""
            : `background: ${release.demoCover || "linear-gradient(145deg, #343b45, #191a1e)"}`;

        const coverImage = release.cover
            ? `<img src="${release.cover}" alt="Обложка: ${escapeHTML(release.title)}" style="width:100%;height:100%;object-fit:cover;">`
            : "";

        return `
    <article class="release-card" data-release-id="${escapeHTML(release.id)}">
        <a
            class="release-cover release-open-link"
            href="release.html?id=${encodeURIComponent(release.id)}"
            aria-label="Открыть релиз: ${escapeHTML(release.title)}"
            style="${coverStyle}"
        >
            ${coverImage}
            <span class="cover-tag">
                ${release.type === "single" ? "SINGLE" : "ALBUM"}
            </span>
        </a>

        <div class="release-details">
            <h3>
                <a
                    class="release-title-link"
                    href="release.html?id=${encodeURIComponent(release.id)}"
                >${escapeHTML(release.title)}</a>
            </h3>
            <p>${escapeHTML(release.artist)}</p>
        </div>

        <div class="release-divider"></div>

        <div class="release-meta">
            <span>${release.type === "single" ? "Сингл" : "Альбом"}</span>
            <span class="release-score">
                ${Number.isFinite(Number(release.rating)) &&
                  release.rating !== null &&
                  release.rating !== ""
                    ? `${Number(release.rating)}/80`
                    : "Нет оценки"}
            </span>
        </div>

        <div class="release-actions">
            <button
                class="button button-secondary"
                type="button"
                data-action="edit"
                data-id="${escapeHTML(release.id)}"
            >Редактировать</button>

            <button
                class="button button-secondary delete-release-btn"
                type="button"
                data-action="delete"
                data-id="${escapeHTML(release.id)}"
            >Удалить</button>
        </div>
    </article>
`;
    }).join("");
}

function showCover(cover) {
    coverPreview.innerHTML = "";

    if (cover) {
        const img = document.createElement("img");
        img.src = cover;
        img.alt = "Предпросмотр обложки";
        coverPreview.appendChild(img);
    } else {
        coverPreview.innerHTML = "<span>ARTWORK</span>";
    }
}

function openModal(release = null) {
    form.reset();
    selectedCover = null;
    editingReleaseId = release ? release.id : null;

    coverInput.value = "";
    coverError.textContent = "";
    formMessage.textContent = "";

    if (release) {
        modalTitle.textContent = "Редактировать релиз";
        submitButton.innerHTML = "Сохранить изменения <span>↗</span>";

        document.getElementById("releaseTitle").value = release.title;
        document.getElementById("releaseArtist").value = release.artist;
        document.getElementById("releaseProducer").value = release.producer || "";
        document.getElementById("releaseType").value = release.type;
        document.getElementById("releaseDate").value = release.date || "";

        showCover(release.cover);
    } else {
        modalTitle.textContent = "Добавить релиз";
        submitButton.innerHTML = "Сохранить релиз <span>↗</span>";

        document.getElementById("releaseDate").value =
            new Date().toLocaleDateString("sv-SE");

        showCover(null);
    }

    modal.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("releaseTitle").focus();
}

function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    document.getElementById("addReleaseBtn").focus();
    editingReleaseId = null;
}

function deleteRelease(id) {
    const release = releases.find(item => item.id === id);

    if (!release) return;

    const confirmed = confirm(
        `Удалить релиз «${release.title}» — ${release.artist}?\n\nЭто действие нельзя отменить.`
    );

    if (!confirmed) return;

    const previousReleases = releases;
    releases = releases.filter(item => item.id !== id);

    if (!saveReleases()) {
        releases = previousReleases;
        return;
    }

    renderReleases();
}

// Открытие окна добавления.
document.getElementById("addReleaseBtn")
    .addEventListener("click", () => openModal());

// Обработка кнопок редактирования и удаления в карточках.
grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
        const release = releases.find(item => item.id === id);

        if (release) openModal(release);
    }

    if (action === "delete") {
        deleteRelease(id);
    }
});

document.getElementById("closeModalBtn")
    .addEventListener("click", closeModal);

document.getElementById("cancelModalBtn")
    .addEventListener("click", closeModal);

modal.addEventListener("click", event => {
    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) {
        closeModal();
    }

    if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
    ) {
        event.preventDefault();
        globalSearch.focus();
    }
});

// Загрузка и предпросмотр новой обложки.
coverInput.addEventListener("change", () => {
    const file = coverInput.files[0];
    coverError.textContent = "";

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
        coverInput.value = "";
        coverError.textContent = "Выбери JPG, PNG или WebP.";
        return;
    }

    if (file.size > 1.5 * 1024 * 1024) {
        coverInput.value = "";
        coverError.textContent =
            "Файл слишком большой. Максимальный размер — 1,5 МБ.";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        selectedCover = reader.result;
        showCover(selectedCover);
    };

    reader.onerror = () => {
        coverError.textContent = "Не удалось прочитать изображение.";
    };

    reader.readAsDataURL(file);
});

// Сохранение нового релиза или изменений.
form.addEventListener("submit", event => {
    event.preventDefault();
    formMessage.textContent = "";

    const title = document.getElementById("releaseTitle").value.trim();
    const artist = document.getElementById("releaseArtist").value.trim();
    const producer = document.getElementById("releaseProducer").value.trim();
    const type = document.getElementById("releaseType").value;
    const date = document.getElementById("releaseDate").value;

    if (!title || !artist || !date) {
        formMessage.textContent = "Заполни все обязательные поля.";
        return;
    }

    // При редактировании исключаем текущий релиз из проверки дубликатов.
    const duplicate = releases.some(release =>
        release.id !== editingReleaseId &&
        release.title.trim().toLowerCase() === title.toLowerCase() &&
        release.artist.trim().toLowerCase() === artist.toLowerCase()
    );

    if (duplicate) {
        formMessage.textContent =
            "Такой релиз этого исполнителя уже есть в базе.";
        return;
    }

    if (editingReleaseId !== null) {
        const index = releases.findIndex(
            release => release.id === editingReleaseId
        );

        if (index === -1) {
            formMessage.textContent = "Не удалось найти этот релиз.";
            return;
        }

        const oldRelease = releases[index];

        const updatedRelease = {
            ...oldRelease,
            title,
            artist,
            producer,
            type,
            date,
            // Если новую обложку не выбрали, оставляем прежнюю.
            cover: selectedCover !== null ? selectedCover : oldRelease.cover
        };

        releases[index] = updatedRelease;

        if (!saveReleases()) {
            releases[index] = oldRelease;
            return;
        }
    } else {
        const newRelease = {
            id: crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
            title,
            artist,
            producer,
            type,
            date,
            rating: null,
            cover: selectedCover,
            demoCover: "linear-gradient(145deg, #343b45, #191a1e)"
        };

        releases.unshift(newRelease);

        if (!saveReleases()) {
            releases.shift();
            return;
        }
    }

    renderReleases();
    closeModal();
});

// Поиск, фильтры и сортировка.
searchInput.addEventListener("input", renderReleases);
typeFilter.addEventListener("change", renderReleases);
sortSelect.addEventListener("change", renderReleases);

globalSearch.addEventListener("input", () => {
    searchInput.value = globalSearch.value;
    renderReleases();
});

renderReleases();