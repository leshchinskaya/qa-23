import * as qaHeroGame from "./games/qa-hero.js";
import * as pixelQaFighter from "./games/pixel-qa-fighter.js";
import * as qaTowerDefense from "./games/qa-tower-defense.js";

const STORAGE_KEY = "qaGamePortalProfileV2";
const THEME_STORAGE_KEY = "qaGamePortalTheme";
const AUDIO_STORAGE_KEY = "qaGamePortalAudioMuted";

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deriveHeroAbilities(hero) {
  const stability = hero.powerEffects.stability || 0;
  const speed = hero.powerEffects.speed || 0;
  const morale = hero.powerEffects.morale || 0;

  const qaHeroCooldown = clamp(12 - speed * 0.08 + Math.max(0, morale) * 0.04, 8, 14);
  const qaHeroBoost = {
    stability: Math.round(clamp(stability, -5, 22)),
    speed: Math.round(clamp(speed, -5, 22)),
    morale: Math.round(clamp(morale, -8, 22))
  };

  const fighterAbility = {
    name: hero.superpower,
    cooldown: Number(clamp(14 - speed * 0.12 + Math.max(0, morale) * 0.02, 8.5, 15.5).toFixed(1)),
    duration: Number(clamp(3.4 + (stability + speed + Math.max(0, morale)) * 0.018, 3.1, 5.2).toFixed(1)),
    moveMultiplier: Number(clamp(1 + speed * 0.013 + Math.max(0, morale) * 0.002, 1.03, 1.32).toFixed(2)),
    jumpMultiplier: Number(clamp(1 + speed * 0.008, 1.02, 1.18).toFixed(2)),
    bulletDamageBonus: Math.round(clamp(2 + speed * 0.3 + Math.max(0, stability) * 0.2, 2, 9)),
    auraDps: Number(clamp(14 + stability * 0.8 + Math.max(0, morale) * 0.45, 10, 34).toFixed(1)),
    auraRange: Math.round(clamp(130 + speed * 2 + Math.max(0, morale) * 1.4, 120, 190)),
    damageReduction: Number(clamp(0.08 + Math.max(0, stability) * 0.011 + Math.max(0, morale) * 0.004, 0.08, 0.36).toFixed(2)),
    instantHeal: Math.round(clamp(3 + Math.max(0, morale) * 0.55, 2, 14))
  };

  const towerAbility = {
    name: hero.superpower,
    cooldown: Number(clamp(20 - speed * 0.18 + Math.max(0, morale) * 0.06, 12.5, 22).toFixed(1)),
    duration: Number(clamp(4.8 + (Math.max(0, stability) + Math.max(0, morale)) * 0.045, 4.5, 8.5).toFixed(1)),
    fireRateMultiplier: Number(clamp(1.12 + speed * 0.014 + Math.max(0, morale) * 0.003, 1.1, 1.42).toFixed(2)),
    damageMultiplier: Number(clamp(1.08 + Math.max(0, stability) * 0.015 + speed * 0.006, 1.06, 1.45).toFixed(2)),
    rangeBonus: Math.round(clamp(8 + Math.max(0, morale) * 2.2 + speed * 0.6, 8, 40)),
    instantCredits: Math.round(clamp(8 + Math.max(0, morale) * 1.1, 6, 26)),
    baseHeal: Math.round(clamp(2 + Math.max(0, stability) * 0.45, 2, 12)),
    bountyMultiplier: Number(clamp(1 + Math.max(0, morale) * 0.015, 1, 1.3).toFixed(2))
  };

  return {
    qaHero: {
      name: hero.superpower,
      cooldown: Number(qaHeroCooldown.toFixed(1)),
      effects: qaHeroBoost
    },
    fighter: fighterAbility,
    tower: towerAbility
  };
}

const HEROES = [
  {
    id: "pechkin",
    name: "Печкин Дмитрий",
    description: "Быстро берёт в работу любую задачу и превращает её в ощутимый рост качества.",
    superpower: "Архитектор качества",
    image: "assets/pechkin.jpg",
    powerEffects: { stability: 14, speed: 3, morale: 2 }
  },
  {
    id: "vinogradov",
    name: "Виноградов Сергей",
    description: "Успевает закрывать критичные задачи за короткое время без потери качества.",
    superpower: "Турбо-ритм",
    image: "assets/vinogradov.jpg",
    powerEffects: { stability: 5, speed: 15, morale: 1 }
  },
  {
    id: "derkachev",
    name: "Деркачев Матвей",
    description: "Мастер переключений: быстро меняет контекст и стабильно держит темп команды.",
    superpower: "Мультиконтекст",
    image: "assets/derkachev.jpg",
    powerEffects: { stability: 10, speed: 9, morale: 1 }
  },
  {
    id: "ryazantsev",
    name: "Рязанцев Александр",
    description: "Надёжный девайс-холдер: держит парк устройств в боевой готовности для тестов.",
    superpower: "Арсенал девайсов",
    image: "assets/ryazantsev.jpg",
    powerEffects: { stability: 6, speed: 2, morale: 12 }
  },
  {
    id: "yanovskiy",
    name: "Яновский Данил",
    description: "Сильный в нагрузочном и продуктовом тестировании, видит риски ещё до релиза.",
    superpower: "Нагрузочный радар",
    image: "assets/yanovskiy.jpg",
    powerEffects: { stability: 2, speed: 16, morale: -1 }
  },
  {
    id: "pereguda",
    name: "Перегуда Роман",
    description: "Специалист по iOS-автотестам и мастер отладки нестабильных CI-пайплайнов.",
    superpower: "CI-реаниматор iOS",
    image: "assets/pereguda.jpg",
    powerEffects: { stability: 3, speed: 4, morale: 16 }
  },
  {
    id: "razuvaev",
    name: "Разуваев Всеволод",
    description: "Снимает блокеры между QA и backend под релизной нагрузкой.",
    superpower: "Синхронизация слоёв",
    image: "assets/razuvaev.jpg",
    powerEffects: { stability: 9, speed: 2, morale: 10 }
  },
  {
    id: "voronin",
    name: "Воронин Владислав",
    description: "Автоматизатор и разработчик, который доводит QA-инструменты до продакшен-уровня.",
    superpower: "Кодовый автоматизатор",
    image: "assets/voronin.jpg",
    powerEffects: { stability: 8, speed: 12, morale: 1 }
  },
  {
    id: "repin",
    name: "Репин Александр",
    description: "Мегаэффективно удерживает SLA и вывозит критичные сроки в самые горячие релизы.",
    superpower: "Щит SLA",
    image: "assets/repin.png",
    powerEffects: { stability: 6, speed: 6, morale: 6 }
  }
];

