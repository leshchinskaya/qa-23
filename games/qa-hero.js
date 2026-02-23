const GAME_DURATION_SECONDS = 90;
const EVENT_INTERVAL_MS = 3000;
const TIMER_INTERVAL_MS = 1000;

const EVENTS = [
  {
    title: "Critical bug",
    description: "Критический баг: данные пользователя не сохраняются в профиле.",
    choices: [
      {
        label: "Откатить проблемный патч",
        outcome: "Риск снижен, но скорость команды упала.",
        effects: { stability: 10, speed: -8, morale: -2 }
      },
      {
        label: "Собрать точечный хотфикс",
        outcome: "Исправление доставлено под давлением.",
        effects: { stability: 5, speed: 6, morale: -5 },
        triggersPower: true
      },
      {
        label: "Отложить до утра",
        outcome: "Релиз стал хрупким.",
        effects: { stability: -18, speed: 2, morale: -8 }
      }
    ]
  },
  {
    title: "Flaky test",
    description: "Флейковый тест валит пайплайн нерегулярно.",
    choices: [
      {
        label: "Изолировать флейк",
        outcome: "Контур стал стабильнее.",
        effects: { stability: 8, speed: -4, morale: 2 }
      },
      {
        label: "Срочно переписать тест",
        outcome: "Флейк устранён, но команда устала.",
        effects: { stability: 11, speed: -2, morale: -4 },
        triggersPower: true
      },
      {
        label: "Ретрай до зелёного",
        outcome: "Сигнал качества искажен.",
        effects: { stability: -10, speed: 5, morale: -4 }
      }
    ]
  },
  {
    title: "Requirement change",
    description: "Бизнес внёс изменения за час до релиза.",
    choices: [
      {
        label: "Пересогласовать scope",
        outcome: "Хаос снижен, темп просел.",
        effects: { stability: 3, speed: -6, morale: 7 }
      },
      {
        label: "Форсировать задачу",
        outcome: "Ускорились ценой энергии команды.",
        effects: { stability: -3, speed: 10, morale: -8 },
        triggersPower: true
      },
      {
        label: "Принять все изменения",
        outcome: "Система стала менее управляемой.",
        effects: { stability: -8, speed: -1, morale: -10 }
      }
    ]
  },
  {
    title: "Business urgent fix",
    description: "Нужен срочный фикс для ключевого клиента.",
    choices: [
      {
        label: "Включить QA-гейт",
        outcome: "Качество защищено.",
        effects: { stability: 8, speed: -3, morale: 1 }
      },
      {
        label: "Доставить ASAP",
        outcome: "Клиент доволен, команда перегружена.",
        effects: { stability: 2, speed: 9, morale: -6 },
        triggersPower: true
      },
      {
        label: "Пуш без верификации",
        outcome: "Скорость выросла, риски тоже.",
        effects: { stability: -15, speed: 8, morale: -6 }
      }
    ]
  },
  {
    title: "Backend down",
    description: "Backend-сервис недоступен, сценарии не проходят.",
    choices: [
      {
        label: "Переключиться на mock",
        outcome: "Команда не простаивает.",
        effects: { stability: -2, speed: 6, morale: 3 }
      },
      {
        label: "Созвониться с backend",
        outcome: "Общий план восстановлен.",
        effects: { stability: 9, speed: -2, morale: 2 },
        triggersPower: true
      },
      {
        label: "Ждать, пока поднимут",
        outcome: "Время потеряно.",
        effects: { stability: -12, speed: -9, morale: -7 }
      }
    ]
  },
  {
    title: "CI failure",
    description: "CI упал на шаге деплоя и блокирует релиз.",
    choices: [
      {
        label: "Починить pipeline script",
        outcome: "Проверки стабилизированы.",
        effects: { stability: 6, speed: 5, morale: -1 }
      },
      {
        label: "Локальный прогон матрицы",
        outcome: "Сократили время ожидания.",
        effects: { stability: 4, speed: 9, morale: -3 },
        triggersPower: true
      },
      {
        label: "Отключить проверки",
        outcome: "Темп вырос, но качество просело.",
        effects: { stability: -14, speed: 7, morale: -7 }
      }
    ]
  },
  {
    title: "Deadline tomorrow",
    description: "До релиза меньше суток, а дефектов всё ещё много.",
    choices: [
      {
        label: "Урезать non-critical scope",
        outcome: "Команда сосредоточилась на важном.",
        effects: { stability: 5, speed: 4, morale: 4 }
      },
      {
        label: "Финальный пуш команды",
        outcome: "Темп высокий, мораль страдает.",
        effects: { stability: 1, speed: 12, morale: -9 },
        triggersPower: true
      },
      {
        label: "Обещать всё и сразу",
        outcome: "Нагрузка вышла из-под контроля.",
        effects: { stability: -10, speed: -4, morale: -12 }
      }
    ]
  },
  {
    title: "Analytics broken",
    description: "Сломана аналитика, бизнес не видит конверсию.",
    choices: [
      {
        label: "Поставить диагностические события",
        outcome: "Причина почти найдена.",
        effects: { stability: 4, speed: -2, morale: 3 }
      },
      {
        label: "Катнуть быструю правку",
        outcome: "Метрики восстановлены на ходу.",
        effects: { stability: 3, speed: 8, morale: -2 },
        triggersPower: true
      },
      {
        label: "Игнорировать до релиза",
        outcome: "Растёт неопределённость.",
        effects: { stability: -10, speed: 1, morale: -8 }
      }
    ]
  },
  {
    title: "Payment issues",
    description: "Платежи иногда зависают после подтверждения.",
    choices: [
      {
        label: "Включить блокирующий чеклист",
        outcome: "Риски снижаются.",
        effects: { stability: 9, speed: -5, morale: 1 }
      },
      {
        label: "Запустить hotfix релиз",
        outcome: "Проблему локализовали в проде.",
        effects: { stability: 6, speed: 6, morale: -4 },
        triggersPower: true
      },
      {
        label: "Оставить как есть",
        outcome: "Бизнес получает эскалацию.",
        effects: { stability: -16, speed: -2, morale: -10 }
      }
    ]
  },
  {
    title: "Pushes misrouted",
    description: "Пуши попали не в тот release-branch.",
    choices: [
      {
        label: "Собрать чистый release-кандидат",
        outcome: "Структура веток восстановлена.",
        effects: { stability: 8, speed: -4, morale: 2 }
      },
      {
        label: "Оперативный cherry-pick",
        outcome: "Успели вернуть порядок.",
        effects: { stability: 4, speed: 8, morale: -3 },
        triggersPower: true
      },
      {
        label: "Ручной разбор после релиза",
        outcome: "Баги попали в критический контур.",
        effects: { stability: -13, speed: -3, morale: -9 }
      }
    ]
  }
];

