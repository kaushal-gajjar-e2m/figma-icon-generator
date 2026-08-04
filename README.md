# Icon Generator — Figma Plugin

Generate multiple icons that match a selected Figma template’s shape, padding, colors, and effects.

## Features

- **Capture template** and clone exact layout for new glyphs
- **Icon sources** (after capture, Library opens with **Custom Lib** selected by default):
  - **Custom Lib** — client icons synced from Figma, SVG upload, or JSON pack
  - **Fill icons** — Font Awesome–style solid/fill set (Dark / Light preview)
  - **Inner line** — Font Awesome–style outline set (Dark / Light preview)
- Exact **preview** (PNG from real clones) + **Insert All to Figma**

## Setup

```bash
npm install
npm run build
```

Load in Figma: **Plugins → Development → Import plugin from manifest…** → `manifest.json`

## Workflow

1. Select a reference icon container → **Capture as template**
2. Library opens on **Custom Lib** (default)
3. Pick source: **Custom Lib** / **Fill icons** / **Inner line**
4. Select icons → **Generate Icons** → **Insert All to Figma**

## How to load Custom Lib icons

### 1) Sync from Figma
Select one or more icon layers on the canvas → **Sync from Figma**.

### 2) Upload SVG
Use **Upload SVG** for `.svg` files.

### 3) Import JSON pack (client-shared format)

```json
{
  "name": "Client Icon Pack",
  "icons": [
    {
      "id": "billing",
      "name": "Billing",
      "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\"><path d=\"M4 7h16v10H4z\" stroke=\"currentColor\" stroke-width=\"1.75\"/></svg>"
    }
  ]
}
```

Save as `.json` and use **Import JSON**. Icons merge into Custom Lib (persisted in plugin storage).

## Project structure

```
src/
  plugin/     # Figma sandbox (Plugin API)
  ui/         # React panel UI + FA fill/line sets
  shared/     # Types + icon pack parser
dist/
manifest.json
```
