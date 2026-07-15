# Windows 12 Web Simulator

A Windows‑12‑inspired desktop OS simulator built with plain HTML, CSS and
JavaScript — no build step, no frameworks, no dependencies.

## What's new in this version

- **Split into real files** instead of one giant HTML file, so it's lighter
  to parse, easier to edit, and ready to push straight to GitHub Pages.
- **Performance pass**: lower blur radius, a single shared 1‑second clock
  ("Ticker") instead of a dozen separate timers, and `requestAnimationFrame`‑
  throttled window dragging/resizing so things stay smooth even on
  low‑powered laptops and phones.
- **A real browser app** (`js/browser.js`) that loads live websites in an
  iframe — Wikipedia, OpenStreetMap, example.com, or any URL you type. Sites
  that block embedding (Google, YouTube, most banks — this is *their*
  security setting, called `X-Frame-Options`, and it blocks every in‑page
  browser, not just this one) show a one‑tap "open in a new tab" fallback
  instead of a blank screen.
- **Real live data**: the Weather app and desktop widget call the free,
  key‑free [Open‑Meteo](https://open-meteo.com) API using your browser's
  geolocation; the Maps app embeds real OpenStreetMap tiles and geocodes
  search terms with the free Nominatim API.
- **Real audio**: the Media Player streams actual public demo tracks and
  drives its visualizer from a live Web Audio analyser (not a fake CSS
  animation).
- **Four real, fully playable games** in the new Game Hub: Snake, 2048,
  Tic‑Tac‑Toe (with a minimax AI that plays perfectly), and Memory Match —
  each with keyboard + touch controls and a saved best score.

## File structure

```
webos/
├── index.html          entry point — links everything below
├── css/
│   └── style.css        all styling
└── js/
    ├── state.js          Store, State, APPS registry, shared utils
    ├── system.js         boot screen, lock screen, login, theme, wallpaper
    ├── desktop.js         desktop icons, widgets, context menus
    ├── windows.js         window manager (drag/resize/snap/taskbar/taskview)
    ├── panels.js          start menu, notifications, quick settings, search, AI
    ├── apps.js            Explorer/Settings/Notepad/Calculator/Paint/Media/
    │                      Terminal/Store/AI Hub/Weather/Maps
    ├── browser.js          the real iframe-based browser
    ├── games.js            Game Hub + Snake/2048/Tic-Tac-Toe/Memory
    └── main.js             final wiring / niceties
```

Scripts must load in the order listed in `index.html` — later files call
functions defined by earlier ones (they all share the same global scope,
there's no bundler involved).

## Deploying to GitHub Pages

1. Create a new repository on GitHub (public or private, Pages works with
   either on a paid plan — public repos get Pages free).
2. Upload the **contents of this `webos` folder** (keep the folder
   structure — `index.html` at the repo root, `css/` and `js/` as
   subfolders).
   - Easiest: drag-and-drop everything into the GitHub web UI's "Add file →
     Upload files" screen, or `git add . && git commit -m "Deploy" && git push`
     if you're using the command line.
3. In the repository, go to **Settings → Pages**.
4. Under **Build and deployment → Source**, choose **Deploy from a branch**.
5. Pick your branch (usually `main`) and folder **`/ (root)`**, then **Save**.
6. GitHub will give you a URL like `https://<your-username>.github.io/<repo-name>/`
   — it usually goes live within a minute or two.

No server, database, or build process is required — it's a static site.

## Notes & honest limitations

- This simulates an OS in the browser; it isn't a real operating system and
  doesn't have file-system, process, or network access beyond what a normal
  webpage can do.
- The browser app can only display sites that allow iframe embedding — this
  is a security restriction those sites choose, and it applies to every
  browser-in-a-page, not just this one.
- Weather/Maps/Media features need an internet connection and (for weather
  and "locate me" in Maps) will ask permission to use your location.
- Everything else — window management, apps, games, notes, settings — works
  fully offline once the page itself has loaded.