HEROES.forEach((hero) => {
  hero.abilities = deriveHeroAbilities(hero);
});

const TOWER_DIFFICULTIES = {
  easy: { id: "easy", title: "Лёгкая", caption: "Больше запаса HP и кредитов, 6 волн." },
  normal: { id: "normal", title: "Нормальная", caption: "Базовый режим: 8 волн и стандартный баланс." },
  hard: { id: "hard", title: "Сложная", caption: "Жёсткий натиск врагов, 10 волн и повышенные награды." }
};

const GAMES = {
  "qa-hero": {
    id: "qa-hero",
    title: "QA Hero: Спаси релиз",
    shortDescription: "DOM-симулятор инцидентов: удержи Stability, Speed и Team Morale 90 секунд.",
    controls: "Решай события кликом; P — пауза; R — рестарт; Esc — выход",
    module: qaHeroGame
  },
  "pixel-qa-fighter": {
    id: "pixel-qa-fighter",
    title: "Pixel QA Fighter",
    shortDescription: "Canvas-аркада: двигайся, прыгай и расстреливай багов в бесконечной волне.",
    controls: "A/D или ←/→, Space — прыжок, F — выстрел, Shift — суперсила",
    module: pixelQaFighter
  },
  "qa-tower-defense": {
    id: "qa-tower-defense",
    title: "QA Tower Defense",
    shortDescription: "Оборона " +
      "прода" +
      ": выбери сложность, размещай башни и переживи волны атакующих дефектов.",
    controls: "Клик — поставить башню, 1/2/3 — выбор типа, Shift — суперсила, P — пауза",
    module: qaTowerDefense
  }
};

const BADGES = [
  {
    id: "first-launch",
    title: "Первый запуск",
    description: "Открыл портал QA Game Portal.",
    condition: (profile) => profile.meta.gamesPlayed >= 0
  },
  {
    id: "save-release",
    title: "Спас релиз",
    description: "Победи в игре QA Hero: Спаси релиз.",
    condition: (profile) => profile.meta.qaHeroWins > 0
  },
  {
    id: "kill-50-bugs",
    title: "Убил 50 багов",
    description: "Уничтожь суммарно 50 багов во всех играх.",
    condition: (profile) => profile.meta.totalBugKills >= 50
  },
  {
    id: "survive-60",
    title: "Выжил 60 секунд",
    description: "Продержись в одном матче минимум 60 секунд.",
    condition: (profile) => profile.meta.longestRun >= 60
  },
  {
    id: "three-games-night",
    title: "3 игры за вечер",
    description: "Сыграй 3 матча за один календарный день.",
    condition: (profile) => Object.values(profile.meta.playsByDate).some((count) => count >= 3)
  },
  {
    id: "no-damage-20",
    title: "Без урона 20 секунд",
    description: "Продержись 20 секунд без получения урона.",
    condition: (profile) => profile.meta.maxNoDamage >= 20
  },
  {
    id: "tower-wave-5",
    title: "Башенная оборона: волна 5",
    description: "Доберись минимум до 5-й волны в QA Tower Defense.",
    condition: (profile) => profile.meta.bestTowerWave >= 5
  },
  {
    id: "hero-week",
    title: "QA-герой недели",
    description: "Сыграй 7 матчей одним и тем же героем.",
    condition: (profile) => Object.values(profile.meta.heroUsage).some((count) => count >= 7)
  }
];

const defaultProfile = () => ({
  selectedHeroId: null,
  heroSelectionConfirmed: false,
  totalScore: 0,
  coins: 0,
  bestScores: {
    "qa-hero": 0,
    "pixel-qa-fighter": 0,
    "qa-tower-defense": 0
  },
  totalPlayTime: 0,
  unlockedBadges: [],
  meta: {
    gamesPlayed: 0,
    qaHeroWins: 0,
    totalBugKills: 0,
    longestRun: 0,
    maxNoDamage: 0,
    bestTowerWave: 0,
    playsByDate: {},
    heroUsage: {}
  },
  recentRuns: []
});

class StateManager {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  load() {
    const base = defaultProfile();
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return base;
      }
      const parsed = JSON.parse(raw);
      const heroSelectionConfirmed = Boolean(parsed.heroSelectionConfirmed);
      const selectedHeroId = HEROES.some((hero) => hero.id === parsed.selectedHeroId)
        && heroSelectionConfirmed
        ? parsed.selectedHeroId
        : null;
      return {
        ...base,
        ...parsed,
        selectedHeroId,
        heroSelectionConfirmed,
        bestScores: { ...base.bestScores, ...(parsed.bestScores || {}) },
        meta: { ...base.meta, ...(parsed.meta || {}) },
        recentRuns: Array.isArray(parsed.recentRuns) ? parsed.recentRuns.slice(0, 6) : []
      };
    } catch (_) {
      return base;
    }
  }

  save(profile) {
    localStorage.setItem(this.storageKey, JSON.stringify(profile));
  }
}

