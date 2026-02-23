const WIDTH = 960;
const HEIGHT = 500;
const GROUND_Y = HEIGHT - 56;

const ENEMY_TYPES = [
  { name: "Critical Bug", hp: 18, speed: 120, size: 30, damage: 10, color: "#ff5f7a", score: 35 },
  { name: "Regression Monster", hp: 26, speed: 92, size: 38, damage: 15, color: "#ff9f62", score: 55 },
  { name: "Flaky Ghost", hp: 12, speed: 145, size: 26, damage: 8, color: "#7ac2ff", score: 28 },
  { name: "CI Drone", hp: 20, speed: 132, size: 32, damage: 12, color: "#59f2b4", score: 42 },
  { name: "Deadline Meteor", hp: 34, speed: 82, size: 44, damage: 20, color: "#ffc46d", score: 72 }
];

class PixelQaFighter {
  constructor(container, globalState, callbacks) {
    this.container = container;
    this.hero = globalState.hero;
    this.callbacks = callbacks;

    this.state = null;
    this.controls = {
      left: false,
      right: false,
      jump: false,
      shoot: false
    };

    this.enemies = [];
    this.bullets = [];

    this.keydownHandler = (event) => this.onKeyDown(event);
    this.keyupHandler = (event) => this.onKeyUp(event);

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
              <p class="chip-sub">Pixel QA Fighter</p>
            </div>
          </div>
          <div class="hud-metrics">
            <span class="metric">HP: <strong id="fighter-health">100</strong></span>
            <span class="metric">Счёт: <strong id="fighter-score">0</strong></span>
            <span class="metric">Время: <strong id="fighter-time">0</strong>с</span>
            <span class="metric">Фраги: <strong id="fighter-kills">0</strong></span>
          </div>
        </header>

        <div class="progress-row">
          <div class="progress-label"><span>Перезарядка суперсилы (Shift)</span><strong id="fighter-power-label">Готово</strong></div>
          <div class="progress"><span id="fighter-power-bar" style="width:100%"></span></div>
        </div>

        <div class="canvas-wrap">
          <canvas id="fighter-canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
          <div class="overlay-note" id="fighter-overlay" hidden>Пауза</div>
        </div>
      </section>
    `;

    this.dom = {
      canvas: this.container.querySelector("#fighter-canvas"),
      overlay: this.container.querySelector("#fighter-overlay"),
      health: this.container.querySelector("#fighter-health"),
      score: this.container.querySelector("#fighter-score"),
      time: this.container.querySelector("#fighter-time"),
      kills: this.container.querySelector("#fighter-kills"),
      powerBar: this.container.querySelector("#fighter-power-bar"),
      powerLabel: this.container.querySelector("#fighter-power-label")
    };

    this.ctx = this.dom.canvas.getContext("2d");
  }

  resetRuntime() {
    this.state = {
      running: true,
      paused: false,
      player: {
        x: 110,
        y: GROUND_Y - 54,
        w: 42,
        h: 54,
        vx: 0,
        vy: 0,
        onGround: true,
        hp: 100,
        damageCooldown: 0
      },
      score: 0,
      kills: 0,
      elapsed: 0,
      spawnTimer: 0,
      shootCooldown: 0,
      powerCooldown: 0,
      powerPulse: 0,
      noDamageCurrent: 0,
      noDamageBest: 0,
      lastTime: 0,
      rafId: null
    };

    this.enemies = [];
    this.bullets = [];
    this.updateHud();
  }

  start() {
    window.addEventListener("keydown", this.keydownHandler);
    window.addEventListener("keyup", this.keyupHandler);
    this.state.lastTime = performance.now();
    this.state.rafId = requestAnimationFrame((time) => this.frame(time));
  }

  onKeyDown(event) {
    if (!this.state.running) {
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      this.controls.left = true;
    }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      this.controls.right = true;
    }
    if (event.key === " ") {
      event.preventDefault();
      this.controls.jump = true;
    }
    if (event.key === "f" || event.key === "F") {
      this.controls.shoot = true;
    }
    if (event.key === "Shift") {
      this.tryActivatePower();
    }
  }

  onKeyUp(event) {
    if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
      this.controls.left = false;
    }
    if (event.key === "ArrowRight" || event.key === "d" || event.key === "D") {
      this.controls.right = false;
    }
    if (event.key === " ") {
      this.controls.jump = false;
    }
    if (event.key === "f" || event.key === "F") {
      this.controls.shoot = false;
    }
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

  update(dt) {
    const player = this.state.player;

    this.state.elapsed += dt;
    this.state.noDamageCurrent += dt;
    this.state.noDamageBest = Math.max(this.state.noDamageBest, this.state.noDamageCurrent);

    if (this.state.shootCooldown > 0) {
      this.state.shootCooldown -= dt;
    }
    if (this.state.powerCooldown > 0) {
      this.state.powerCooldown -= dt;
    }
    if (this.state.powerPulse > 0) {
      this.state.powerPulse -= dt;
    }
    if (player.damageCooldown > 0) {
      player.damageCooldown -= dt;
    }

    const moveSpeed = 240;
    if (this.controls.left && !this.controls.right) {
      player.vx = -moveSpeed;
    } else if (this.controls.right && !this.controls.left) {
      player.vx = moveSpeed;
    } else {
      player.vx = 0;
    }

    if (this.controls.jump && player.onGround) {
      player.vy = -390;
      player.onGround = false;
    }

    if (this.controls.shoot && this.state.shootCooldown <= 0) {
      this.shoot();
      this.state.shootCooldown = 0.22;
    }

    player.vy += 980 * dt;
    player.x = clamp(player.x + player.vx * dt, 10, WIDTH - player.w - 10);
    player.y += player.vy * dt;

    if (player.y + player.h >= GROUND_Y) {
      player.y = GROUND_Y - player.h;
      player.vy = 0;
      player.onGround = true;
    }

    this.updateBullets(dt);
    this.spawnEnemies(dt);
    this.updateEnemies(dt);

    this.updateHud();

    if (player.hp <= 0) {
      this.finish(false, "Герой пал. Баги прорвали оборону.");
    }
  }

  shoot() {
    const player = this.state.player;
    this.bullets.push({
      x: player.x + player.w - 4,
      y: player.y + player.h * 0.45,
      r: 4,
      speed: 470,
      damage: this.state.powerPulse > 0 ? 14 : 10
    });
  }

  spawnEnemies(dt) {
    this.state.spawnTimer -= dt * 1000;
    if (this.state.spawnTimer > 0) {
      return;
    }

    const difficulty = 1 + this.state.elapsed / 35;
    const type = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];

    this.enemies.push({
      ...type,
      hp: Math.round(type.hp + difficulty * 2),
      maxHp: Math.round(type.hp + difficulty * 2),
      x: WIDTH + Math.random() * 80,
      y: GROUND_Y - type.size,
      wobble: Math.random() * Math.PI * 2
    });

    this.state.spawnTimer = Math.max(420, 1500 - this.state.elapsed * 18);
  }

  updateEnemies(dt) {
    const player = this.state.player;
    const difficulty = 1 + this.state.elapsed / 40;

    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      enemy.x -= enemy.speed * difficulty * dt;
      enemy.wobble += dt * 4;
      enemy.y = GROUND_Y - enemy.size + Math.sin(enemy.wobble) * 2;

      if (this.state.powerPulse > 0 && Math.abs((enemy.x + enemy.size / 2) - (player.x + player.w / 2)) < 150) {
        enemy.hp -= 24 * dt;
      }

      if (enemy.x + enemy.size < 0) {
        this.enemies.splice(i, 1);
        continue;
      }

      if (rectIntersect(player.x, player.y, player.w, player.h, enemy.x, enemy.y, enemy.size, enemy.size)) {
        if (player.damageCooldown <= 0) {
          player.hp = clamp(player.hp - enemy.damage, 0, 100);
          player.damageCooldown = 0.9;
          this.state.noDamageCurrent = 0;
        }

        enemy.hp -= 25 * dt;
      }

      if (enemy.hp <= 0) {
        this.enemies.splice(i, 1);
        this.state.kills += 1;
        this.state.score += enemy.score;
      }
    }
  }

  updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i -= 1) {
      const bullet = this.bullets[i];
      bullet.x += bullet.speed * dt;

      if (bullet.x > WIDTH + 30) {
        this.bullets.splice(i, 1);
        continue;
      }

      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j -= 1) {
        const enemy = this.enemies[j];
        if (circleRectIntersect(bullet.x, bullet.y, bullet.r, enemy.x, enemy.y, enemy.size, enemy.size)) {
          enemy.hp -= bullet.damage;
          hit = true;
          if (enemy.hp <= 0) {
            this.enemies.splice(j, 1);
            this.state.kills += 1;
            this.state.score += enemy.score;
          }
          break;
        }
      }

      if (hit) {
        this.bullets.splice(i, 1);
      }
    }
  }

  tryActivatePower() {
    if (!this.state.running || this.state.paused || this.state.powerCooldown > 0) {
      return;
    }

    this.state.powerPulse = 3.6;
    this.state.powerCooldown = 14;
  }

  updateHud() {
    this.dom.health.textContent = String(Math.round(this.state.player.hp));
    this.dom.score.textContent = String(Math.round(this.state.score));
    this.dom.time.textContent = String(Math.floor(this.state.elapsed));
    this.dom.kills.textContent = String(this.state.kills);

    if (this.state.powerCooldown <= 0) {
      this.dom.powerLabel.textContent = "Готово";
      this.dom.powerBar.style.width = "100%";
      return;
    }

    const progress = clamp(1 - this.state.powerCooldown / 14, 0, 1);
    this.dom.powerLabel.textContent = `${this.state.powerCooldown.toFixed(1)}с`;
    this.dom.powerBar.style.width = `${Math.round(progress * 100)}%`;
  }

  draw() {
    const ctx = this.ctx;
    const player = this.state.player;

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#09162a");
    sky.addColorStop(1, "#060d1b");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.strokeStyle = "rgba(71, 233, 255, 0.2)";
    for (let x = 0; x < WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }

    ctx.fillStyle = "#0d1d34";
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);

    this.bullets.forEach((bullet) => {
      ctx.fillStyle = "#57f5a3";
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.r, 0, Math.PI * 2);
      ctx.fill();
    });

    this.enemies.forEach((enemy) => {
      ctx.fillStyle = enemy.color;
      ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

      const hpRatio = clamp(enemy.hp / enemy.maxHp, 0, 1);
      ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
      ctx.fillRect(enemy.x, enemy.y - 8, enemy.size, 4);
      ctx.fillStyle = "#57f5a3";
      ctx.fillRect(enemy.x, enemy.y - 8, enemy.size * hpRatio, 4);
    });

    if (this.heroImage.complete) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(player.x + player.w / 2, player.y + player.h / 2, player.w / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(this.heroImage, player.x, player.y, player.w, player.h);
      ctx.restore();
    } else {
      ctx.fillStyle = "#47e9ff";
      ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    if (this.state.powerPulse > 0) {
      ctx.strokeStyle = "rgba(87, 245, 163, 0.7)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x + player.w / 2, player.y + player.h / 2, 150, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  finish(win, message) {
    if (!this.state.running) {
      return;
    }

    this.state.running = false;
    const playTime = Math.floor(this.state.elapsed);
    const score = Math.round(this.state.score + playTime * 12 + this.state.kills * 8);
    const coins = Math.round(clamp(15 + this.state.kills * 1.4 + playTime * 0.35, 15, 120));
    const payload = {
      message,
      score,
      coins,
      playTime,
      kills: this.state.kills,
      noDamageSeconds: Math.floor(this.state.noDamageBest),
      waveReached: 0
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

    window.removeEventListener("keydown", this.keydownHandler);
    window.removeEventListener("keyup", this.keyupHandler);

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

function rectIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function circleRectIntersect(cx, cy, r, rx, ry, rw, rh) {
  const nearestX = clamp(cx, rx, rx + rw);
  const nearestY = clamp(cy, ry, ry + rh);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= r * r;
}

export function init(containerEl, globalState, callbacks) {
  if (runtime) {
    runtime.destroy();
  }
  runtime = new PixelQaFighter(containerEl, globalState, callbacks);
  return runtime.getControls();
}

export function destroy() {
  if (!runtime) {
    return;
  }
  runtime.destroy();
  runtime = null;
}
