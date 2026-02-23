const WIDTH = 960;
const HEIGHT = 500;
const PATH_Y = 250;

const TOWER_TYPES = {
  manual: {
    id: "manual",
    title: "Manual QA",
    cost: 25,
    range: 155,
    fireRate: 1.05,
    damage: 17,
    projectileSpeed: 280,
    color: "#47e9ff"
  },
  aqa: {
    id: "aqa",
    title: "AQA",
    cost: 35,
    range: 180,
    fireRate: 0.42,
    damage: 9,
    projectileSpeed: 420,
    color: "#57f5a3"
  },
  sdet: {
    id: "sdet",
    title: "SDET",
    cost: 50,
    range: 200,
    fireRate: 1.25,
    damage: 22,
    projectileSpeed: 340,
    splashRadius: 60,
    color: "#ffc26a"
  }
};

const DIFFICULTY_PRESETS = {
  easy: {
    id: "easy",
    title: "Лёгкая",
    maxWaves: 6,
    baseHealth: 120,
    startMoney: 115,
    enemyCountMultiplier: 0.85,
    enemyHpMultiplier: 0.84,
    enemySpeedMultiplier: 0.92,
    enemyDamageMultiplier: 0.82,
    spawnGapMultiplier: 1.14,
    bountyMultiplier: 0.94,
    scoreMultiplier: 0.9,
    coinMultiplier: 0.9
  },
  normal: {
    id: "normal",
    title: "Нормальная",
    maxWaves: 8,
    baseHealth: 100,
    startMoney: 90,
    enemyCountMultiplier: 1,
    enemyHpMultiplier: 1,
    enemySpeedMultiplier: 1,
    enemyDamageMultiplier: 1,
    spawnGapMultiplier: 1,
    bountyMultiplier: 1,
    scoreMultiplier: 1,
    coinMultiplier: 1
  },
  hard: {
    id: "hard",
    title: "Сложная",
    maxWaves: 10,
    baseHealth: 85,
    startMoney: 78,
    enemyCountMultiplier: 1.2,
    enemyHpMultiplier: 1.22,
    enemySpeedMultiplier: 1.14,
    enemyDamageMultiplier: 1.25,
    spawnGapMultiplier: 0.9,
    bountyMultiplier: 1.15,
    scoreMultiplier: 1.24,
    coinMultiplier: 1.22
  }
};

class QaTowerDefense {
  constructor(container, globalState, callbacks) {
    this.container = container;
    this.hero = globalState.hero;
    this.audio = globalState.audio || null;
    this.ability = this.hero?.abilities?.tower || {
      name: this.hero.superpower,
      cooldown: 18,
      duration: 6,
      fireRateMultiplier: 1.22,
      damageMultiplier: 1.22,
      rangeBonus: 18,
      instantCredits: 12,
      baseHeal: 5,
      bountyMultiplier: 1.08
    };
    this.difficulty = getDifficultyPreset(globalState.towerDifficulty);
    this.callbacks = callbacks;

    this.gridCells = this.buildGrid();

    this.clickHandler = (event) => this.onCanvasClick(event);
    this.keydownHandler = (event) => this.onKeyDown(event);

    this.heroImage = new Image();
    this.heroImage.src = this.hero.image;

    this.renderBase();
    this.resetRuntime();
    this.start();
  }

