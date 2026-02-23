(() => {
  const GAME_DURATION_SECONDS = 90;
  const EVENT_INTERVAL_MS = 3000;
  const TIMER_INTERVAL_MS = 1000;

  const HEROES = [
    {
      id: "pechkin",
      name: "Печкин Дмитрий",
      superpower: "Bug Sniper",
      description: "Мгновенно локализует корневую причину и стабилизирует прод.",
      image: "assets/pechkin.jpg",
      power: {
        name: "Точный дебаг",
        effects: { stability: 14, speed: 3, morale: 2 },
        cooldown: 12
      }
    },
    {
      id: "vinogradov",
      name: "Виноградов Сергей",
      superpower: "Pipeline Whisperer",
      description: "Возвращает пайплайн к жизни и ускоряет прохождение CI.",
      image: "assets/vinogradov.jpg",
      power: {
        name: "Шепот CI",
        effects: { stability: 5, speed: 15, morale: 1 },
        cooldown: 12
      }
    },
    {
      id: "derkachev",
      name: "Деркачев Матвей",
      superpower: "Flake Exterminator",
      description: "Очищает автотесты от флейков и убирает шум в отчётах.",
      image: "assets/derkachev.jpg",
      power: {
        name: "Антифлейк",
        effects: { stability: 10, speed: 9, morale: 1 },
        cooldown: 12
      }
    },
    {
      id: "ryazantsev",
      name: "Рязанцев Александр",
      superpower: "Scope Shield",
      description: "Сдерживает хаотичные изменения и спасает командный ритм.",
      image: "assets/ryazantsev.jpg",
      power: {
        name: "Щит требований",
        effects: { stability: 6, speed: 2, morale: 12 },
        cooldown: 12
      }
    },
    {
      id: "yanovskiy",
      name: "Яновский Данил",
      superpower: "Hotfix Sprint",
      description: "Доставляет фикс под давлением без долгих согласований.",
      image: "assets/yanovskiy.jpg",
      power: {
        name: "Спринт фикса",
        effects: { stability: 2, speed: 16, morale: -1 },
        cooldown: 12
      }
    },
    {
      id: "pereguda",
      name: "Перегуда Роман",
      superpower: "Team Booster",
      description: "Перезапускает фокус команды и не даёт морали просесть.",
      image: "assets/pereguda.jpg",
      power: {
        name: "Командный буст",
        effects: { stability: 3, speed: 4, morale: 16 },
        cooldown: 12
      }
    },
    {
      id: "razuvaev",
      name: "Разуваев Всеволод",
      superpower: "Backend Diplomat",
      description: "Снимает блокеры между QA и backend в критический момент.",
      image: "assets/razuvaev.jpg",
      power: {
        name: "Синхронизация слоёв",
        effects: { stability: 9, speed: 2, morale: 10 },
        cooldown: 12
      }
    },
    {
      id: "voronin",
      name: "Воронин Владислав",
      superpower: "CI Guardian",
      description: "Останавливает каскадные падения и чинит проверки за минуты.",
      image: "assets/voronin.jpg",
      power: {
        name: "Купол CI",
        effects: { stability: 8, speed: 12, morale: 1 },
        cooldown: 12
      }
    },
    {
      id: "repin",
      name: "Репин Александр",
      superpower: "Deadline Freeze",
      description: "Замедляет хаос перед релизом и выравнивает все метрики.",
      image: "assets/repin.jpg",
      power: {
        name: "Стоп-кадр дедлайна",
        effects: { stability: 6, speed: 6, morale: 6 },
        cooldown: 12
      }
    }
  ];

  const EVENTS = [
    {
      title: "Critical bug",
      description: "Пользователь теряет данные при сохранении профиля.",
      choices: [
        {
          label: "Откатить релизный патч",
          outcome: "Риск ушёл, но потеряли темп.",
          effects: { stability: 10, speed: -8, morale: -3 }
        },
        {
          label: "Собрать точечный фикс",
          outcome: "Дефект локализован под давлением.",
          effects: { stability: 4, speed: 6, morale: -6 },
          triggersPower: true
        },
        {
          label: "Оставить до утра",
          outcome: "Команда пошла на риск.",
          effects: { stability: -18, speed: 2, morale: -10 }
        }
      ]
    },
    {
      title: "Flaky test",
      description: "Интеграционные тесты падают случайно и тормозят CI.",
      choices: [
        {
          label: "Изолировать нестабильные тесты",
          outcome: "Релизный контур стал чище.",
          effects: { stability: 7, speed: -6, morale: 2 }
        },
        {
          label: "Переписать проверки на месте",
          outcome: "Надёжность вернулась, темп почти не потеряли.",
          effects: { stability: 10, speed: -2, morale: -1 },
          triggersPower: true
        },
        {
          label: "Гонять до зелёного",
          outcome: "Метрики стали шумными.",
          effects: { stability: -10, speed: 5, morale: -4 }
        }
      ]
    },
    {
      title: "Requirement change",
      description: "Бизнес вносит новые требования за шаг до релиза.",
      choices: [
        {
          label: "Пересогласовать scope",
          outcome: "Снизили хаос, но замедлились.",
          effects: { stability: 2, speed: -5, morale: 7 }
        },
        {
          label: "Уйти в форсированный спринт",
          outcome: "Ускорились ценой ресурса команды.",
          effects: { stability: -3, speed: 11, morale: -8 },
          triggersPower: true
        },
        {
          label: "Принять всё без фильтра",
          outcome: "Команда потеряла контроль.",
          effects: { stability: -8, speed: -2, morale: -10 }
        }
      ]
    },
    {
      title: "Business urgent fix",
      description: "Приоритетная правка для VIP-клиента нужна прямо сейчас.",
      choices: [
        {
          label: "Включить QA-гейт",
          outcome: "Стабильность удержана, скорость ниже.",
          effects: { stability: 8, speed: -3, morale: 1 }
        },
        {
          label: "Доставить срочный фикс",
          outcome: "Бизнес доволен, нагрузка выросла.",
          effects: { stability: 2, speed: 9, morale: -6 },
          triggersPower: true
        },
        {
          label: "Пропустить проверку",
          outcome: "Система стала хрупкой.",
          effects: { stability: -15, speed: 8, morale: -5 }
        }
      ]
    },
    {
      title: "Backend down",
      description: "Ключевой backend-сервис недоступен в разгар проверки.",
      choices: [
        {
          label: "Поднять mock-сценарии",
          outcome: "Команда не простаивает.",
          effects: { stability: -2, speed: 6, morale: 3 }
        },
        {
          label: "Синхронизироваться с backend",
          outcome: "Общий план восстановлен.",
          effects: { stability: 9, speed: -2, morale: 2 },
          triggersPower: true
        },
        {
          label: "Ждать обновлений",
          outcome: "Ритм разработки просел.",
          effects: { stability: -12, speed: -9, morale: -6 }
        }
      ]
    },
    {
      title: "CI failure",
      description: "Пайплайн не проходит из-за сломанного шага деплоя.",
      choices: [
        {
          label: "Починить pipeline script",
          outcome: "Контур стабилизирован.",
          effects: { stability: 6, speed: 5, morale: -1 }
        },
        {
          label: "Запустить локальную матрицу",
          outcome: "Время на проверку сократилось.",
          effects: { stability: 4, speed: 9, morale: -3 },
          triggersPower: true
        },
        {
          label: "Выключить CI проверки",
          outcome: "Скорость выросла ценой риска.",
          effects: { stability: -14, speed: 7, morale: -7 }
        }
      ]
    },
    {
      title: "Deadline tomorrow",
      description: "До релиза меньше суток, а задач больше, чем слотов.",
      choices: [
        {
          label: "Срезать неcritical scope",
          outcome: "Баланс метрик улучшился.",
          effects: { stability: 5, speed: 3, morale: 4 }
        },
        {
          label: "Финальный пуш команды",
          outcome: "Темп высокий, нагрузка тоже.",
          effects: { stability: 1, speed: 12, morale: -9 },
          triggersPower: true
        },
        {
          label: "Пообещать всё и сразу",
          outcome: "План стал неуправляемым.",
          effects: { stability: -10, speed: -4, morale: -12 }
        }
      ]
    }
  ];

  class QAHeroGame {
    constructor() {
      this.state = {
        selectedHeroId: null,
        stats: { stability: 70, speed: 70, morale: 70 },
        timeLeft: GAME_DURATION_SECONDS,
        activeEvent: null,
        running: false,
        powerCooldown: 0,
        powerActivations: 0,
        eventsHandled: 0
      };

      this.intervals = {
        timer: null,
        events: null
      };

      this.dom = {
        screens: {
          hero: document.getElementById("hero-screen"),
          game: document.getElementById("game-screen"),
          result: document.getElementById("result-screen")
        },
        heroGrid: document.getElementById("hero-grid"),
        startButton: document.getElementById("start-game"),
        heroImage: document.getElementById("selected-hero-image"),
        heroName: document.getElementById("selected-hero-name"),
        heroPower: document.getElementById("selected-hero-power"),
        timeLeft: document.getElementById("time-left"),
        eventCard: document.getElementById("event-card"),
        eventLog: document.getElementById("event-log"),
        statBars: {
          stability: document.getElementById("stability-bar"),
          speed: document.getElementById("speed-bar"),
          morale: document.getElementById("morale-bar")
        },
        statValues: {
          stability: document.getElementById("stability-value"),
          speed: document.getElementById("speed-value"),
          morale: document.getElementById("morale-value")
        },
        resultTitle: document.getElementById("result-title"),
        resultText: document.getElementById("result-text"),
        resultSummary: document.getElementById("result-summary"),
        playAgainButton: document.getElementById("play-again")
      };

      this.bindEvents();
      this.renderHeroes();
      this.renderStats();
      this.renderEventPlaceholder("Выбери героя и начни смену.");
    }

    bindEvents() {
      this.dom.startButton.addEventListener("click", () => this.startGame());
      this.dom.playAgainButton.addEventListener("click", () => this.resetToHeroSelection());
    }

    renderHeroes() {
      this.dom.heroGrid.innerHTML = "";

      HEROES.forEach((hero) => {
        const card = document.createElement("article");
        card.className = "hero-card";
        card.dataset.heroId = hero.id;

        card.innerHTML = `
          <img class="hero-avatar" src="${hero.image}" alt="${hero.name}">
          <h3>${hero.name}</h3>
          <p class="hero-power">${hero.superpower}</p>
          <p class="hero-desc">${hero.description}</p>
        `;

        card.addEventListener("click", () => this.selectHero(hero.id));

        this.dom.heroGrid.appendChild(card);
      });
    }

    selectHero(heroId) {
      this.state.selectedHeroId = heroId;
      this.dom.startButton.disabled = false;

      const cards = this.dom.heroGrid.querySelectorAll(".hero-card");
      cards.forEach((card) => {
        card.classList.toggle("selected", card.dataset.heroId === heroId);
      });
    }

    getSelectedHero() {
      return HEROES.find((hero) => hero.id === this.state.selectedHeroId);
    }

    startGame() {
      if (!this.state.selectedHeroId) {
        return;
      }

      // Полный сброс runtime-состояния перед новой сессией.
      this.clearIntervals();
      this.state.stats = { stability: 70, speed: 70, morale: 70 };
      this.state.timeLeft = GAME_DURATION_SECONDS;
      this.state.activeEvent = null;
      this.state.running = true;
      this.state.powerCooldown = 0;
      this.state.powerActivations = 0;
      this.state.eventsHandled = 0;

      const hero = this.getSelectedHero();
      this.dom.heroImage.src = hero.image;
      this.dom.heroImage.alt = hero.name;
      this.dom.heroName.textContent = hero.name;
      this.dom.heroPower.textContent = `Суперсила: ${hero.power.name}`;

      this.dom.eventLog.innerHTML = "";
      this.renderStats();
      this.updateTimer();
      this.switchScreen("game");
      this.renderEventPlaceholder("Приготовься: первый инцидент уже на подходе...");
      this.pushLog(`Герой в смене: ${hero.name}. Метрики стартуют с 70/70/70.`);

      this.intervals.timer = setInterval(() => this.tickTimer(), TIMER_INTERVAL_MS);
      this.intervals.events = setInterval(() => this.eventCycle(), EVENT_INTERVAL_MS);
    }

    tickTimer() {
      if (!this.state.running) {
        return;
      }

      this.state.timeLeft -= 1;
      if (this.state.powerCooldown > 0) {
        this.state.powerCooldown -= 1;
      }

      this.updateTimer();

      if (this.state.timeLeft <= 0) {
        this.finishGame(true, "Релиз спасён: команда выдержала 90 секунд под нагрузкой.");
      }
    }

    eventCycle() {
      if (!this.state.running) {
        return;
      }

      // Игрок должен реагировать на события вовремя: промедление штрафуется.
      if (this.state.activeEvent) {
        this.applyEffects(
          { stability: -4, speed: -4, morale: -6 },
          "Решение не принято вовремя: команда теряет ритм.",
          { countAsHandled: false }
        );
        if (!this.state.running) {
          return;
        }
      }

      const template = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      this.state.activeEvent = {
        title: template.title,
        description: template.description,
        choices: template.choices.map((choice) => ({ ...choice }))
      };

      this.renderEventCard();
    }

    renderEventCard() {
      const event = this.state.activeEvent;
      if (!event) {
        this.renderEventPlaceholder("Ожидаем следующий инцидент...");
        return;
      }

      const choiceMarkup = event.choices
        .map((choice, index) => {
          const powerTag = choice.triggersPower ? " ⚡" : "";
          return `<button class="event-btn" data-choice-index="${index}" type="button">${choice.label}${powerTag}</button>`;
        })
        .join("");

      this.dom.eventCard.innerHTML = `
        <h4 class="event-title">${event.title}</h4>
        <p class="event-desc">${event.description}</p>
        <div class="event-actions">${choiceMarkup}</div>
      `;

      const buttons = this.dom.eventCard.querySelectorAll(".event-btn");
      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const choiceIndex = Number(button.dataset.choiceIndex);
          this.resolveChoice(choiceIndex);
        });
      });
    }

    renderEventPlaceholder(text) {
      this.dom.eventCard.innerHTML = `<p class="placeholder-note">${text}</p>`;
    }

    resolveChoice(choiceIndex) {
      if (!this.state.running || !this.state.activeEvent) {
        return;
      }

      const event = this.state.activeEvent;
      const choice = event.choices[choiceIndex];
      if (!choice) {
        return;
      }

      this.applyEffects(choice.effects, `${event.title}: ${choice.outcome}`, { countAsHandled: true });
      if (!this.state.running) {
        return;
      }

      if (choice.triggersPower) {
        this.activateHeroPower();
        if (!this.state.running) {
          return;
        }
      }

      this.state.activeEvent = null;
      this.renderEventPlaceholder("Решение принято. Готовься к следующему инциденту...");
    }

    activateHeroPower() {
      const hero = this.getSelectedHero();
      if (!hero) {
        return;
      }

      // Суперсила не бесконечная: вводим явный cooldown.
      if (this.state.powerCooldown > 0) {
        this.pushLog(
          `${hero.name}: ${hero.power.name} недоступна ещё ${this.state.powerCooldown}с.`
        );
        return;
      }

      this.state.powerCooldown = hero.power.cooldown;
      this.state.powerActivations += 1;
      this.applyEffects(
        hero.power.effects,
        `${hero.name} активирует суперсилу «${hero.power.name}».`,
        { countAsHandled: false }
      );
    }

    applyEffects(effects, reason, options = { countAsHandled: false }) {
      const deltaText = [];

      ["stability", "speed", "morale"].forEach((stat) => {
        const delta = effects[stat] || 0;
        if (delta !== 0) {
          const current = this.state.stats[stat];
          this.state.stats[stat] = this.clamp(current + delta, 0, 100);
          deltaText.push(`${stat}: ${delta > 0 ? "+" : ""}${delta}`);
        }
      });

      if (options.countAsHandled) {
        this.state.eventsHandled += 1;
      }

      this.renderStats();
      this.pushLog(`${reason} [${deltaText.join(", ")}]`);
      this.checkLoseCondition();
    }

    checkLoseCondition() {
      if (!this.state.running) {
        return;
      }

      const failedStat = Object.entries(this.state.stats).find(([, value]) => value <= 0);
      if (!failedStat) {
        return;
      }

      const labels = {
        stability: "Stability",
        speed: "Speed",
        morale: "Team Morale"
      };

      this.finishGame(false, `${labels[failedStat[0]]} упала до нуля. Релиз сорван.`);
    }

    finishGame(isWin, message) {
      if (!this.state.running) {
        return;
      }

      // Критично остановить интервалы, чтобы не было утечек после окончания матча.
      this.state.running = false;
      this.state.activeEvent = null;
      this.clearIntervals();

      const hero = this.getSelectedHero();
      const timeSurvived = GAME_DURATION_SECONDS - this.state.timeLeft;

      this.dom.resultTitle.textContent = isWin ? "Победа" : "Поражение";
      this.dom.resultText.textContent = message;
      this.dom.resultSummary.innerHTML = `
        <li>Герой: ${hero ? hero.name : "—"}</li>
        <li>Прожито секунд: ${timeSurvived}</li>
        <li>Решённых инцидентов: ${this.state.eventsHandled}</li>
        <li>Активаций суперсилы: ${this.state.powerActivations}</li>
        <li>Финальные метрики: Stability ${this.state.stats.stability}, Speed ${this.state.stats.speed}, Team Morale ${this.state.stats.morale}</li>
      `;

      this.switchScreen("result");
    }

    resetToHeroSelection() {
      this.clearIntervals();
      this.state.running = false;
      this.state.activeEvent = null;
      this.state.stats = { stability: 70, speed: 70, morale: 70 };
      this.state.timeLeft = GAME_DURATION_SECONDS;
      this.state.powerCooldown = 0;
      this.state.powerActivations = 0;
      this.state.eventsHandled = 0;

      this.updateTimer();
      this.renderStats();
      this.renderEventPlaceholder("Выбери героя и начни смену.");
      this.switchScreen("hero");
    }

    clearIntervals() {
      if (this.intervals.timer) {
        clearInterval(this.intervals.timer);
        this.intervals.timer = null;
      }

      if (this.intervals.events) {
        clearInterval(this.intervals.events);
        this.intervals.events = null;
      }
    }

    switchScreen(screenName) {
      Object.entries(this.dom.screens).forEach(([key, element]) => {
        element.classList.toggle("active", key === screenName);
      });
    }

    updateTimer() {
      this.dom.timeLeft.textContent = String(this.state.timeLeft);
    }

    renderStats() {
      const statConfig = {
        stability: { bar: this.dom.statBars.stability, value: this.dom.statValues.stability },
        speed: { bar: this.dom.statBars.speed, value: this.dom.statValues.speed },
        morale: { bar: this.dom.statBars.morale, value: this.dom.statValues.morale }
      };

      Object.entries(statConfig).forEach(([key, ref]) => {
        const value = this.state.stats[key];
        ref.value.textContent = String(value);
        ref.bar.style.width = `${value}%`;
        ref.bar.classList.toggle("warning", value <= 45 && value > 20);
        ref.bar.classList.toggle("danger", value <= 20);
      });
    }

    pushLog(text) {
      const item = document.createElement("li");
      item.textContent = text;
      this.dom.eventLog.prepend(item);

      while (this.dom.eventLog.children.length > 10) {
        this.dom.eventLog.removeChild(this.dom.eventLog.lastChild);
      }
    }

    clamp(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }
  }

  new QAHeroGame();
})();