class AudioManager {
  constructor(storageKey) {
    this.storageKey = storageKey;
    this.context = null;
    this.master = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.musicTimer = null;
    this.musicMode = null;
    this.muted = this.loadMuted();
    this.unlocked = false;
  }

  loadMuted() {
    return localStorage.getItem(this.storageKey) === "1";
  }

  saveMuted() {
    localStorage.setItem(this.storageKey, this.muted ? "1" : "0");
  }

  ensureContext() {
    if (this.context) {
      return;
    }

    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return;
    }

    this.context = new Ctx();

    this.master = this.context.createGain();
    this.musicBus = this.context.createGain();
    this.sfxBus = this.context.createGain();

    this.master.gain.value = this.muted ? 0 : 0.16;
    this.musicBus.gain.value = 0.48;
    this.sfxBus.gain.value = 0.8;

    this.musicBus.connect(this.master);
    this.sfxBus.connect(this.master);
    this.master.connect(this.context.destination);
  }

  unlock() {
    this.ensureContext();
    if (!this.context) {
      return;
    }
    if (this.context.state === "running") {
      this.unlocked = true;
      return;
    }
    if (this.context.state === "suspended") {
      this.context.resume()
        .then(() => {
          this.unlocked = this.context?.state === "running";
          if (this.unlocked && this.musicMode && !this.musicTimer && !this.muted) {
            this.startMusic(this.musicMode, true);
          }
        })
        .catch(() => {});
    }
  }

  isMuted() {
    return this.muted;
  }

  setMuted(nextMuted, persist = true) {
    this.muted = Boolean(nextMuted);
    this.ensureContext();
    if (this.master) {
      this.master.gain.value = this.muted ? 0 : 0.16;
    }
    if (persist) {
      this.saveMuted();
    }

    if (this.muted) {
      this.stopMusic();
    } else if (this.musicMode) {
      this.startMusic(this.musicMode);
    }
  }

  toggleMuted() {
    this.setMuted(!this.muted, true);
    return this.muted;
  }

  tone({
    frequency,
    duration = 0.12,
    type = "triangle",
    gain = 0.22,
    delay = 0,
    target = "sfx"
  }, allowResumeRetry = true) {
    this.ensureContext();
    if (this.muted || !this.context || !frequency) {
      return;
    }

    if (this.context.state !== "running") {
      if (allowResumeRetry) {
        this.context.resume()
          .then(() => {
            this.unlocked = this.context?.state === "running";
            this.tone({ frequency, duration, type, gain, delay: delay + 0.01, target }, false);
          })
          .catch(() => {});
      }
      return;
    }

    const bus = target === "music" ? this.musicBus : this.sfxBus;
    if (!bus) {
      return;
    }

    const osc = this.context.createOscillator();
    const env = this.context.createGain();
    const startAt = this.context.currentTime + delay;
    const stopAt = startAt + duration;

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startAt);
    env.gain.setValueAtTime(0.0001, startAt);
    env.gain.exponentialRampToValueAtTime(gain, startAt + Math.min(0.02, duration * 0.25));
    env.gain.exponentialRampToValueAtTime(0.0001, stopAt);

    osc.connect(env);
    env.connect(bus);

    osc.start(startAt);
    osc.stop(stopAt + 0.02);
  }

  sequence(notes, options = {}) {
    notes.forEach((note, index) => {
      this.tone({
        frequency: note.frequency,
        duration: note.duration,
        type: options.type || note.type || "triangle",
        gain: (options.gain || 0.2) * (note.gain || 1),
        delay: (options.step || 0.08) * index + (note.delay || 0),
        target: options.target || "sfx"
      });
    });
  }

  play(name) {
    if (this.muted) {
      return;
    }
    this.unlock();

    switch (name) {
      case "ui-click":
        this.sequence([{ frequency: 420, duration: 0.06 }, { frequency: 620, duration: 0.09 }], { gain: 0.14 });
        break;
      case "ui-nav":
        this.sequence([{ frequency: 350, duration: 0.07 }, { frequency: 460, duration: 0.1 }, { frequency: 620, duration: 0.08 }], { gain: 0.12, step: 0.06 });
        break;
      case "modal-open":
        this.sequence([{ frequency: 250, duration: 0.08 }, { frequency: 200, duration: 0.14 }], { gain: 0.12, type: "sine" });
        break;
      case "modal-ok":
        this.sequence([{ frequency: 520, duration: 0.08 }, { frequency: 740, duration: 0.12 }], { gain: 0.14 });
        break;
      case "modal-cancel":
        this.sequence([{ frequency: 440, duration: 0.08 }, { frequency: 320, duration: 0.1 }], { gain: 0.12 });
        break;
      case "game-start":
        this.sequence([{ frequency: 370, duration: 0.08 }, { frequency: 494, duration: 0.08 }, { frequency: 659, duration: 0.15 }], { gain: 0.16, step: 0.07 });
        break;
      case "game-win":
        this.sequence([{ frequency: 392, duration: 0.09 }, { frequency: 523, duration: 0.09 }, { frequency: 659, duration: 0.09 }, { frequency: 784, duration: 0.14 }], { gain: 0.2, step: 0.06 });
        break;
      case "game-lose":
        this.sequence([{ frequency: 350, duration: 0.09 }, { frequency: 294, duration: 0.1 }, { frequency: 220, duration: 0.16 }], { gain: 0.14, step: 0.08, type: "sawtooth" });
        break;
      case "game-pause":
        this.sequence([{ frequency: 470, duration: 0.06 }, { frequency: 470, duration: 0.06, delay: 0.02 }], { gain: 0.12 });
        break;
      case "game-restart":
        this.sequence([{ frequency: 340, duration: 0.05 }, { frequency: 470, duration: 0.06 }, { frequency: 620, duration: 0.08 }], { gain: 0.14, step: 0.05 });
        break;
      case "coin":
        this.sequence([{ frequency: 760, duration: 0.06 }, { frequency: 1080, duration: 0.09 }], { gain: 0.15, step: 0.05, type: "square" });
        break;
      case "ability":
        this.sequence([{ frequency: 520, duration: 0.08 }, { frequency: 780, duration: 0.12 }, { frequency: 980, duration: 0.12 }], { gain: 0.17, step: 0.05 });
        break;
      case "fighter-shot":
        this.tone({ frequency: 900, duration: 0.04, gain: 0.09, type: "square" });
        break;
      case "fighter-hit":
        this.tone({ frequency: 210, duration: 0.06, gain: 0.1, type: "sawtooth" });
        break;
      case "tower-place":
        this.sequence([{ frequency: 420, duration: 0.05 }, { frequency: 520, duration: 0.07 }], { gain: 0.1, step: 0.04 });
        break;
      case "tower-fire":
        this.tone({ frequency: 650, duration: 0.03, gain: 0.07, type: "square" });
        break;
      case "tower-hit":
        this.tone({ frequency: 260, duration: 0.05, gain: 0.08, type: "triangle" });
        break;
      case "tower-wave":
        this.sequence([{ frequency: 320, duration: 0.05 }, { frequency: 440, duration: 0.08 }, { frequency: 560, duration: 0.1 }], { gain: 0.11, step: 0.06 });
        break;
      default:
        this.tone({ frequency: 560, duration: 0.05, gain: 0.08 });
    }
  }

  scheduleMusicBeat(mode, step) {
    const lobbyPattern = [196, 246.94, 293.66, 246.94];
    const gamePattern = [220, 329.63, 261.63, 392];
    const notes = mode === "game" ? gamePattern : lobbyPattern;
    const root = notes[step % notes.length];
    this.tone({ frequency: root, duration: mode === "game" ? 0.25 : 0.35, gain: 0.045, type: "sine", target: "music" });
    this.tone({ frequency: root * 1.5, duration: 0.16, gain: 0.022, delay: 0.02, type: "triangle", target: "music" });
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  startMusic(mode = "lobby", skipUnlock = false) {
    if (this.musicMode === mode && this.musicTimer) {
      return;
    }
    this.musicMode = mode;
    this.stopMusic();
    if (this.muted) {
      return;
    }

    if (!skipUnlock) {
      this.unlock();
    }
    if (!this.context || this.context.state !== "running") {
      return;
    }
    let step = 0;
    const tickMs = mode === "game" ? 680 : 980;
    this.scheduleMusicBeat(mode, step);
    this.musicTimer = setInterval(() => {
      step += 1;
      this.scheduleMusicBeat(mode, step);
    }, tickMs);
  }
}

