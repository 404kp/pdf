# Simple Static Web Project

## Table of Contents
- Overview
- Features
- Technologies
- Getting Started
  - Prerequisites
  - Run locally
- Usage
- Project Structure
- Development
# Simple Static Web Project

## Table of Contents
- Overview
- Features
- Technologies
- Getting Started
  - Prerequisites
  - Run locally
- Usage
- Project Structure
- Development
- Deployment
- Publishing at https://404kp.github.io/pdf
- Contributing
- License
- Credits

## Overview

This is a small static web project consisting of a single HTML page (`index.html`) with associated JavaScript (`script.js`) and CSS (`styles.css`). It is intended as a minimal starting point or demo for local experiments, small prototypes, and static-site examples.

## Features

- Simple, dependency-free static site
- Clear separation of structure (`index.html`), behavior (`script.js`), and presentation (`styles.css`)
- Easy to run locally or deploy to any static hosting

## Technologies

- HTML5
- Vanilla JavaScript
- CSS3

## Getting Started

These instructions explain how to run the project locally and how to make quick edits.

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)
- (Optional) `python` or `node` installed for running a local HTTP server

### Run locally

You can open `index.html` directly in your browser by double-clicking the file, but serving it over HTTP is recommended to avoid issues with browser security restrictions when loading assets or using certain APIs.

From the project root, run one of the following in a terminal.

Using Python 3 (works on Windows/macOS/Linux):

```bash
python -m http.server 8000
# open http://localhost:8000 in your browser
```

Using `npx` (no install required):

```bash
npx http-server -p 8000
# or
npx serve -s . 8000
```

If you use VS Code, the Live Server extension will serve the site and provide live reload.

## Usage

- Open `http://localhost:8000` (or the file `index.html`) in your browser.
- Inspect the page and the browser console to see runtime logs or debug messages produced by `script.js`.
- Modify `styles.css` to change the appearance, and edit `script.js` to change behavior.

## Project Structure

- `index.html` — Main HTML page and entry point.
- `script.js` — JavaScript logic for interactive behavior.
- `styles.css` — Styles and layout rules.
- `README.md` — This document.

Example:

```
./
├─ index.html
├─ script.js
├─ styles.css
└─ README.md
```

## Development

- Make edits to the files in your preferred editor.
- For quick feedback, use a local HTTP server or a live-reload extension (e.g., Live Server for VS Code).
- Keep changes small and test in multiple browsers when making visual or behavioral updates.

## Deployment

Because this is a static site, it can be deployed to any static hosting provider including GitHub Pages, Netlify, Vercel, Firebase Hosting, or a simple static file server.

### Example: Deploy to GitHub Pages (manual)

1. Create a repository (for example `pdf`) under the `404kp` account and push the project files.
2. In the repository's GitHub Settings → Pages, set the source to the `gh-pages` branch (or the `main` branch root) and save.

If you prefer an automated deploy, see the GitHub Actions workflow included in `.github/workflows/deploy-gh-pages.yml` which will deploy the repository root to the `gh-pages` branch whenever you push to `main`.

### Important: Serving under `/pdf`

- This project uses a `<base href="/pdf/">` in `index.html` so the site will work when published at `https://404kp.github.io/pdf`.
- Do not change asset paths to start with a leading slash (`/`) — use relative paths (e.g., `styles.css`, `script.js`) so they resolve correctly under the `/pdf/` base.

## Publishing at https://404kp.github.io/pdf

Two common ways to publish under `https://404kp.github.io/pdf`:

- Option A — Repository named `pdf` and Pages from `gh-pages` (or `main`):
  1. Create a repository named `pdf` under `404kp` and push the project.
  2. Either enable Pages to serve from the `gh-pages` branch (if you use the workflow) or from `main` (root).
  3. The site will be available at `https://404kp.github.io/pdf` after GitHub Pages publishes it.

- Option B — Use the included GitHub Actions workflow:
  1. Push to the `main` branch.
  2. The workflow `.github/workflows/deploy-gh-pages.yml` will run and publish the repository root to `gh-pages`.
  3. In the repository Pages settings, choose the `gh-pages` branch as the publishing source.

Notes:
- The workflow uses the `GITHUB_TOKEN` provided by GitHub Actions — no extra secrets required.
- Allow a minute or two for the Pages site to become available after the first deploy.

## Contributing

- Contributions are welcome. Open issues for bugs or feature requests.
- For code changes, fork the repository, create a branch, make your changes, and submit a pull request with a clear description.

## License

Specify the license you want for this project. If you are the sole owner and want a permissive license, consider the MIT license. Add a `LICENSE` file to the repository with the full license text.

## Credits

- Project scaffold created for experimentation and prototyping.

---

If you want, I can also:

- add a `LICENSE` file
- add a `CONTRIBUTING.md` with contribution guidelines
- set up a simple `package.json` with a `start` script to serve the project

Tell me which of the above you'd like next.