class QaHeroRuntime {
  constructor(container, globalState, callbacks) {
    this.container = container;
    this.hero = globalState.hero;
    this.callbacks = callbacks;

    this.state = {
      stats: { stability: 70, speed: 70, morale: 70 },
      timeLeft: GAME_DURATION_SECONDS,
      running: true,
      paused: false,
      activeEvent: null,
      powerCooldown: 0,
      eventsHandled: 0,
      powerActivations: 0,
      leaksPunished: 0
    };

    this.intervals = {
      timer: null,
      event: null
    };

    this.renderBase();
    this.startIntervals();
  }

  renderBase() {
    this.container.innerHTML = `
      <section class="game-shell">
        <header class="game-hud">
          <div class="game-hero-chip">
            <img src="${this.hero.image}" alt="${this.hero.name}">
            <div>
              <p><strong>${this.hero.name}</strong></p>
              <p class="chip-sub">Суперсила: ${this.hero.superpower}</p>
            </div>
          </div>
          <div class="hud-metrics">
            <span class="metric">До релиза: <strong id="qa-hero-time">${GAME_DURATION_SECONDS}</strong>с</span>
            <span class="metric">КД суперсилы: <strong id="qa-hero-cd">0</strong>с</span>
          </div>
        </header>

        <div class="progress-row">
          <div class="progress-label"><span>Stability</span><strong id="qa-stat-stability">70</strong></div>
          <div class="progress"><span id="qa-bar-stability" style="width:70%"></span></div>
        </div>
        <div class="progress-row">
          <div class="progress-label"><span>Speed</span><strong id="qa-stat-speed">70</strong></div>
          <div class="progress"><span id="qa-bar-speed" style="width:70%"></span></div>
        </div>
        <div class="progress-row">
          <div class="progress-label"><span>Team Morale</span><strong id="qa-stat-morale">70</strong></div>
          <div class="progress"><span id="qa-bar-morale" style="width:70%"></span></div>
        </div>

        <article class="game-event-card" id="qa-event-card">
          <h3>Инцидент</h3>
          <p>Первый инцидент уже в пути. Подготовь защиту релиза.</p>
        </article>

        <article class="game-event-card">
          <h3>Лента событий</h3>
          <ul id="qa-log" class="log-list"></ul>
        </article>
      </section>
    `;

    this.dom = {
      time: this.container.querySelector("#qa-hero-time"),
      cooldown: this.container.querySelector("#qa-hero-cd"),
      eventCard: this.container.querySelector("#qa-event-card"),
      log: this.container.querySelector("#qa-log"),
      stats: {
        stability: {
          text: this.container.querySelector("#qa-stat-stability"),
          bar: this.container.querySelector("#qa-bar-stability")
        },
        speed: {
          text: this.container.querySelector("#qa-stat-speed"),
          bar: this.container.querySelector("#qa-bar-speed")
        },
        morale: {
          text: this.container.querySelector("#qa-stat-morale"),
          bar: this.container.querySelector("#qa-bar-morale")
        }
      }
    };

    this.dom.eventCard.addEventListener("click", (event) => {
      const button = event.target.closest("[data-choice]");
      if (!button) {
        return;
      }
      const index = Number(button.dataset.choice);
      this.resolveChoice(index);
    });
  }

