# Image Color Analyzer

A Next.js app for analyzing the perceptual color makeup of an uploaded image.

This project is powered by [`@a.r.i_eze/color-matcher`](https://www.npmjs.com/package/@a.r.i_eze/color-matcher), my color matching package for:

- RGB to Lab conversion
- Delta E color comparison
- nearest named color matching
- palette-based perceptual color workflows

## Features

- Upload an image and analyze it directly in the browser
- Match sampled pixels against named colors using `CIE76`, `CIE94`, and `CIE2000`
- View color distribution and dominant swatches
- Inspect points on the image to reveal the nearest named color
- Generate harmony suggestions from dominant colors
- Copy summaries, JSON, dominant swatches, and harmony suggestions
- Export analysis results as JSON or CSV
- Run image analysis in a worker to keep the UI responsive

## Use Cases

- Designers who want to extract dominant colors and build matching palettes from references
- Brand and marketing teams checking whether uploaded visuals align with a target color language
- Developers testing or demonstrating palette-based color matching workflows
- Artists and illustrators exploring harmony suggestions from an existing image
- Anyone who wants named-color analysis instead of only raw hex extraction

## Color Matcher Module

This app uses [`@a.r.i_eze/color-matcher`](https://www.npmjs.com/package/@a.r.i_eze/color-matcher) as its core color engine.

The package is used here to:

- convert sampled RGB values into Lab color space
- compare colors with Delta E formulas
- map generated and sampled colors to the nearest named palette entries

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Playwright for end-to-end testing

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run lint
npm run build
```

## Notes

- Analysis currently runs on the client, with worker-based processing for the heavier image analysis path.
- Client-side runtime errors and worker failures are reported to `/api/monitoring` for lightweight structured logging.
