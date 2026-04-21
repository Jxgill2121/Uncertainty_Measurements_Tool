# Measurement Uncertainty Calculator

A React web app for calculating GUM-compliant measurement uncertainty for pressure transducers and thermocouples used at Powertech.

---

## What It Does

When writing test reports, engineers need to state the measurement uncertainty for each instrument in the chain (sensor + DAQ). This tool automates that calculation following the **GUM** (Guide to the Expression of Uncertainty in Measurement) methodology.

### Pressure Measurement
1. Select a **pressure transducer** (NoShok or Stellar models are pre-loaded).
2. Select a **compatible DAQ module** — the app filters to only show modules that match the transducer's output type.
3. Enter the measured pressure value (MPa).
4. Click **Calculate Uncertainty**.
5. Results show:
   - **Expanded Uncertainty (k=2)** — the ±value to put in the report at 95% confidence
   - Combined standard uncertainty (k=1)
   - Relative uncertainty %
   - An official report statement ready to copy
   - A bar chart breaking down each uncertainty contributor

### Temperature Measurement
Same workflow but for thermocouples (select TC model → select TC DAQ module → enter temperature → calculate).

### Asset Lookup
A separate panel lets you search for any piece of equipment by asset ID or model to view its specs.

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** — build tool and dev server
- **Chart.js** + **react-chartjs-2** — uncertainty contributor bar charts
- No backend — runs entirely in the browser

---

## Project Structure

```
uncertainty_measurements_tool/
├── uncertainty-app/           # The web app lives here
│   ├── src/
│   │   ├── App.tsx            # Main component — tabs, state, layout
│   │   ├── App.css            # All styles
│   │   ├── calculations/
│   │   │   └── uncertainty.ts # GUM math — PT and TC uncertainty functions
│   │   ├── components/
│   │   │   ├── UncertaintyChart.tsx   # Chart.js bar chart component
│   │   │   └── AssetLookup.tsx        # Asset search panel
│   │   └── data/
│   │       └── equipment.ts   # Equipment database — PT specs, DAQ specs, TC specs
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── *.xlsx / *.ods             # Reference spreadsheets (not used at runtime)
```

### Key files

| File | Purpose |
|---|---|
| `src/data/equipment.ts` | All equipment specs hardcoded here — add new sensors/DAQs here |
| `src/calculations/uncertainty.ts` | `calculatePTUncertainty()` and `calculateTCUncertainty()` — the GUM math |
| `src/App.tsx` | UI logic — ties equipment selection to calculations and results display |

---

## How to Run Locally (Development)

### 1. Prerequisites

- **Node.js 18+** (includes npm) — download from nodejs.org

### 2. Install dependencies

```bash
cd uncertainty-app
npm install
```

### 3. Start the dev server

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. The page hot-reloads on every save.

---

## How to Build for Production

```bash
cd uncertainty-app
npm run build
```

This outputs a `dist/` folder containing static HTML, JS, and CSS files. That folder is the entire app — no server needed, just a way to serve static files.

---

## How to Host

Because the build output is purely static files, hosting options are simple and often free.

### Option A — GitHub Pages (free, easy)

1. Build the app: `npm run build`
2. In `vite.config.ts`, set the base path if you're deploying to a subdirectory:
   ```ts
   export default defineConfig({
     base: '/uncertainty_measurements_tool/', // your repo name
     plugins: [react()],
   })
   ```
3. Push the `dist/` folder contents to the `gh-pages` branch, or use the `gh-pages` npm package:
   ```bash
   npm install --save-dev gh-pages
   # Add to package.json scripts: "deploy": "gh-pages -d dist"
   npm run build && npm run deploy
   ```
4. Enable GitHub Pages in the repo Settings → Pages → Source: `gh-pages` branch.

### Option B — Netlify (free, drag-and-drop)

1. Run `npm run build` to produce `dist/`.
2. Go to netlify.com → Sites → drag the `dist/` folder into the deploy zone.
3. Done — Netlify gives you a URL instantly.

For automatic deploys on every push: connect your GitHub repo in Netlify and set:
- Build command: `npm run build`
- Publish directory: `uncertainty-app/dist`

### Option C — Any web server (IIS, nginx, Apache)

Copy the contents of `dist/` into the web server's document root. No special configuration needed.

Example with nginx:
```nginx
server {
    listen 80;
    root /var/www/uncertainty-app;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;  # needed for client-side routing
    }
}
```

### Option D — Local file (no server at all)

For quick internal use, just open `dist/index.html` directly in a browser. Works offline.

---

## Adding New Equipment

All equipment is defined in `src/data/equipment.ts`. To add a new pressure transducer, append to the `pressureTransducers` array following the existing shape:

```ts
{
  id: 'noshok-xyz',
  maker: 'NoShok',
  model: 'XYZ-100',
  maxInputMPa: 100,
  fso: 10,           // full-scale output
  fsoUnit: 'V',
  accuracy: 0.0025,  // as a fraction, e.g. 0.0025 = 0.25% FSO
  thermalError: 0.0005,
  outputType: 'voltage',
}
```

Same pattern for DAQ modules and thermocouples — match the TypeScript types already defined in that file.

---

## The Uncertainty Math

All calculations follow **JCGM 100:2008 (GUM)**:

1. Each uncertainty source (sensor accuracy, thermal error, DAQ offset, DAQ gain, system noise) is expressed as a **standard uncertainty** `u_i` (divide by the appropriate coverage factor for the assumed distribution — rectangular → ÷√3, normal → ÷2 or ÷3 depending on stated confidence).
2. Combine by RSS (root sum of squares): `u_c = √(Σ u_i²)`
3. Apply coverage factor k=2 for 95% confidence: `U = k × u_c`

This is implemented in `src/calculations/uncertainty.ts`.

---

## Notes

- Equipment specs in `src/data/equipment.ts` are based on Powertech's calibrated instruments. Update them whenever instruments are recalibrated.
- The reference spreadsheets (`New Look up File.xlsx`, `UM_Calculator...xlsx`, etc.) in the repo root are the original Excel-based calculations this app replaces — kept for audit/validation.
- The app has no login, no database, and no server — all data stays in the browser.