  startIntervals() {
    this.intervals.timer = setInterval(() => {
      if (!this.state.running || this.state.paused) {
        return;
      }

      this.state.timeLeft -= 1;
      if (this.state.powerCooldown > 0) {
        this.state.powerCooldown -= 1;
      }

      this.updateHud();

      if (this.state.timeLeft <= 0) {
        this.finish(true, "Релиз спасён. Команда выстояла 90 секунд.");
      }
    }, TIMER_INTERVAL_MS);

    this.intervals.event = setInterval(() => {
      if (!this.state.running || this.state.paused) {
        return;
      }

      if (this.state.activeEvent) {
        this.state.leaksPunished += 1;
        this.applyEffects(
          { stability: -4, speed: -4, morale: -6 },
          "Решение не принято вовремя: потерян темп релизной команды."
        );
        if (!this.state.running) {
          return;
        }
      }

      const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      this.state.activeEvent = {
        title: event.title,
        description: event.description,
        choices: event.choices.map((choice) => ({ ...choice }))
      };
      this.renderEvent();
    }, EVENT_INTERVAL_MS);
  }

  updateHud() {
    this.dom.time.textContent = String(this.state.timeLeft);
    this.dom.cooldown.textContent = String(this.state.powerCooldown);

    Object.entries(this.state.stats).forEach(([key, value]) => {
      const ref = this.dom.stats[key];
      ref.text.textContent = String(value);
      ref.bar.style.width = `${value}%`;
      ref.bar.classList.toggle("warning", value <= 45 && value > 20);
      ref.bar.classList.toggle("danger", value <= 20);
    });
  }

  renderEvent() {
    if (!this.state.activeEvent) {
      this.dom.eventCard.innerHTML = "<h3>Инцидент</h3><p>Ожидаем следующий инцидент...</p>";
      return;
    }

    const choices = this.state.activeEvent.choices
      .map((choice, index) => `
        <button type="button" class="btn" data-choice="${index}">
          ${choice.label}${choice.triggersPower ? " ⚡" : ""}
        </button>
      `)
      .join("");

    this.dom.eventCard.innerHTML = `
      <h3>${this.state.activeEvent.title}</h3>
      <p>${this.state.activeEvent.description}</p>
      <div class="event-actions">${choices}</div>
    `;
  }

  resolveChoice(index) {
    if (!this.state.running || this.state.paused || !this.state.activeEvent) {
      return;
    }

    const choice = this.state.activeEvent.choices[index];
    if (!choice) {
      return;
    }

    this.state.eventsHandled += 1;
    this.applyEffects(choice.effects, `${this.state.activeEvent.title}: ${choice.outcome}`);
    if (!this.state.running) {
      return;
    }

    if (choice.triggersPower) {
      this.activatePower();
      if (!this.state.running) {
        return;
      }
    }

    this.state.activeEvent = null;
    this.renderEvent();
  }