  renderBase() {
    this.container.innerHTML = `
      <section class="game-shell">
        <header class="game-hud">
          <div class="game-hero-chip">
            <img src="${this.hero.image}" alt="${this.hero.name}">
            <div>
              <p><strong>${this.hero.name}</strong></p>
              <p class="chip-sub">Оборона прода</p>
            </div>
          </div>
          <div class="hud-metrics">
            <span class="metric">Прод HP: <strong id="td-base">${this.difficulty.baseHealth}</strong></span>
            <span class="metric">Волна: <strong id="td-wave">1</strong>/${this.difficulty.maxWaves}</span>
            <span class="metric">Кредиты: <strong id="td-money">${this.difficulty.startMoney}</strong></span>
            <span class="metric">Сложность: <strong id="td-difficulty">${this.difficulty.title}</strong></span>
            <span class="metric">Счёт: <strong id="td-score">0</strong></span>
          </div>
        </header>

        <div class="intro-actions" id="td-tower-buttons">
          <button type="button" class="btn" data-tower="manual">1: Manual QA (25)</button>
          <button type="button" class="btn" data-tower="aqa">2: AQA (35)</button>
          <button type="button" class="btn" data-tower="sdet">3: SDET (50)</button>
          <span class="metric">Выбрано: <strong id="td-selected">Manual QA</strong></span>
        </div>

        <div class="progress-row">
          <div class="progress-label"><span>${this.ability.name} (Shift)</span><strong id="td-power-label">Готово</strong></div>
          <div class="progress"><span id="td-power-bar" style="width:100%"></span></div>
        </div>

        <div class="canvas-wrap">
          <canvas id="td-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="overlay-note" id="td-overlay" hidden>Пауза</div>
        </div>
      </section>
    `;

    this.dom = {
      canvas: this.container.querySelector("#td-canvas"),
      overlay: this.container.querySelector("#td-overlay"),
      base: this.container.querySelector("#td-base"),
      wave: this.container.querySelector("#td-wave"),
      money: this.container.querySelector("#td-money"),
      score: this.container.querySelector("#td-score"),
      difficulty: this.container.querySelector("#td-difficulty"),
      selected: this.container.querySelector("#td-selected"),
      powerLabel: this.container.querySelector("#td-power-label"),
      powerBar: this.container.querySelector("#td-power-bar"),
      towerButtons: this.container.querySelector("#td-tower-buttons")
    };

    this.ctx = this.dom.canvas.getContext("2d");

    this.dom.towerButtons.querySelectorAll("[data-tower]").forEach((button) => {
      button.addEventListener("click", () => {
        this.state.selectedTower = button.dataset.tower;
        this.updateHud();
      });
    });
  }

  resetRuntime() {
    this.state = {
      running: true,
      paused: false,
      baseHealth: this.difficulty.baseHealth,
      money: this.difficulty.startMoney,
      score: 0,
      kills: 0,
      elapsed: 0,
      wave: 1,
      wavesCleared: 0,
      waveDelay: 1.5,
      selectedTower: "manual",
      powerCooldown: 0,
      powerActive: 0,
      fireSoundCooldown: 0,
      enemiesToSpawn: 0,
      spawnGap: 0,
      spawnTimer: 0,
      enemyTemplate: null,
      lastTime: 0,
      rafId: null
    };

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];

