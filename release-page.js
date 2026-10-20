const STORAGE_KEY = "graphite_releases_v1";

const params = new URLSearchParams(window.location.search);
const releaseId = params.get("id");

const content = document.getElementById("releaseContent");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function loadReleases() {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("Ошибка чтения localStorage:", e);
        return [];
    }
}

function formatDate(date) {
    if (!date) return "Не указана";
    const parsed = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return date;
    }
    return parsed.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

// Формула пересчета критериев в итоговую шкалу до 80 баллов
function calculateTotalScore(scores) {
    const { r1 = 0, r2 = 0, r3 = 0, r4 = 0, vibe = 0 } = scores;
    if (!r1 || !r2 || !r3 || !r4 || !vibe) return null;
    
    const sumMain = r1 + r2 + r3 + r4; // от 4 до 40
    const raw = (sumMain / 40) * 70 + (vibe / 5) * 10;
    return Math.min(80, Math.max(1, Math.round(raw)));
}

function renderRelease() {
    try {
        const releases = loadReleases();
        const release = releases.find(item => String(item.id) === String(releaseId));

        if (!release) {
            content.innerHTML = `
                <div class="not-found">
                    <h1>Релиз не найден</h1>
                    <p>Возможно, он был удалён или ссылка устарела.</p>
                    <a class="button button-primary" href="releases.html" style="margin-top: 15px;">
                        Вернуться к релизам
                    </a>
                </div>
            `;
            return;
        }

        document.title = `${release.title} — Graphite`;

        const cover = release.cover
            ? `<img src="${release.cover}" alt="Обложка: ${escapeHTML(release.title)}">`
            : "";

        const scores = release.scores || { r1: 0, r2: 0, r3: 0, r4: 0, vibe: 0 };
        const currentTotal = release.rating !== null && release.rating !== undefined ? release.rating : calculateTotalScore(scores);

        content.innerHTML = `
            <div class="release-main-card">
                <div class="release-header-grid">
                    <div
                        class="detail-cover"
                        style="${release.cover ? "" : `background: ${release.demoCover || "linear-gradient(145deg, #343b45, #191a1e)"}`}"
                    >
                        ${cover}
                    </div>

                    <div class="release-meta-info">
                        <span class="detail-type">
                            ${release.type === "single" ? "SINGLE" : "ALBUM"}
                        </span>

                        <h1 class="detail-title">${escapeHTML(release.title)}</h1>
                        <p class="detail-artist">${escapeHTML(release.artist)}</p>

                        <dl class="detail-info">
                            <div class="detail-info-row">
                                <dt>Исполнитель</dt>
                                <dd>${escapeHTML(release.artist)}</dd>
                            </div>

                            <div class="detail-info-row">
                                <dt>Продюсер</dt>
                                <dd>${escapeHTML(release.producer || "Не указан")}</dd>
                            </div>

                            <div class="detail-info-row">
                                <dt>Тип релиза</dt>
                                <dd>${release.type === "single" ? "Сингл" : "Альбом"}</dd>
                            </div>

                            <div class="detail-info-row">
                                <dt>Дата релиза</dt>
                                <dd>${escapeHTML(formatDate(release.date))}</dd>
                            </div>
                        </dl>
                    </div>
                </div>

                <section class="rating-panel">
                    <div class="rating-panel-top">
                        <div>
                            <h2>Оценка релиза</h2>
                            <p class="rating-subtitle">Пример будущего интерфейса</p>
                        </div>
                    </div>

                    <div class="criteria-list">
                        <!-- 1. Рифмы / образы -->
                        <div class="criterion-card" data-criterion="r1">
                            <div class="criterion-header">
                                <span class="criterion-title">1. Рифмы / образы</span>
                                <span class="criterion-score">${scores.r1 ? `${scores.r1} / 10` : '— / 10'}</span>
                            </div>
                            <p class="criterion-desc">Качество рифм, выразительность текста и интересные образы.</p>
                            <div class="criterion-inputs">
                                ${Array.from({length: 10}, (_, i) => i + 1).map(num => `
                                    <button type="button" class="criterion-btn ${scores.r1 === num ? 'active' : ''}" data-value="${num}">${num}</button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 2. Структура / ритмика -->
                        <div class="criterion-card" data-criterion="r2">
                            <div class="criterion-header">
                                <span class="criterion-title">2. Структура / ритмика</span>
                                <span class="criterion-score">${scores.r2 ? `${scores.r2} / 10` : '— / 10'}</span>
                            </div>
                            <p class="criterion-desc">Построение частей, флоу, ритмический рисунок и взаимодействие с битом.</p>
                            <div class="criterion-inputs">
                                ${Array.from({length: 10}, (_, i) => i + 1).map(num => `
                                    <button type="button" class="criterion-btn ${scores.r2 === num ? 'active' : ''}" data-value="${num}">${num}</button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 3. Реализация стиля -->
                        <div class="criterion-card" data-criterion="r3">
                            <div class="criterion-header">
                                <span class="criterion-title">3. Реализация стиля</span>
                                <span class="criterion-score">${scores.r3 ? `${scores.r3} / 10` : '— / 10'}</span>
                            </div>
                            <p class="criterion-desc">Насколько убедительно артист реализует выбранное музыкальное направление.</p>
                            <div class="criterion-inputs">
                                ${Array.from({length: 10}, (_, i) => i + 1).map(num => `
                                    <button type="button" class="criterion-btn ${scores.r3 === num ? 'active' : ''}" data-value="${num}">${num}</button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 4. Индивидуальность / харизма -->
                        <div class="criterion-card" data-criterion="r4">
                            <div class="criterion-header">
                                <span class="criterion-title">4. Индивидуальность / харизма</span>
                                <span class="criterion-score">${scores.r4 ? `${scores.r4} / 10` : '— / 10'}</span>
                            </div>
                            <p class="criterion-desc">Узнаваемость, собственная подача и характер артиста в музыке.</p>
                            <div class="criterion-inputs">
                                ${Array.from({length: 10}, (_, i) => i + 1).map(num => `
                                    <button type="button" class="criterion-btn ${scores.r4 === num ? 'active' : ''}" data-value="${num}">${num}</button>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 5. Атмосфера / вайб -->
                        <div class="criterion-card vibes-container" data-criterion="vibe">
                            <div class="criterion-header">
                                <span class="criterion-title">5. Атмосфера / вайб</span>
                                <span class="criterion-score">${scores.vibe ? `${scores.vibe} / 5` : '/ 5'}</span>
                            </div>
                            <p class="criterion-desc">Отдельное поле оценивания. Максимум — 5 баллов. Этот критерий визуально отделен от основных.</p>
                            <div class="criterion-inputs">
                                ${Array.from({length: 5}, (_, i) => i + 1).map(num => `
                                    <button type="button" class="criterion-btn ${scores.vibe === num ? 'active' : ''}" data-value="${num}">${num}</button>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="rating-result-box">
                        <span class="rating-result-title">Итоговая оценка</span>
                        <span class="rating-result-value" id="totalScoreDisplay">
                            ${currentTotal !== null && currentTotal !== undefined ? currentTotal : '—'} <span>/ 80</span>
                        </span>
                    </div>

                    <div class="nominations-check-section">
                        <h3>Номинации</h3>
                        <div class="checkbox-group">
                            ${release.type === 'single' ? `
                                <label class="checkbox-label">
                                    <input type="checkbox" name="nomination" value="single_year" ${release.nominations?.includes('single_year') ? 'checked' : ''}> Сингл года
                                </label>
                            ` : `
                                <label class="checkbox-label">
                                    <input type="checkbox" name="nomination" value="album_year" ${release.nominations?.includes('album_year') ? 'checked' : ''}> Альбом года
                                </label>
                            `}
                            <label class="checkbox-label">
                                <input type="checkbox" name="nomination" value="producer_year" ${release.nominations?.includes('producer_year') ? 'checked' : ''}> Продюсер года
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="nomination" value="cover_year" ${release.nominations?.includes('cover_year') ? 'checked' : ''}> Обложка года
                            </label>
                        </div>
                    </div>

                    <button class="button button-primary" id="saveRatingBtn" style="width: 100%; margin-top: 10px;">
                        Сохранить оценку и номинации <span>↗</span>
                    </button>

                    <p class="rating-message" id="ratingMessage"></p>
                </section>
            </div>
        `;

        // Логика выбора критериев
        const criteriaCards = content.querySelectorAll(".criterion-card");
        const activeScores = { ...scores };

        criteriaCards.forEach(card => {
            const criterionKey = card.dataset.criterion;
            const scoreDisplay = card.querySelector(".criterion-score");
            const buttons = card.querySelectorAll(".criterion-btn");

            buttons.forEach(btn => {
                btn.addEventListener("click", () => {
                    buttons.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    const val = Number(btn.dataset.value);
                    activeScores[criterionKey] = val;
                    scoreDisplay.textContent = `${val} / ${criterionKey === 'vibe' ? '5' : '10'}`;

                    const newTotal = calculateTotalScore(activeScores);
                    const totalDisplay = document.getElementById("totalScoreDisplay");
                    totalDisplay.innerHTML = `${newTotal !== null ? newTotal : '—'} <span>/ 80</span>`;
                });
            });
        });

        // Сохранение
        document.getElementById("saveRatingBtn").addEventListener("click", () => {
            const message = document.getElementById("ratingMessage");
            message.textContent = "";

            if (!activeScores.r1 || !activeScores.r2 || !activeScores.r3 || !activeScores.r4 || !activeScores.vibe) {
                message.textContent = "Пожалуйста, выстави оценки по всем пяти критериям.";
                return;
            }

            const finalTotal = calculateTotalScore(activeScores);
            const checkedNominations = [...content.querySelectorAll('input[name="nomination"]:checked')]
                .map(input => input.value);

            const currentReleases = loadReleases();
            const index = currentReleases.findIndex(item => String(item.id) === String(releaseId));

            if (index === -1) {
                message.textContent = "Релиз не найден в базе.";
                return;
            }

            currentReleases[index].scores = activeScores;
            currentReleases[index].rating = finalTotal;
            currentReleases[index].nominations = checkedNominations;

            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(currentReleases));
                message.textContent = "Оценка и номинации успешно сохранены!";
            } catch (e) {
                console.error(e);
                message.textContent = "Не удалось сохранить данные в хранилище.";
            }
        });

    } catch (err) {
        console.error("Ошибка при рендеринге релиза:", err);
        content.innerHTML = `<p style="color: #e7a6a6;">Произошла ошибка при загрузке релиза. Проверьте консоль браузера (F12).</p>`;
    }
}

renderRelease();