  activatePower() {
    if (this.state.powerCooldown > 0) {
      this.pushLog(`Суперсила ещё недоступна: ${this.state.powerCooldown}с.`);
      return;
    }

    this.state.powerCooldown = 12;
    this.state.powerActivations += 1;

    this.applyEffects(
      {
        stability: this.hero.powerEffects.stability || 0,
        speed: this.hero.powerEffects.speed || 0,
        morale: this.hero.powerEffects.morale || 0
      },
      `${this.hero.name} активирует «${this.hero.superpower}».`
    );
  }

  applyEffects(effects, reason) {
    const statKeys = ["stability", "speed", "morale"];
    const deltaChunks = [];

    statKeys.forEach((key) => {
      const delta = effects[key] || 0;
      if (!delta) {
        return;
      }
      this.state.stats[key] = clamp(this.state.stats[key] + delta, 0, 100);
      deltaChunks.push(`${key}: ${delta > 0 ? "+" : ""}${delta}`);
    });

    this.pushLog(`${reason} [${deltaChunks.join(", ")}]`);
    this.updateHud();

    const failed = Object.entries(this.state.stats).find(([, value]) => value <= 0);
    if (failed) {
      this.finish(false, `${failed[0]} упал до нуля. Релиз сорван.`);
    }
  }

  pushLog(text) {
    const line = document.createElement("li");
    line.textContent = text;
    this.dom.log.prepend(line);

    while (this.dom.log.children.length > 10) {
      this.dom.log.lastElementChild.remove();
    }
  }

  finish(win, message) {
    if (!this.state.running) {
      return;
    }

    this.state.running = false;
    this.state.activeEvent = null;
    this.clearIntervals();

    const timeSurvived = GAME_DURATION_SECONDS - this.state.timeLeft;
    const statSum = this.state.stats.stability + this.state.stats.speed + this.state.stats.morale;
    const score = Math.round(timeSurvived * 14 + statSum * 2 + this.state.eventsHandled * 25);

    let coins;
    if (win) {
      coins = clamp(Math.round(50 + (timeSurvived / GAME_DURATION_SECONDS) * 20 + this.state.stats.stability * 0.12), 50, 80);
      this.callbacks.onGameWin({
        message,
        score,
        coins,
        playTime: timeSurvived,
        kills: this.state.eventsHandled,
        noDamageSeconds: 0,
        waveReached: 0
      });
    } else {
      coins = clamp(Math.round(10 + (timeSurvived / GAME_DURATION_SECONDS) * 20), 10, 30);
      this.callbacks.onGameOver({
        message,
        score,
        coins,
        playTime: timeSurvived,
        kills: this.state.eventsHandled,
        noDamageSeconds: 0,
        waveReached: 0
      });
    }
  }

  togglePause() {
    if (!this.state.running) {
      return;
    }

    this.state.paused = !this.state.paused;
    if (this.state.paused) {
      this.pushLog("Пауза включена.");
      this.dom.eventCard.innerHTML = "<h3>Пауза</h3><p>Матч приостановлен. Нажми P или кнопку паузы снова.</p>";
      return;
    }

    this.pushLog("Пауза снята.");
    this.renderEvent();
  }

  restart() {
    this.clearIntervals();
    this.state = {
      stats: { stability: 70, speed: 70, morale: 70 },
      timeLeft: GAME_DURATION_SECONDS,
      running: true,
      paused: false,
      activeEvent: null,
      powerCooldown: 0,
      eventsHandled: 0,
      powerActivations: 0,
      leaksPunished: 0
    };

    this.container.querySelector("#qa-log").innerHTML = "";
    this.updateHud();
    this.renderEvent();
    this.startIntervals();
    this.pushLog("Матч перезапущен.");
  }

  clearIntervals() {
    if (this.intervals.timer) {
      clearInterval(this.intervals.timer);
      this.intervals.timer = null;
    }
    if (this.intervals.event) {
      clearInterval(this.intervals.event);
      this.intervals.event = null;
    }
  }

  destroy() {
    this.state.running = false;
    this.clearIntervals();
    this.container.innerHTML = "";
  }

  getControls() {
    return {
      togglePause: () => this.togglePause(),
      restart: () => this.restart()
    };
  }
}

let runtime = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function init(containerEl, globalState, callbacks) {
  if (runtime) {
    runtime.destroy();
  }
  runtime = new QaHeroRuntime(containerEl, globalState, callbacks);
  return runtime.getControls();
}

export function destroy() {
  if (!runtime) {
    return;
  }
  runtime.destroy();
  runtime = null;
}
