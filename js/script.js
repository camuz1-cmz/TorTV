
/* ========================================
   TorTV - API E EVENTOS
======================================== */

const API_URL = "https://api.reidoscanais.my";

const eventsGrid = document.getElementById("events-grid");
const loadingState = document.getElementById("loading-state");
const currentDate = document.getElementById("current-date");

let events = [];

let activeStatus = "all";
let activeCategory = "Todos";


/* ========================================
   DATA E HORÁRIO
======================================== */

const TIMEZONE = "America/Sao_Paulo";

function getDateKey(timestamp) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date(timestamp * 1000));

    const values = Object.fromEntries(
        parts.map(part => [part.type, part.value])
    );

    return `${values.year}-${values.month}-${values.day}`;
}

function formatTime(timestamp) {
    return new Intl.DateTimeFormat("pt-BR", {
        timeZone: TIMEZONE,
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(timestamp * 1000));
}

function getToday() {
    return getDateKey(Date.now() / 1000);
}

function updateCurrentDate() {
    currentDate.textContent = new Intl.DateTimeFormat("pt-BR", {
        timeZone: TIMEZONE,
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(new Date());
}


/* ========================================
   BUSCAR EVENTOS NA API
======================================== */

async function fetchEvents() {
    try {
        loadingState.hidden = false;
        loadingState.textContent = "Carregando programação...";

        const response = await fetch(`${API_URL}/sports`);

        if (!response.ok) {
            throw new Error("Não foi possível consultar a API.");
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
            throw new Error("Resposta inválida da API.");
        }

        events = result.data;

        renderEvents();

    } catch (error) {
        console.error("Erro ao carregar eventos:", error);

        eventsGrid.innerHTML = "";

        loadingState.hidden = false;
        loadingState.textContent =
            "Não foi possível carregar a programação. Tente novamente.";
    }
}


/* ========================================
   CRIAR CARD DO EVENTO
======================================== */

function createEventCard(event) {

    const card = document.createElement("article");
    card.className = "event-card";

    const imageContainer = document.createElement("div");
    imageContainer.className = "event-image-container";

    if (event.poster) {
        const image = document.createElement("img");

        image.className = "event-poster";
        image.src = event.poster;
        image.alt = event.title || "Evento esportivo";
        image.loading = "lazy";

        imageContainer.appendChild(image);
    }

    const info = document.createElement("div");
    info.className = "event-info";

    const competition = document.createElement("span");
    competition.className = "event-competition";
    competition.textContent = event.competition || event.category || "Esporte";

    const title = document.createElement("h3");
    title.className = "event-title";
    title.textContent = event.title || "Evento esportivo";

    const time = document.createElement("p");
    time.className = "event-time";

    time.textContent = event.start_timestamp
        ? `Hoje às ${formatTime(event.start_timestamp)}`
        : "Horário não informado";

    const status = document.createElement("span");
    status.className = "event-status";

    if (event.status === "live") {
        status.classList.add("live");
        status.textContent = "AO VIVO";

    } else if (event.status === "upcoming") {
        status.classList.add("upcoming");
        status.textContent = "EM BREVE";

    } else {
        status.textContent = "ENCERRADO";
    }

    info.appendChild(competition);
    info.appendChild(title);
    info.appendChild(time);
    info.appendChild(status);

    card.appendChild(imageContainer);
    card.appendChild(info);

    card.style.cursor = "pointer";

    card.addEventListener("click", () => {
        openPlayer(event);
    });

    return card;
}


/* ========================================
   EXIBIR EVENTOS
======================================== */

function renderEvents() {

    eventsGrid.innerHTML = "";

    const today = getToday();

    let filteredEvents = events.filter(event => {
        if (!event.start_timestamp) return false;

        return getDateKey(event.start_timestamp) === today;
    });

    // Filtro por status

    if (activeStatus !== "all") {
        filteredEvents = filteredEvents.filter(event => {
            return event.status === activeStatus;
        });
    }

    // Filtro por categoria

    if (activeCategory === "Outros") {
        filteredEvents = filteredEvents.filter(event => {
            return !["Futebol", "Basquete", "Vôlei"]
                .includes(event.category);
        });

    } else if (activeCategory !== "Todos") {
        filteredEvents = filteredEvents.filter(event => {
            return event.category === activeCategory;
        });
    }

    // Ordenar por horário

    filteredEvents.sort((a, b) => {
        return a.start_timestamp - b.start_timestamp;
    });

    if (filteredEvents.length === 0) {
        loadingState.hidden = false;
        loadingState.textContent =
            "Nenhum evento encontrado para esta seleção.";

        return;
    }

    loadingState.hidden = true;

    filteredEvents.forEach(event => {
        const card = createEventCard(event);
        eventsGrid.appendChild(card);
    });
}


/* ========================================
   FILTROS DE STATUS
======================================== */

const filterButtons = document.querySelectorAll(".filter-button");

filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        activeStatus = button.dataset.filter;

        renderEvents();
    });

});


/* ========================================
   FILTROS DE CATEGORIA
======================================== */

const categoryButtons = document.querySelectorAll(".category-button");

categoryButtons.forEach(button => {

    button.addEventListener("click", () => {

        categoryButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        activeCategory = button.textContent.trim();

        renderEvents();
    });

});


/* ========================================
   INICIALIZAÇÃO
======================================== */

updateCurrentDate();
fetchEvents();


/* ========================================
   PLAYER E FONTES
======================================== */


const playerSection = document.getElementById("player-section");
const playerScreen = document.getElementById("player-screen");
const playerTitle = document.getElementById("player-title");
const playerCompetition = document.getElementById("player-competition");
const sourcesList = document.getElementById("sources-list");
const backButton = document.getElementById("back-button");

let currentEvent = null;

function openPlayer(event) {

    if (!Array.isArray(event.embeds) || event.embeds.length === 0) {
        alert("Nenhuma fonte disponível para este evento.");
        return;
    }

    currentEvent = event;

    playerTitle.textContent = event.title;
    playerCompetition.textContent = event.competition || event.category || "Esporte";

    sourcesList.innerHTML = "";
    playerScreen.innerHTML = '<div class="player-placeholder">Carregando transmissão...</div>';

    event.embeds.forEach((source, index) => {

        const button = document.createElement("button");
        button.className = "source-button";

        const name = document.createElement("span");
        name.className = "source-name";
        name.textContent = source.provider || "Transmissão";

        const quality = document.createElement("span");
        quality.className = "source-quality";
        quality.textContent = source.quality || "Qualidade não informada";

        button.appendChild(name);
        button.appendChild(quality);

        button.addEventListener("click", () => {
            selectSource(source, button);
        });

        sourcesList.appendChild(button);

        if (index === 0) {
            selectSource(source, button);
        }
    });

    document.querySelector("main").style.display = "none";

    playerSection.hidden = false;

    playerSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

function selectSource(source, button) {

    if (!source.embed_url) {
        alert("Endereço da transmissão não encontrado.");
        return;
    }

    document.querySelectorAll(".source-button").forEach(item => {
        item.classList.remove("active");
    });

    button.classList.add("active");

    const iframe = document.createElement("iframe");

    iframe.src = source.embed_url;
    iframe.title = `Transmissão: ${currentEvent.title}`;
    iframe.allow = "autoplay; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    playerScreen.innerHTML = "";
    playerScreen.appendChild(iframe);
}

backButton.addEventListener("click", () => {

    playerScreen.innerHTML = "";
    playerSection.hidden = true;

    document.querySelector("main").style.display = "";

    document.getElementById("eventos").scrollIntoView({
        behavior: "smooth"
    });

    currentEvent = null;
});



