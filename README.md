# The Tale of the Badger · MadHacks 2026

A browser game that walks new UW–Madison students through the orientation stuff nobody actually does: alcohol safety, phishing, enrolling in classes, and Narcan. Theme: **Let's Dig In**.

**Play:** open `index.html` (repo root) or `game/index.html` in Chrome. No install or server needed.

## Run commands (Mac, terminal in the repo folder)

| What | Command |
|---|---|
| Full game | `open -a "Google Chrome" game/index.html` |
| Scene tester (pick any scene) | `open -a "Google Chrome" game/1-party/scenes/test.html` |
| The Burrow | `open -a "Google Chrome" game/2-burrow/index.html` |
| Ch 2 · Phishing | `open -a "Google Chrome" game/3-phishing/index.html` |
| Ch 3 · Coursework | `open -a "Google Chrome" game/4-coursework/index.html` |
| Ch 4 · Narcan | `open -a "Google Chrome" game/5-narcan/index.html` |

Jump straight into one Ch 1 scene (swap the scene name):

```
open -a "Google Chrome" "file://$PWD/game/index.html?scene=Party"
```

| Scene | `?scene=` value |
|---|---|
| Title | `Title` |
| Prologue | `Prologue` |
| Langdon St | `Street` |
| House party | `Party` |
| House party, dig-back replay | `Party&rewind=1` |
| State Street (sober ending) | `StateStreet` |
| Blackout | `Blackout&drinks=4` |
| Mem U Terrace wake-up | `Terrace&drinks=4` |
| Tail restored ending | `Ending&rewind=1` |

Already have a tab open? **Cmd+Shift+R** reloads it with your latest changes.

## Game flow

```
Title screen
  → Prologue: how Badgers got their name (lead miners digging into hillsides)
  → Ch 1 · Langdon St + the house party (phone quests, depth meter, choices)
       ├─ drank → blackout → wake up at the Memorial Union Terrace, tail gone
       │            (option: dig back through the night and save Jake)
       └─ sober → State Street, 3:00 AM, walking home alone
  → The Burrow (chapter select, ✓ marks cleared chapters)
       ├─ Ch 2 · Bucky's Inbox   — phishing email   (Morgridge Hall)
       ├─ Ch 3 · Coursework      — enroll + schedule (Bascom Hill)
       └─ Ch 4 · Bucky vs Drugs  — find Narcan       (State Street)
     each chapter returns to the Burrow when you finish it
```

## Folder structure

Folders are numbered in play order.

| Path | What it is |
|---|---|
| `index.html` | Redirects to `game/index.html` |
| `game/index.html` | **Full game**: title → prologue → Ch 1 → Burrow |
| `game/lib/phaser.min.js` | Phaser 3, shared by every chapter |
| `game/1-party/core.js` | Ch 1 shared code: night state, quests + lessons, UI (HUD, dialogue, phone), Boot |
| `game/1-party/scenes/` | **One file per scene**: `title.js`, `prologue.js`, `street.js`, `party.js`, `state-street.js`, `blackout.js`, `terrace.js`, `ending.js` |
| `game/1-party/scenes/test.html` | **Scene tester**: jump straight into any scene |
| `game/1-party/main.js` | Starts the Phaser game with all Ch 1 scenes |
| `game/1-party/music.js` | 8-bit prologue music |
| `game/1-party/sprite.js` | Bucky sprite (embedded so it works from file://) |
| `game/2-burrow/` | The Burrow: chapter select hub |
| `game/3-phishing/` | Ch 2 · Bucky's Inbox (HTML/CSS/JS) |
| `game/4-coursework/` | Ch 3 · Bucky vs Coursework |
| `game/5-narcan/` | Ch 4 · Bucky vs Drugs |
| `sprites/` | Source sprites and GIFs |
| `ideation/` | Brainstorming and design notes |

**Testing one scene:** open `game/1-party/scenes/test.html`, or add `?scene=Name` to `game/index.html` (e.g. `?scene=Party`, `?scene=Party&rewind=1`, `?scene=Terrace&drinks=4`).

**Adding a Ch 1 scene:** create `game/1-party/scenes/your-scene.js`, add a `<script>` line for it in `game/index.html` (before `main.js`), and add the class to the `scene: [...]` list in `main.js`.

Chapter progress (the ✓ marks) is saved in the browser's localStorage under `tob_done`.

## Controls (Ch 1)

WASD move · E interact / next · SPACE tail shake · ↑ phone (Esc close, ← → tabs) · ↑↓ + Enter pick a choice

## Team git workflow

```
git pull --rebase          # start of every session
git add . && git commit -m "what you changed"
git pull --rebase
git push
```