const appState = {
  profile: null,
  theme: "dark",
  audioMuted: false,
  pendingTowerDifficulty: "normal",
  currentView: "loading",
  pendingGameId: null,
  activeGameId: null,
  activeController: null,
  loadingDone: false,
  modalResolver: null
};

const dom = {
  navButtons: Array.from(document.querySelectorAll(".nav-btn")),
  views: {
    loading: document.getElementById("loading-view"),
    lobby: document.getElementById("lobby-view"),
    heroes: document.getElementById("heroes-view"),
    game: document.getElementById("game-view"),
    results: document.getElementById("results-view"),
    achievements: document.getElementById("achievements-view")
  },
  loadingText: document.getElementById("loading-text"),
  gameCards: document.getElementById("game-cards"),
  heroGrid: document.getElementById("hero-grid"),
  selectedHeroPreview: document.getElementById("selected-hero-preview"),
  profileStats: document.getElementById("profile-stats"),
  badgeList: document.getElementById("badge-list"),
  recentRuns: document.getElementById("recent-runs"),
  topbarCoins: document.getElementById("topbar-coins"),
  topbarScore: document.getElementById("topbar-score"),
  audioToggle: document.getElementById("audio-toggle"),
  themeToggle: document.getElementById("theme-toggle"),
  gameIntro: document.getElementById("game-intro"),
  gameToolbar: document.getElementById("game-toolbar"),
  activeGameTitle: document.getElementById("active-game-title"),
  activeGameControls: document.getElementById("active-game-controls"),
  btnPause: document.getElementById("btn-pause"),
  btnRestart: document.getElementById("btn-restart"),
  btnExit: document.getElementById("btn-exit"),
  gameContainer: document.getElementById("game-container"),
  resultsCard: document.getElementById("results-card"),
  modal: document.getElementById("modal"),
  modalText: document.getElementById("modal-text"),
  modalConfirm: document.getElementById("modal-confirm"),
  modalCancel: document.getElementById("modal-cancel")
};

const stateManager = new StateManager(STORAGE_KEY);
const audioManager = new AudioManager(AUDIO_STORAGE_KEY);

function getInitialTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }
  return "dark";
}

