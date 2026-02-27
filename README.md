## DeltaE Vision: Seeing Color Through a Human Lens

I built this because most digital color tools are surprisingly blind. Standard RGB math treats color like a simple 3D grid, but human eyes don't. We perceive changes in blue differently than we do in yellow, and shadows often mess up simple hex-code matching.

DeltaE Vision is a high-performance image analyzer that uses CIEDE2000, CIEDE94, CIEDE76 (Delta E) and K-Means clustering to bridge the gap between raw pixel data and human perception.

## Live Demo

https://color-analyzer-pi.vercel.app


## The Problem & The Solution

When you try to find the dominant colors in an image, a computer might give you a bunch of slightly different shades of gray from a shadow. By implementing K-Means Clustering, this app intelligently groups those pixels into meaningful palettes.

To make those palettes accurate, I used Delta E formulas. Instead of just checking if the numbers are close, the app converts colors into the LAB color space to measure distance based on how the human eye actually functions.

## Technical Highlights

- Perceptual Math: Supports CIE76, CIE94, and CIEDE2000 formulas.
- Smart Clustering: Custom K-Means implementation to find the true soul of an image palette.
- High-DPI Precision: I used a custom Canvas overlay that scales with devicePixelRatio—no more blurry pixels on Retina displays.
- Performance First: The analysis is debounced and uses pixel sampling to keep the UI smooth (60fps), even with large uploads.
- Built With: Next.js 14, TypeScript, Tailwind CSS, and my custom @a.r.i_eze/color-matcher package.

## How it Works

- Upload: Drop any image into the analyzer.
- Process: The app samples the image and runs the pixels through the selected Delta E formula.
- Analyze: It maps every pixel to the nearest neighbor in a curated professional palette.
- Export: Get your results as a clean, structured .json file for use in design systems or brand audits.
