# Laguna Gold — Cover Art Maker

An offline web app that turns photos + a caption into hero-dominant,
poster-style cover art: a big hero panel on the left, supporting photo
panels on the right, a golden-hour / sunset / neon / bright-day / pop-art
halftone grade, and a giant title in a retro-sun + palm banner. Export a
real PNG in one click: 1080×1080, 1080×1350, or 1920×1080.

- Open `app/index.html` in desktop Chrome (serve `app/` with any static
  server, e.g. `node serve.ts` if present, or `python3 -m http.server`).
- Pick a layout (Hero 4-panel, Hero 6-panel, 9-panel, Single hero), a
  colour grade + intensity, a caption style/size/position, then set each
  panel's photo, zoom and crop (drag the preview to pan).
- Photos are read on your own machine and never uploaded; the app makes
  no network request. Fonts are SIL OFL files under `app/fonts/`
  (Archivo Black, Oswald, Pacifico). No Rockstar logo, artwork,
  character or font is used, and the art never says "GTA".

Built for the make.fun bounty **gta6-cover-art-01**
(https://make.fun/c/gta6-cover-art-01).
Try make.fun yourself: https://make.fun/r/nmy46sr8

## Entry program

`main.ts` (Node 22, standard library only) copies `app/` and
`screenshots/` to `/output` and writes `/output/dossier.json` with
`buildDossier` from `vendor/makefun-app.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