function applyTheme(theme, persist = false) {
  const nextTheme = theme === "light" ? "light" : "dark";
  appState.theme = nextTheme;
  document.documentElement.setAttribute("data-theme", nextTheme);

  if (persist) {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  if (!dom.themeToggle) {
    return;
  }

  const isLight = nextTheme === "light";
  dom.themeToggle.textContent = isLight ? "☀️" : "☁️";
  dom.themeToggle.dataset.themeIcon = nextTheme;
  dom.themeToggle.setAttribute("title", isLight ? "Светлая тема" : "Тёмная тема");
  dom.themeToggle.setAttribute(
    "aria-label",
    isLight ? "Переключить на тёмную тему" : "Переключить на светлую тему"
  );
}

function toggleTheme() {
  applyTheme(appState.theme === "light" ? "dark" : "light", true);
}

function preloadImages(paths) {
  return Promise.all(
    paths.map(
      (path) =>
        new Promise((resolve) => {
          const image = new Image();
          image.onload = () => resolve({ ok: true, path });
          image.onerror = () => resolve({ ok: false, path });
          image.src = path;
        })
    )
  );
}

function getHero(heroId) {
  return HEROES.find((hero) => hero.id === heroId) || null;
}

function formatPercent(multiplier) {
  return `${Math.round((multiplier - 1) * 100)}%`;
}

function formatSigned(value) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function getHeroPortalAbilityBlurb(hero) {
  const fighter = hero?.abilities?.fighter;
  const tower = hero?.abilities?.tower;
  if (!fighter || !tower) {
    return "Суперсила влияет на все режимы.";
  }
  return `Shift: Fighter ${formatPercent(fighter.moveMultiplier)} скорости, Tower +${tower.instantCredits} кредитов`;
}

function getHeroGameAbilitySummary(hero, gameId) {
  if (!hero?.abilities) {
    return "Суперсила усиливает матч.";
  }

  if (gameId === "qa-hero") {
    const qaHero = hero.abilities.qaHero;
    return `${qaHero.name}: ${formatSigned(qaHero.effects.stability)} Stability, ${formatSigned(qaHero.effects.speed)} Speed, ${formatSigned(qaHero.effects.morale)} Morale (КД ${qaHero.cooldown}с).`;
  }

  if (gameId === "pixel-qa-fighter") {
    const fighter = hero.abilities.fighter;
    return `${fighter.name}: Shift даёт ${fighter.duration}с усиления, ${formatPercent(fighter.moveMultiplier)} к скорости, +${fighter.bulletDamageBonus} к урону пули и ${Math.round(fighter.damageReduction * 100)}% защиты (КД ${fighter.cooldown}с).`;
  }

  if (gameId === "qa-tower-defense") {
    const tower = hero.abilities.tower;
    return `${tower.name}: Shift баффает башни на ${tower.duration}с (${formatPercent(tower.fireRateMultiplier)} к темпу, ${formatPercent(tower.damageMultiplier)} к урону), сразу даёт +${tower.instantCredits} кредитов и +${tower.baseHeal} HP базе (КД ${tower.cooldown}с).`;
  }

  return "Суперсила усиливает матч.";
}

function setView(viewName) {
  appState.currentView = viewName;
  Object.entries(dom.views).forEach(([name, element]) => {
    element.classList.toggle("active", name === viewName);
  });
  dom.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.route === viewName);
  });

  if (viewName === "loading") {
    audioManager.stopMusic();
    return;
  }

  if (viewName === "game" && appState.activeGameId) {
    audioManager.startMusic("game");
    return;
  }

  audioManager.startMusic("lobby");
}

function showConfirm(text) {
  dom.modalText.textContent = text;
  dom.modal.classList.add("open");
  dom.modal.setAttribute("aria-hidden", "false");
  audioManager.play("modal-open");

  return new Promise((resolve) => {
    appState.modalResolver = resolve;
  });
}

function closeConfirm(result) {
  dom.modal.classList.remove("open");
  dom.modal.setAttribute("aria-hidden", "true");
  audioManager.play(result ? "modal-ok" : "modal-cancel");
  if (appState.modalResolver) {
    appState.modalResolver(result);
    appState.modalResolver = null;
  }
}

function unlockBadges() {
  const current = new Set(appState.profile.unlockedBadges);
  BADGES.forEach((badge) => {
    if (!current.has(badge.id) && badge.condition(appState.profile)) {
      current.add(badge.id);
    }
  });
  appState.profile.unlockedBadges = Array.from(current);
}

function updateProfileWithResult(result) {
  const profile = appState.profile;
  profile.meta.gamesPlayed += 1;

  const dateKey = new Date().toISOString().slice(0, 10);
  profile.meta.playsByDate[dateKey] = (profile.meta.playsByDate[dateKey] || 0) + 1;

  const hero = getHero(profile.selectedHeroId);
  if (hero) {
    profile.meta.heroUsage[hero.id] = (profile.meta.heroUsage[hero.id] || 0) + 1;
  }

  if (result.gameId === "qa-hero" && result.win) {
    profile.meta.qaHeroWins += 1;
  }

  profile.meta.totalBugKills += Math.max(0, result.kills || 0);
  profile.meta.longestRun = Math.max(profile.meta.longestRun, result.playTime || 0);
  profile.meta.maxNoDamage = Math.max(profile.meta.maxNoDamage, result.noDamageSeconds || 0);
  profile.meta.bestTowerWave = Math.max(profile.meta.bestTowerWave, result.waveReached || 0);

  profile.totalScore += Math.max(0, result.score || 0);
  profile.coins += Math.max(0, result.coins || 0);
  profile.totalPlayTime += Math.max(0, result.playTime || 0);
  profile.bestScores[result.gameId] = Math.max(profile.bestScores[result.gameId] || 0, result.score || 0);

  const runText = `${new Date().toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })} · ${GAMES[result.gameId].title} · ${result.win ? "победа" : "поражение"} · +${result.coins} монет`;
  profile.recentRuns.unshift(runText);
  profile.recentRuns = profile.recentRuns.slice(0, 6);

  unlockBadges();
  stateManager.save(profile);
}

function renderTopbar() {
  dom.topbarCoins.textContent = String(appState.profile.coins);
  dom.topbarScore.textContent = String(appState.profile.totalScore);

  if (!dom.audioToggle) {
    return;
  }

  const isMuted = appState.audioMuted;
  dom.audioToggle.textContent = isMuted ? "🔇" : "🔊";
  dom.audioToggle.setAttribute("title", isMuted ? "Звук выключен" : "Звук включен");
  dom.audioToggle.setAttribute("aria-label", isMuted ? "Включить звук" : "Выключить звук");
}