    this.configureWave(this.state.wave);
    this.updateHud();
  }

  start() {
    this.dom.canvas.addEventListener("click", this.clickHandler);
    window.addEventListener("keydown", this.keydownHandler);

    this.state.lastTime = performance.now();
    this.state.rafId = requestAnimationFrame((time) => this.frame(time));
  }

  buildGrid() {
    const cells = [];
    const startX = 100;
    const spacing = 84;
    const rows = [150, 340];
    for (let row = 0; row < rows.length; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        cells.push({
          x: startX + col * spacing,
          y: rows[row],
          r: 22,
          occupied: false
        });
      }
    }
    return cells;
  }

  onKeyDown(event) {
    if (event.key === "1") {
      this.state.selectedTower = "manual";
      this.updateHud();
    }
    if (event.key === "2") {
      this.state.selectedTower = "aqa";
      this.updateHud();
    }
    if (event.key === "3") {
      this.state.selectedTower = "sdet";
      this.updateHud();
    }
    if (event.key === "Shift") {
      this.tryActivatePower();
    }
  }

  onCanvasClick(event) {
    if (!this.state.running || this.state.paused) {
      return;
    }

    const rect = this.dom.canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (WIDTH / rect.width);
    const y = (event.clientY - rect.top) * (HEIGHT / rect.height);

    let selectedCell = null;
    let bestDist = Infinity;

    this.gridCells.forEach((cell) => {
      if (cell.occupied) {
        return;
      }
      const dist = distance(x, y, cell.x, cell.y);
      if (dist < cell.r + 10 && dist < bestDist) {
        bestDist = dist;
        selectedCell = cell;
      }
    });

    if (!selectedCell) {
      return;
    }

    const towerType = TOWER_TYPES[this.state.selectedTower];
    if (this.state.money < towerType.cost) {
      return;
    }

    this.state.money -= towerType.cost;
    selectedCell.occupied = true;

    this.towers.push({
      x: selectedCell.x,
      y: selectedCell.y,
      type: towerType,
      cooldown: Math.random() * 0.2
    });

    this.audio?.play?.("tower-place");
    this.updateHud();
  }

  frame(now) {
    if (!this.state.running) {
      return;
    }

    const dt = Math.min(0.032, (now - this.state.lastTime) / 1000);
    this.state.lastTime = now;

    if (!this.state.paused) {
      this.update(dt);
      this.draw();
    }

    this.state.rafId = requestAnimationFrame((time) => this.frame(time));
  }

  configureWave(waveNumber) {
    const count = Math.max(4, Math.round((6 + waveNumber * 3) * this.difficulty.enemyCountMultiplier));
    const hp = Math.round((26 + waveNumber * 16) * this.difficulty.enemyHpMultiplier);
    const speed = Math.round((35 + waveNumber * 8) * this.difficulty.enemySpeedMultiplier);
    const damage = Math.max(1, Math.round((4 + Math.floor(waveNumber / 2)) * this.difficulty.enemyDamageMultiplier));
    const bounty = Math.max(3, Math.round((8 + waveNumber * 2) * this.difficulty.bountyMultiplier));

    this.state.enemiesToSpawn = count;
    this.state.spawnGap = Math.max(0.34, (1.2 - waveNumber * 0.07) * this.difficulty.spawnGapMultiplier);
    this.state.spawnTimer = 0.3;
    this.state.enemyTemplate = {
      hp,
      maxHp: hp,
      speed,
      damage,
      bounty,
      radius: 16 + Math.floor(waveNumber / 2)
    };
  }

  spawnEnemy() {
    const model = this.state.enemyTemplate;
    this.enemies.push({
      x: -30,
      y: PATH_Y,
      hp: model.hp,
      maxHp: model.maxHp,
      speed: model.speed,
      damage: model.damage,
      bounty: model.bounty,
      radius: model.radius
    });
  }

  update(dt) {
    this.state.elapsed += dt;
    if (this.state.powerCooldown > 0) {
      this.state.powerCooldown = Math.max(0, this.state.powerCooldown - dt);
    }
    if (this.state.powerActive > 0) {
      this.state.powerActive = Math.max(0, this.state.powerActive - dt);
    }
    if (this.state.fireSoundCooldown > 0) {
      this.state.fireSoundCooldown = Math.max(0, this.state.fireSoundCooldown - dt);
    }

    if (this.state.waveDelay > 0) {
      this.state.waveDelay -= dt;
    } else if (this.state.enemiesToSpawn > 0) {
      this.state.spawnTimer -= dt;
      if (this.state.spawnTimer <= 0) {
        this.state.enemiesToSpawn -= 1;
        this.spawnEnemy();
        this.state.spawnTimer = this.state.spawnGap;
      }
    }

    this.updateEnemies(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.updateHud();

    if (this.state.baseHealth <= 0) {
      this.finish(false, "Прод не выдержал натиск багов.");
      return;
    }

    if (this.state.enemiesToSpawn === 0 && this.enemies.length === 0 && this.projectiles.length === 0 && this.state.waveDelay <= 0) {
      this.state.wavesCleared = Math.max(this.state.wavesCleared, this.state.wave);
      if (this.state.wave >= this.difficulty.maxWaves) {
        this.finish(true, `Все ${this.difficulty.maxWaves} волн отражены. Прод защищён.`);
        return;
      }
      this.state.wave += 1;
      this.state.waveDelay = 2;
      this.configureWave(this.state.wave);
      this.audio?.play?.("tower-wave");
    }
  }

  updateEnemies(dt) {
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.x += enemy.speed * dt;

      if (enemy.x - enemy.radius > WIDTH - 20) {
        this.state.baseHealth = clamp(this.state.baseHealth - enemy.damage, 0, this.difficulty.baseHealth);
        this.enemies.splice(i, 1);
        continue;
      }

      if (enemy.hp <= 0) {
        const bounty = this.state.powerActive > 0
          ? Math.round(enemy.bounty * this.ability.bountyMultiplier)
          : enemy.bounty;
        this.state.money += bounty;
        this.state.score += 30 + enemy.bounty * 3;
        this.state.kills += 1;
        this.enemies.splice(i, 1);
      }
    }
  }

  updateTowers(dt) {
    this.towers.forEach((tower) => {
      tower.cooldown -= dt;
      if (tower.cooldown > 0) {
        return;
      }

      const target = this.findTargetForTower(tower);
      if (!target) {
        return;
      }

      const haste = this.state.powerActive > 0 ? this.ability.fireRateMultiplier : 1;
      tower.cooldown = tower.type.fireRate / haste;

      const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
      const damage = this.state.powerActive > 0
        ? tower.type.damage * this.ability.damageMultiplier
        : tower.type.damage;
      this.projectiles.push({
        x: tower.x,
        y: tower.y,
        vx: Math.cos(angle) * tower.type.projectileSpeed,
        vy: Math.sin(angle) * tower.type.projectileSpeed,
        damage,
        splashRadius: tower.type.splashRadius || 0,
        color: tower.type.color
      });
      if (this.state.fireSoundCooldown <= 0) {
        this.audio?.play?.("tower-fire");
        this.state.fireSoundCooldown = 0.05;
      }
    });
  }

  findTargetForTower(tower) {
    let best = null;
    let bestProgress = -Infinity;

    this.enemies.forEach((enemy) => {
      const dist = distance(tower.x, tower.y, enemy.x, enemy.y);
      const rangeBonus = this.state.powerActive > 0 ? this.ability.rangeBonus : 0;
      if (dist > tower.type.range + rangeBonus) {
        return;
      }
      if (enemy.x > bestProgress) {
        best = enemy;
        bestProgress = enemy.x;
      }
    });

    return best;
  }

  updateProjectiles(dt) {
    for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.projectiles[i];
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      if (projectile.x < -40 || projectile.x > WIDTH + 40 || projectile.y < -40 || projectile.y > HEIGHT + 40) {
        this.projectiles.splice(i, 1);
        continue;
      }

      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = this.enemies[j];
        if (distance(projectile.x, projectile.y, enemy.x, enemy.y) <= enemy.radius + 4) {
          if (projectile.splashRadius > 0) {
            this.enemies.forEach((candidate) => {
              const dist = distance(projectile.x, projectile.y, candidate.x, candidate.y);
              if (dist <= projectile.splashRadius) {
                candidate.hp -= projectile.damage;
              }
            });
          } else {
            enemy.hp -= projectile.damage;
          }
          hit = true;
          this.audio?.play?.("tower-hit");
          break;
        }
      }

      if (hit) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  updateHud() {
    this.dom.base.textContent = String(Math.round(this.state.baseHealth));
    this.dom.wave.textContent = `${this.state.wave}`;
    this.dom.money.textContent = String(Math.round(this.state.money));
    this.dom.score.textContent = String(Math.round(this.state.score));
    this.dom.difficulty.textContent = this.difficulty.title;
    this.dom.selected.textContent = TOWER_TYPES[this.state.selectedTower].title;

    if (this.state.powerActive > 0) {
      this.dom.powerLabel.textContent = `Активно ${this.state.powerActive.toFixed(1)}с`;
      this.dom.powerBar.style.width = "100%";
      return;
    }

    if (this.state.powerCooldown <= 0) {
      this.dom.powerLabel.textContent = "Готово";
      this.dom.powerBar.style.width = "100%";
      return;
    }

    const progress = clamp(1 - this.state.powerCooldown / this.ability.cooldown, 0, 1);
    this.dom.powerLabel.textContent = `${this.state.powerCooldown.toFixed(1)}с`;
    this.dom.powerBar.style.width = `${Math.round(progress * 100)}%`;
  }

  tryActivatePower() {
    if (!this.state.running || this.state.paused || this.state.powerCooldown > 0) {
      return;
    }
    this.state.powerActive = this.ability.duration;
    this.state.powerCooldown = this.ability.cooldown;
    this.state.money += this.ability.instantCredits;
    this.state.baseHealth = clamp(this.state.baseHealth + this.ability.baseHeal, 0, this.difficulty.baseHealth);
    this.audio?.play?.("ability");
    this.updateHud();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, "#09162a");
    gradient.addColorStop(1, "#060d1b");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = "rgba(71, 233, 255, 0.14)";
    for (let y = 0; y < HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }

    ctx.fillStyle = "rgba(255, 88, 108, 0.15)";
    ctx.fillRect(0, PATH_Y - 28, WIDTH - 70, 56);
    ctx.fillStyle = "#ff6b7f";
    ctx.fillRect(WIDTH - 70, PATH_Y - 40, 50, 80);
    ctx.fillStyle = "#ffe1e6";
    ctx.font = "13px Trebuchet MS";
    ctx.fillText("ПРОД", WIDTH - 62, PATH_Y + 4);

    this.gridCells.forEach((cell) => {
      ctx.beginPath();
      ctx.arc(cell.x, cell.y, cell.r, 0, Math.PI * 2);
      ctx.fillStyle = cell.occupied ? "rgba(87, 245, 163, 0.24)" : "rgba(71, 233, 255, 0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(71, 233, 255, 0.3)";
      ctx.stroke();
    });

    this.towers.forEach((tower) => {
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, 17, 0, Math.PI * 2);
      ctx.fillStyle = tower.type.color;
      ctx.fill();
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "11px Trebuchet MS";
      ctx.fillText(tower.type.id.toUpperCase(), tower.x - 15, tower.y + 30);
    });

    this.projectiles.forEach((projectile) => {
      ctx.beginPath();
      ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = projectile.color;
      ctx.fill();
    });

    this.enemies.forEach((enemy) => {
      ctx.beginPath();
      ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#ff926a";
      ctx.fill();

      const ratio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2, 4);
      ctx.fillStyle = "#57f5a3";
      ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 8, enemy.radius * 2 * ratio, 4);
    });

    if (this.heroImage.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(42, 42, 24, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.heroImage, 18, 18, 48, 48);
      ctx.restore();
      ctx.strokeStyle = "#57f5a3";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(42, 42, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  finish(win, message) {
    if (!this.state.running) {
      return;
    }

    this.state.running = false;
    const playTime = Math.floor(this.state.elapsed);
    const waveReached = Math.max(this.state.wavesCleared, this.state.wave);
    const rawScore = this.state.score + waveReached * 220 + this.state.baseHealth * 3;
    const score = Math.round(rawScore * this.difficulty.scoreMultiplier);
    const baseCoins = win
      ? clamp(45 + waveReached * 6 + this.state.baseHealth * 0.15, 45, 130)
      : clamp(15 + waveReached * 4, 15, 70);
    const coins = Math.round(clamp(baseCoins * this.difficulty.coinMultiplier, 12, 180));

    const payload = {
      message,
      score,
      coins,
      playTime,
      kills: this.state.kills,
      noDamageSeconds: 0,
      waveReached
    };

    if (win) {
      this.callbacks.onGameWin(payload);
    } else {
      this.callbacks.onGameOver(payload);
    }
  }

  togglePause() {
    if (!this.state.running) {
      return;
    }

    this.state.paused = !this.state.paused;
    this.dom.overlay.hidden = !this.state.paused;
    this.dom.overlay.textContent = this.state.paused ? "Пауза" : "";
  }

  restart() {
    this.gridCells.forEach((cell) => {
      cell.occupied = false;
    });
    this.resetRuntime();
    this.dom.overlay.hidden = true;
  }

  destroy() {
    if (!this.state) {
      return;
    }

    this.state.running = false;
    if (this.state.rafId) {
      cancelAnimationFrame(this.state.rafId);
      this.state.rafId = null;
    }

    this.dom.canvas.removeEventListener("click", this.clickHandler);
    window.removeEventListener("keydown", this.keydownHandler);
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

function distance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getDifficultyPreset(difficultyId) {
  return DIFFICULTY_PRESETS[difficultyId] || DIFFICULTY_PRESETS.normal;
}

export function init(containerEl, globalState, callbacks) {
  if (runtime) {
    runtime.destroy();
  }
  runtime = new QaTowerDefense(containerEl, globalState, callbacks);
  return runtime.getControls();
}

export function destroy() {
  if (!runtime) {
    return;
  }
  runtime.destroy();
  runtime = null;
}
