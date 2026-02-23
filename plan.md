You are a senior frontend engineer and game developer.

Your task is to generate a complete, production-ready browser game that can be deployed directly to GitHub Pages with no build tools.

The game must be fully functional and self-contained.

---

# 📦 PROJECT REQUIREMENTS

Tech stack:

* Pure HTML
* Pure CSS
* Pure JavaScript (ES6)
* No frameworks
* No npm
* No build tools
* No external APIs
* No external libraries

Project structure must be exactly:

```
index.html
style.css
script.js
assets/
```

The project must work immediately after opening `index.html`.

No placeholders.
No TODO comments.
No incomplete logic.
No mockups.
No pseudocode.

Everything must be fully implemented.

---

# 🎮 GAME TITLE

QA Hero: Спаси релиз

Dark tech theme. Neon accents. Smooth animations.

---

# 👥 HEROES (exactly 9)

Create hero selection screen.

Heroes:

1. Печкин Дмитрий
2. Виноградов Сергей
3. Деркачев Матвей
4. Рязанцев Александр
5. Яновский Данил
6. Перегуда Роман
7. Разуваев Всеволод
8. Воронин Владислав
9. Репин Александр

For each hero:

* Name
* Unique QA superpower
* Short description
* Image loaded from:
  `assets/<slug>.jpg`

Slug examples:

* pechkin.jpg
* vinogradov.jpg
* derkachev.jpg
* ryazantsev.jpg
* yanovskiy.jpg
* pereguda.jpg
* razuvaev.jpg
* voronin.jpg
* repin.jpg

Images must be displayed in circular frame with neon border.

When hero is selected, their image must appear in the game screen.

---

# 🕹 GAMEPLAY

Player must survive 90 seconds without any metric dropping to 0.

Initial stats:

* Stability = 70
* Speed = 70
* Team Morale = 70

Each stat range: 0–100.

Display animated progress bars.

---

## 🔄 Event System

Every 3 seconds generate random event.

Possible events:

* Critical bug
* Flaky test
* Requirement change
* Business urgent fix
* Backend down
* CI failure
* Deadline tomorrow

Each event must:

* Show a card
* Provide exactly 3 decision buttons
* Each decision changes stats
* Some decisions may activate hero superpower

All effects must be fully implemented.

---

# 🏆 WIN CONDITION

Player wins if:

* 90 seconds passed
* No stat <= 0

Show victory screen with summary.

---

# 💀 LOSE CONDITION

Game ends immediately if any stat <= 0.

Show failure screen with explanation.

---

# 🔁 RESET REQUIREMENTS

* Proper game restart
* All intervals cleared
* No timer leaks
* State fully reset
* Hero selection available again

---

# 🎨 UI REQUIREMENTS

* Dark background
* Neon blue / green accents
* Glow effects
* Smooth transitions
* Hover animations
* Responsive layout

No images except hero photos.

---

# 🧠 CODE QUALITY

* Clean structure
* Organized functions
* No global chaos
* Use:

  * setInterval
  * clearInterval
  * addEventListener
  * DOM manipulation
* Add meaningful comments

---

# 📤 OUTPUT FORMAT

In your response:

1. Show project structure.
2. Provide full code for:

   * index.html
   * style.css
   * script.js

Do not explain the code.
Do not describe what you are doing.
Output only the complete working project.

---

If you understand the task — generate the full project.

---