function renderSelectedHeroPreview() {
  const hero = getHero(appState.profile.selectedHeroId);
  if (!hero) {
    dom.selectedHeroPreview.innerHTML = `
      <div class="selected-hero-inner">
        <div class="selected-hero-meta">
          <p><strong>Герой не выбран</strong></p>
          <span>Сначала выбери героя, затем запускай игру.</span>
        </div>
        <button type="button" class="btn" data-route-link="heroes">Выбрать героя</button>
      </div>
    `;

    const routeButton = dom.selectedHeroPreview.querySelector("[data-route-link='heroes']");
    routeButton.addEventListener("click", () => {
      audioManager.play("ui-click");
      setView("heroes");
    });
    return;
  }

  dom.selectedHeroPreview.innerHTML = `
    <div class="selected-hero-inner">
      <img src="${hero.image}" alt="${hero.name}">
      <div class="selected-hero-meta">
        <p><strong>${hero.name}</strong></p>
        <span>Суперсила: ${hero.superpower}</span>
        <p class="hero-ability">${getHeroPortalAbilityBlurb(hero)}</p>
      </div>
      <button type="button" class="btn" data-route-link="heroes">Сменить героя</button>
    </div>
  `;

  const routeButton = dom.selectedHeroPreview.querySelector("[data-route-link='heroes']");
  routeButton.addEventListener("click", () => {
    audioManager.play("ui-click");
    setView("heroes");
  });
}

function renderStatsPanel() {
  const bestQaHero = appState.profile.bestScores["qa-hero"] || 0;
  const bestFighter = appState.profile.bestScores["pixel-qa-fighter"] || 0;
  const bestTower = appState.profile.bestScores["qa-tower-defense"] || 0;

  dom.profileStats.innerHTML = `
    <li>Суммарный счёт: <strong>${appState.profile.totalScore}</strong></li>
    <li>Монеты: <strong>${appState.profile.coins}</strong></li>
    <li>Лучший счёт QA Hero: <strong>${bestQaHero}</strong></li>
    <li>Лучший счёт Pixel QA Fighter: <strong>${bestFighter}</strong></li>
    <li>Лучший счёт QA Tower Defense: <strong>${bestTower}</strong></li>
    <li>Суммарное время в игре: <strong>${Math.floor(appState.profile.totalPlayTime)} сек</strong></li>
    <li>Награды: <strong>${appState.profile.unlockedBadges.length}/${BADGES.length}</strong></li>
  `;
}

function renderBadges() {
  const unlocked = new Set(appState.profile.unlockedBadges);
  dom.badgeList.innerHTML = BADGES.map((badge) => {
    const isUnlocked = unlocked.has(badge.id);
    return `
      <article class="badge ${isUnlocked ? "" : "locked"}">
        <p class="badge-title">${badge.title}</p>
        <p>${badge.description}</p>
        <p class="badge-state">${isUnlocked ? "Разблокировано" : "Заблокировано"}</p>
      </article>
    `;
  }).join("");

  dom.recentRuns.innerHTML = appState.profile.recentRuns.length
    ? appState.profile.recentRuns.map((line) => `<li>${line}</li>`).join("")
    : "<li>Пока нет завершённых матчей.</li>";
}

function renderHeroGrid() {
  const selectedId = appState.profile.selectedHeroId;
  dom.heroGrid.innerHTML = HEROES.map((hero) => `
    <article class="hero-card ${hero.id === selectedId ? "selected" : ""}" data-hero-id="${hero.id}">
      <img class="hero-avatar" src="${hero.image}" alt="${hero.name}">
      <h3>${hero.name}</h3>
      <p>${hero.description}</p>
      <p class="hero-power">Суперсила: ${hero.superpower}</p>
      <p>${getHeroPortalAbilityBlurb(hero)}</p>
    </article>
  `).join("");

  dom.heroGrid.querySelectorAll(".hero-card").forEach((card) => {
    card.addEventListener("click", () => {
      audioManager.play("ui-click");
      const wasUnselected = !getHero(appState.profile.selectedHeroId);
      appState.profile.selectedHeroId = card.dataset.heroId;
      appState.profile.heroSelectionConfirmed = true;
      stateManager.save(appState.profile);
      renderAll();
      if (wasUnselected && appState.currentView === "heroes") {
        setView("lobby");
      }
    });
  });
}

function renderGameCards() {
  const heroSelected = Boolean(getHero(appState.profile.selectedHeroId));
  dom.gameCards.innerHTML = Object.values(GAMES)
    .map((game) => `
      <article class="game-card">
        <h3>${game.title}</h3>
        <p>${game.shortDescription}</p>
        <p><strong>Управление:</strong> ${game.controls}</p>
        <button class="btn" type="button" data-play="${game.id}" ${heroSelected ? "" : "disabled"}>
          ${heroSelected ? "Запустить" : "Сначала выбери героя"}
        </button>
      </article>
    `)
    .join("");

  dom.gameCards.querySelectorAll("[data-play]").forEach((button) => {
    button.addEventListener("click", () => {
      audioManager.play("ui-click");
      if (!getHero(appState.profile.selectedHeroId)) {
        setView("heroes");
        return;
      }
      openGameIntro(button.dataset.play);
    });
  });
}

function renderAll() {
  renderTopbar();
  renderSelectedHeroPreview();
  renderStatsPanel();
  renderHeroGrid();
  renderGameCards();
  renderBadges();
}

