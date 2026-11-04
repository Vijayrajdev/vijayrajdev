# Profile studio guide

This repo is a GitHub profile README with a real-time 3D hero, animated 3D project cards, a visitor guestbook and auto-updating stats. Everything personal comes from **one file**, [`profile.config.mjs`](../profile.config.mjs). The README and every graphic are generated from it.

- [Edit your details](#edit-your-details)
- [Build and render](#build-and-render)
- [Make it your own (reuse this repo)](#make-it-your-own)
- [How it works](#how-it-works)
- [Troubleshooting](#troubleshooting)

## Edit your details

Open `profile.config.mjs`. Every field has a comment. Common changes:

| I want to… | Edit this in the config | Then run |
|---|---|---|
| Change name, title, greeting or taglines | `name`, `title`, `greeting`, `taglines` | `npm run build` then `npm run render hero` |
| Change location, company, intro | `chips` (hero) and `about` (bento grid) | `npm run build` then `npm run render hero` |
| Add a project | copy an entry in `projects`, give it a new `id` | `npm run build` then `npm run render <id>` |
| Remove a project | delete its entry | `npm run build` (and delete its `assets/Design/card-<id>.webp`) |
| Reorder projects | reorder `projects` | `npm run build` then `npm run render` (the cards show "01 / 06") |
| Add or remove a skill | `stacks[].items` | `npm run build` |
| Change social links | `socials` | `npm run build` |
| Edit the platform diagram | `platform.stages`, `platform.foundation` | `npm run build` |
| Rename a section header | `headers` | `npm run build` |
| Hide a section | set it to `false` in `sections` | `npm run build` |

All commands run from the `studio/` folder. **Don't edit `README.md` by hand**: `npm run build` overwrites it.

### Adding a project

```js
{
  id: "my-tool",                 // used for the file name: assets/Design/card-my-tool.webp
  title: "My Tool",
  repo: "your-name/my-tool",     // the card links to github.com/<repo>
  scene: "network",              // the 3D object: knot | shield | network | planet | cubes | chip
  kicker: "data tooling",        // small label above the title
  lang: "Python", langColor: "#3572A5",
  accent: "#22d3ee",             // card glow and button colour
  desc: "One or two short sentences, about 110 characters at most so it fits on two lines.",
  tags: ["python", "airflow", "gcp"],
},
```

Then `npm run build && npm run render my-tool`. One card takes about 4 minutes.

To preview a card before recording it, open `http://localhost:8000/live/card.html?id=my-tool` after starting a local server in the repo root (for example `npx serve -l 8000 .`).

### Icons

Logos in `socials`, `stacks` and `platform` use one of two sources:

- `skill:<id>`: an icon from [skillicons.dev](https://skillicons.dev) (for example `skill:py`, `skill:docker`).
- `si:<export>[:hex]`: an icon from [Simple Icons](https://simpleicons.org), written as the JS export name (`siGooglebigquery`, `siDbt`). Add `:hex` to override the colour, for example `si:siX:ffffff`.

Logos are downloaded once at build time and embedded into the SVGs, so the README never depends on an external icon service.

## Build and render

Requirements: **Node 22 or newer**. The first `npm install` downloads Chrome for Testing (about 150 MB) for the recorder.

```bash
cd studio
npm install          # once
npm run build        # README, section headers, About grid, diagram, icons, galaxy (seconds)
npm run render       # record the 3D hero and every card (about 15 min, runs in parallel)
npm run render hero  # just the hero
npm run render nexus # just one card
```

| Output | Made by | Quality |
|---|---|---|
| `assets/Design/hero.webp` | `live/index.html`, recorded | 2048 px, 24 fps, quality 100, 3× supersampled |
| `assets/Design/card-*.webp` | `live/card.html`, recorded | 1024 px, 20 fps, quality 90, 2.56× supersampled |
| `assets/Design/*.svg` | `studio/assets.mjs` | vector |
| `README.md` | `studio/readme.mjs` | |

The recorder renders each frame in headless Chrome on your GPU, captures frames with three browser pages at once, encodes every frame on its own CPU core, and then joins the frames into one looping WebP. Commit the regenerated files and push.

## Make it your own

1. **Create the repo.** GitHub shows a README on your profile only when the repo name matches your username exactly. Use this repo as a template (or fork it), then rename it to your username.
2. **Edit `profile.config.mjs`.** Set `github` to your username and `repo` to the repo name, then replace the name, links, projects and skills.
3. **Reset the guestbook.** Put an empty list in `assets/Design/galaxy.json`: `[]`.
4. **Build and render:**
   ```bash
   cd studio && npm install && npm run build && npm run render
   ```
5. **Add the stats token.** The stats workflow needs a personal access token:
   - Create a classic token at GitHub → Settings → Developer settings → Personal access tokens, with the `public_repo` and `read:user` scopes (add `repo` to include private repositories).
   - In your profile repo: Settings → Secrets and variables → Actions → New repository secret, named `METRICS_TOKEN`.
   - If you skip this, set `sections.stats` and `sections.dailyBreak` to `false` and delete `.github/workflows/metrics.yml`.
6. **Allow the Actions to commit.** Settings → Actions → General → Workflow permissions → "Read and write permissions".
7. **Turn on GitHub Pages** for the live 3D page: Settings → Pages → Build and deployment → Deploy from a branch → `main`, `/ (root)`. The page appears at `https://<you>.github.io/<repo>/live/`.
8. **Push.** The metrics workflow runs on push and then daily; it creates the stats images and the `output` branch that holds the snake.

### Changing the look

- **Colours:** the cyan, violet and pink palette is defined at the top of `live/index.html`, `live/kit.js` and `studio/assets.mjs`.
- **The 3D core:** `live/index.html`. Every motion is periodic over `LOOP` seconds so recordings loop seamlessly; keep new motion periodic too.
- **Card objects:** the builders `pipes`, `shield`, `network`, `planet`, `sorter` and `chip` in `live/card.html`. A new builder needs an entry in `SCENES`, and it must return an `update(u)` function where `u` runs from 0 to 1 over one loop.

## How it works

```
profile.config.mjs ──► studio/assets.mjs ──► assets/Design/*.svg
                   ├─► studio/readme.mjs ──► README.md
                   └─► live/*.html ──(studio/render.mjs + record.mjs)──► assets/Design/*.webp
```

| Path | What it is |
|---|---|
| `profile.config.mjs` | All personal content |
| `live/index.html` | The 3D hero, interactive on GitHub Pages, recorded for the README |
| `live/card.html`, `live/kit.js` | The project card scenes and their shared renderer |
| `studio/` | Build tooling: `assets.mjs`, `readme.mjs`, `galaxy.mjs`, `render.mjs`, `record.mjs` |
| `assets/Design/` | Generated graphics committed for the README |
| `assets/Dynamic/` | Stats images written daily by the metrics workflow |
| `.github/workflows/metrics.yml` | Daily stats, cartoon and joke, plus the snake on the `output` branch |
| `.github/workflows/galaxy.yml` | The guestbook: an issue titled `galaxy: …` adds the author as a star, then closes the issue |

## Troubleshooting

| Problem | Fix |
|---|---|
| `skillicons.dev has no icon "x"` | That id doesn't exist; check [skillicons.dev](https://skillicons.dev) or use a Simple Icons `si:` export. |
| `simple-icons has no export "x"` | Export names are `si` plus the slug with a capital first letter, for example `siGooglebigquery`. |
| `unknown scene "x"` | `scene` must be one of `knot`, `shield`, `network`, `planet`, `cubes`, `chip`. |
| Recording is very slow | Make sure Chrome uses your GPU: a renderer starting with `ANGLE (… Metal` or `… D3D11` is good; `SwiftShader` means software rendering. |
| Snake image is broken | It appears after the first metrics workflow run creates the `output` branch. |
| Stats show an error | Check the `METRICS_TOKEN` secret and its scopes, then re-run the "Generate Metrics" workflow. |
| Guestbook doesn't add stars | Issues must be enabled, and workflow permissions must allow writing (step 6). |
