Все должно быть на русском языке.

You are a senior frontend engineer and HTML5 game developer.

Generate a complete **static QA game portal** containing **3 fully playable mini-games** inside one project, deployable to **GitHub Pages** with **no build tools** and **no external libraries**.

Everything must be fully implemented.
No placeholders, no TODOs, no pseudocode, no incomplete logic.

---

# 📦 TECH CONSTRAINTS

Use only:

* HTML
* CSS
* JavaScript (ES6)
* HTML5 Canvas (where needed)

Forbidden:

* frameworks (React/Vue/etc)
* npm / bundlers
* external CDNs
* external APIs
* external images except local `/assets`
* placeholder code and unfinished stubs

Must run by opening `index.html` locally.

---

# 📁 PROJECT STRUCTURE (exactly)

Output exactly this file tree:

```
index.html
style.css
main.js
games/
  qa-hero.js
  pixel-qa-fighter.js
  qa-tower-defense.js
assets/
  pechkin.jpg
  vinogradov.jpg
  derkachev.jpg
  ryazantsev.jpg
  yanovskiy.jpg
  pereguda.jpg
  razuvaev.jpg
  voronin.jpg
  repin.jpg
```

No additional files.

---

# 🎮 PORTAL CONCEPT

Portal name: **QA Game Portal: Защитники качества**

Single Page App navigation (no page reloads):

* Home / Lobby screen
* Hero selection screen
* Game screen (one of 3 games)
* Results screen
* Achievements / Stats screen

All UI must be in Russian.

Theme:

* Dark neon tech
* Smooth transitions
* Responsive layout

---

# 👥 HEROES (exactly 9, with real faces)

Heroes list with images:

1. Печкин Дмитрий → assets/pechkin.jpg
2. Виноградов Сергей → assets/vinogradov.jpg
3. Деркачев Матвей → assets/derkachev.jpg
4. Рязанцев Александр → assets/ryazantsev.jpg
5. Яновский Данил → assets/yanovskiy.jpg
6. Перегуда Роман → assets/pereguda.jpg
7. Разуваев Всеволод → assets/razuvaev.jpg
8. Воронин Владислав → assets/voronin.jpg
9. Репин Александр → assets/repin.jpg

Hero selection requirements:

* Each hero card displays circular cropped photo with neon border
* Name + short description + unique “суперсила”
* Select hero once and keep selection for all games (can change in lobby)

During gameplay, the selected hero face must be displayed in HUD and/or as the player head (canvas).

---

# 💾 GLOBAL PROGRESSION (shared across all 3 games)

Create global profile saved in `localStorage`:

* selectedHeroId
* totalScore (sum across games)
* coins (earned currency)
* bestScores per game
* totalPlayTime
* unlockedBadges array

Coins economy:

* Each game awards coins on completion (win/lose)
* Portal shows coin balance
* Coins are just for fun (no store required), but show “Награды” screen with earned badges

Badges examples (implement at least 8):

* “Первый запуск”
* “Спас релиз”
* “Убил 50 багов”
* “Выжил 60 секунд”
* “3 игры за вечер”
* “Без урона 20 секунд”
* “Башенная оборона: волна 5”
* “QA-герой недели”

Implement badge unlocking logic and UI listing.

---

# 🧭 NAVIGATION & UX

Lobby screen must show:

* Greeting: “С 23 февраля — защитники качества наших продуктов!”
* Selected hero preview
* 3 big buttons (cards) to launch each game:

  1. QA Hero: Спаси релиз
  2. Pixel QA Fighter
  3. QA Tower Defense
* Stats panel:

  * Total score
  * Coins
  * Best scores (per game)
  * Badges count

When starting a game:

* Fade transition
* Show game description and controls briefly
* “Start” button

All games must have:

* Pause (P)
* Restart (R)
* Exit to lobby (Esc) with confirmation modal

No timer leaks on exit/restart.

---

# 🕹 MINI-GAME #1 — QA HERO: СПАСИ РЕЛИЗ (DOM-based)

Implementation requirements:

* Use DOM cards/events (no canvas needed)
* Stats: Stability / Speed / Team Morale (0–100), start 70/70/70
* Every 3 seconds show random event card with exactly 3 decisions
* Events pool (at least 10 distinct):

  * Critical bug, Flaky test, Requirement change, Business urgent fix, Backend down, CI failure, Deadline tomorrow, Analytics broken, Payment issues, Pushes misrouted
* Each decision changes stats and may trigger hero superpower
* Win if survive 90 seconds with all stats > 0
* Lose if any stat <= 0
* Award coins & score:

  * Score increases with time survived + stability bonus
  * Coins: win 50–80, lose 10–30 scaled by time

---

# 🕹 MINI-GAME #2 — PIXEL QA FIGHTER (Canvas arcade)

Implementation requirements:

* Canvas game with requestAnimationFrame loop
* Player:

  * move left/right, jump, shoot
  * controls: A/D or arrows, Space jump, F shoot
* Enemies spawn from right:

  * Critical Bug, Regression Monster, Flaky Ghost, CI Drone, Deadline Meteor
* Collision detection:

  * player-enemy damage
  * bullet-enemy reduces HP
* HUD: health 0–100, score, time, hero portrait
* Superpower (Shift) with cooldown bar
* Difficulty ramps over time (spawn rate, enemy speed, HP)
* Endless survival; game ends on health <= 0
* Award coins & score based on kills and survival time

---

# 🕹 MINI-GAME #3 — QA TOWER DEFENSE (Canvas strategy)

Implementation requirements:

* Single-lane tower defense (simple but real)
* Enemies follow a path from left to right toward “Прод”
* Place towers on grid cells by clicking
* Towers types (at least 3):

  * Manual QA (slow + consistent)
  * AQA (fast shots)
  * SDET (piercing or splash)
* Tower costs coins earned in-run (not global coins):

  * In-run currency gained per kill
* Waves system:

  * At least 8 waves
  * Each wave gets harder
* Base health (“Прод”) starts at 100
* Lose when base health <= 0
* Win when wave 8 cleared
* Award global coins & score based on waves cleared

---

# 🧩 SHARED ENGINE REQUIREMENTS

In `main.js` implement:

* Asset preloader for hero images (promise-based)
* Global state manager (read/write localStorage)
* Router / view switcher (no reload)
* Modal system for confirmations
* Shared UI components (buttons, cards, progress bars)
* Audio is optional, but if included it must be local and optional; otherwise omit audio entirely

Each game module in `games/*.js` must export:

* init(containerEl, globalState, callbacks)
* destroy()

Where callbacks include:

* onExitToLobby()
* onGameOver(resultObject)
* onGameWin(resultObject)

Ensure destroy() clears all timers, listeners, animation frames.

---

# 🎨 DESIGN REQUIREMENTS

* Dark neon style
* Smooth hover/focus states
* Accessible fonts and readable layout
* Responsive (desktop first, acceptable on mobile)
* No external fonts; use system fonts

---

# ✅ OUTPUT FORMAT (STRICT)

Your response must contain ONLY:

1. The project tree
2. The full contents of each file, in this exact order:

* index.html
* style.css
* main.js
* games/qa-hero.js
* games/pixel-qa-fighter.js
* games/qa-tower-defense.js

No explanations. No extra commentary.

---

If you understand the task, generate the complete working project now.