function openGameIntro(gameId) {
  if (!GAMES[gameId]) {
    return;
  }
  if (!getHero(appState.profile.selectedHeroId)) {
    setView("heroes");
    return;
  }

  appState.pendingGameId = gameId;
  const game = GAMES[gameId];
  const hero = getHero(appState.profile.selectedHeroId);
  const isTowerDefense = gameId === "qa-tower-defense";
  let selectedDifficultyId = appState.pendingTowerDifficulty in TOWER_DIFFICULTIES
    ? appState.pendingTowerDifficulty
    : "normal";
  const difficultyMarkup = isTowerDefense
    ? `
      <div class="difficulty-picker">
        <p><strong>Сложность:</strong> <span id="td-intro-difficulty">${TOWER_DIFFICULTIES[selectedDifficultyId].title}</span></p>
        <div class="difficulty-options">
          ${Object.values(TOWER_DIFFICULTIES).map((difficulty) => `
            <button
              type="button"
              class="btn btn-secondary difficulty-option ${difficulty.id === selectedDifficultyId ? "active" : ""}"
              data-difficulty="${difficulty.id}"
            >
              ${difficulty.title}
            </button>
          `).join("")}
        </div>
        <p class="difficulty-caption" id="td-intro-caption">${TOWER_DIFFICULTIES[selectedDifficultyId].caption}</p>
      </div>
    `
    : "";
  const abilityMarkup = hero
    ? `<p class="hero-ability-note"><strong>Суперсила героя:</strong> ${getHeroGameAbilitySummary(hero, gameId)}</p>`
    : "";

  dom.gameContainer.innerHTML = "";
  dom.gameToolbar.classList.remove("active");
  dom.gameIntro.innerHTML = `
    <h2>${game.title}</h2>
    <p>${game.shortDescription}</p>
    <p><strong>Управление:</strong> ${game.controls}</p>
    ${difficultyMarkup}
    ${abilityMarkup}
    <div class="intro-actions">
      <button id="btn-game-start" class="btn" type="button">Старт</button>
      <button id="btn-game-back" class="btn btn-secondary" type="button">Назад в лобби</button>
    </div>
  `;

  dom.activeGameTitle.textContent = game.title;
  dom.activeGameControls.textContent = game.controls;

  if (isTowerDefense) {
    const difficultyLabel = dom.gameIntro.querySelector("#td-intro-difficulty");
    const difficultyCaption = dom.gameIntro.querySelector("#td-intro-caption");
    dom.gameIntro.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.addEventListener("click", () => {
        audioManager.play("ui-click");
        selectedDifficultyId = button.dataset.difficulty in TOWER_DIFFICULTIES
          ? button.dataset.difficulty
          : "normal";
        appState.pendingTowerDifficulty = selectedDifficultyId;
        difficultyLabel.textContent = TOWER_DIFFICULTIES[selectedDifficultyId].title;
        difficultyCaption.textContent = TOWER_DIFFICULTIES[selectedDifficultyId].caption;
        dom.gameIntro.querySelectorAll("[data-difficulty]").forEach((option) => {
          option.classList.toggle("active", option.dataset.difficulty === selectedDifficultyId);
        });
      });
    });
  }

  dom.gameIntro.querySelector("#btn-game-start").addEventListener("click", () => {
    audioManager.play("ui-click");
    startGame(gameId, { towerDifficulty: selectedDifficultyId });
  });
  dom.gameIntro.querySelector("#btn-game-back").addEventListener("click", () => {
    audioManager.play("ui-click");
    appState.pendingGameId = null;
    setView("lobby");
  });

  setView("game");
}

function teardownActiveGame() {
  if (!appState.activeGameId) {
    return;
  }
  const moduleRef = GAMES[appState.activeGameId].module;
  moduleRef.destroy();
  appState.activeGameId = null;
  appState.activeController = null;
  dom.gameToolbar.classList.remove("active");
  dom.gameContainer.innerHTML = "";
  dom.gameIntro.innerHTML = "";
}

function showResults(result) {
  const game = GAMES[result.gameId];
  dom.resultsCard.innerHTML = `
    <h2>${result.win ? "Победа" : "Поражение"}</h2>
    <p>${result.message || "Матч завершён."}</p>
    <ul class="result-list">
      <li>Игра: <strong>${game.title}</strong></li>
      <li>Счёт за матч: <strong>${result.score}</strong></li>
      <li>Монеты за матч: <strong>+${result.coins}</strong></li>
      <li>Время: <strong>${result.playTime} сек</strong></li>
      <li>Побеждённых багов: <strong>${result.kills || 0}</strong></li>
      <li>Макс. серия без урона: <strong>${Math.floor(result.noDamageSeconds || 0)} сек</strong></li>
      <li>Макс. волна: <strong>${result.waveReached || 0}</strong></li>
    </ul>
    <div class="intro-actions">
      <button class="btn" type="button" id="results-lobby">В лобби</button>
      <button class="btn" type="button" id="results-replay">Играть ещё раз</button>
      <button class="btn btn-secondary" type="button" id="results-ach">К наградам</button>
    </div>
  `;

  dom.resultsCard.querySelector("#results-lobby").addEventListener("click", () => {
    audioManager.play("ui-click");
    setView("lobby");
  });
  dom.resultsCard.querySelector("#results-replay").addEventListener("click", () => {
    audioManager.play("ui-click");
    openGameIntro(result.gameId);
  });
  dom.resultsCard.querySelector("#results-ach").addEventListener("click", () => {
    audioManager.play("ui-click");
    setView("achievements");
  });

  setView("results");
}

function handleGameResult(baseResult) {
  const result = {
    win: false,
    score: 0,
    coins: 0,
    playTime: 0,
    kills: 0,
    noDamageSeconds: 0,
    waveReached: 0,
    gameId: appState.activeGameId,
    ...baseResult
  };

  if (!result.gameId || !GAMES[result.gameId]) {
    return;
  }

  teardownActiveGame();
  appState.pendingGameId = null;

  updateProfileWithResult(result);
  audioManager.play(result.win ? "game-win" : "game-lose");
  if (result.coins > 0) {
    audioManager.play("coin");
  }
  renderAll();
  showResults(result);
}

function startGame(gameId, options = {}) {
  const game = GAMES[gameId];
  const hero = getHero(appState.profile.selectedHeroId);
  const towerDifficulty = options.towerDifficulty in TOWER_DIFFICULTIES
    ? options.towerDifficulty
    : appState.pendingTowerDifficulty;
  if (!game || !hero) {
    if (!hero) {
      setView("heroes");
    }
    return;
  }

  teardownActiveGame();
  appState.activeGameId = gameId;
  appState.pendingGameId = null;
  appState.pendingTowerDifficulty = towerDifficulty in TOWER_DIFFICULTIES ? towerDifficulty : "normal";
  dom.gameIntro.innerHTML = "";
  dom.gameToolbar.classList.add("active");
  dom.gameContainer.innerHTML = "";
  audioManager.play("game-start");
  audioManager.startMusic("game");

  let ended = false;

  const callbacks = {
    onExitToLobby: async () => {
      if (await showConfirm("Завершить текущий матч и вернуться в лобби?")) {
        teardownActiveGame();
        setView("lobby");
      }
    },
    onGameOver: (result) => {
      if (ended) {
        return;
      }
      ended = true;
      handleGameResult({ ...result, win: false, gameId });
    },
    onGameWin: (result) => {
      if (ended) {
        return;
      }
      ended = true;
      handleGameResult({ ...result, win: true, gameId });
    }
  };

  appState.activeController = game.module.init(
    dom.gameContainer,
    {
      hero,
      selectedHeroId: appState.profile.selectedHeroId,
      profile: appState.profile,
      towerDifficulty: appState.pendingTowerDifficulty,
      audio: {
        play: (name) => audioManager.play(name)
      }
    },
    callbacks
  );
}

async function exitGameToLobby() {
  if (!appState.activeGameId) {
    setView("lobby");
    return;
  }

  const approved = await showConfirm("Выйти в лобби? Прогресс текущего матча не сохранится.");
  if (!approved) {
    return;
  }

  teardownActiveGame();
  appState.pendingGameId = null;
  dom.gameToolbar.classList.remove("active");
  dom.gameIntro.innerHTML = "";
  dom.gameContainer.innerHTML = "";
  setView("lobby");
}

function attachEvents() {
  const unlockAudioOnce = () => {
    audioManager.unlock();
    window.removeEventListener("pointerdown", unlockAudioOnce);
    window.removeEventListener("click", unlockAudioOnce);
    window.removeEventListener("mousedown", unlockAudioOnce);
    window.removeEventListener("touchstart", unlockAudioOnce);
    window.removeEventListener("keydown", unlockAudioOnce);
  };
  window.addEventListener("pointerdown", unlockAudioOnce);
  window.addEventListener("click", unlockAudioOnce);
  window.addEventListener("mousedown", unlockAudioOnce);
  window.addEventListener("touchstart", unlockAudioOnce);
  window.addEventListener("keydown", unlockAudioOnce);

  dom.audioToggle?.addEventListener("click", () => {
    appState.audioMuted = audioManager.toggleMuted();
    renderTopbar();
    if (!appState.audioMuted) {
      audioManager.play("ui-click");
    }
  });

  dom.themeToggle?.addEventListener("click", () => {
    audioManager.play("ui-click");
    toggleTheme();
  });

  dom.navButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      if (!appState.loadingDone) {
        return;
      }
      audioManager.play("ui-nav");
      const route = button.dataset.route;
      if (appState.activeGameId && route !== "game") {
        const ok = await showConfirm("Открытие другого раздела завершит текущий матч. Продолжить?");
        if (!ok) {
          return;
        }
        teardownActiveGame();
      }
      setView(route);
    });
  });

  dom.btnPause.addEventListener("click", () => {
    if (appState.activeController && appState.activeController.togglePause) {
      appState.activeController.togglePause();
      audioManager.play("game-pause");
    }
  });

  dom.btnRestart.addEventListener("click", () => {
    if (appState.activeController && appState.activeController.restart) {
      appState.activeController.restart();
      audioManager.play("game-restart");
    }
  });

  dom.btnExit.addEventListener("click", () => {
    audioManager.play("ui-click");
    exitGameToLobby();
  });

  dom.modalConfirm.addEventListener("click", () => closeConfirm(true));
  dom.modalCancel.addEventListener("click", () => closeConfirm(false));
  dom.modal.addEventListener("click", (event) => {
    if (event.target === dom.modal) {
      closeConfirm(false);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (appState.modalResolver) {
      return;
    }

    if (!appState.activeGameId) {
      return;
    }

    if (event.key === "p" || event.key === "P") {
      event.preventDefault();
      appState.activeController?.togglePause?.();
      audioManager.play("game-pause");
      return;
    }

    if (event.key === "r" || event.key === "R") {
      event.preventDefault();
      appState.activeController?.restart?.();
      audioManager.play("game-restart");
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      exitGameToLobby();
    }
  });
}

async function bootstrap() {
  applyTheme(getInitialTheme());
  appState.audioMuted = audioManager.isMuted();
  audioManager.setMuted(appState.audioMuted, false);
  attachEvents();
  appState.profile = stateManager.load();

  unlockBadges();
  stateManager.save(appState.profile);

  const preload = await preloadImages(HEROES.map((hero) => hero.image));
  const failed = preload.filter((item) => !item.ok).map((item) => item.path);

  if (failed.length > 0) {
    dom.loadingText.textContent = `Часть ассетов недоступна: ${failed.join(", ")}`;
  } else {
    dom.loadingText.textContent = "Ассеты загружены. Портал готов к запуску.";
  }

  appState.loadingDone = true;
  renderAll();
  setView(getHero(appState.profile.selectedHeroId) ? "lobby" : "heroes");
}

bootstrap();
