# Science-based Games List (Astro Version)

This repository hosts a curated list of science-based games, now converted into an interactive Astro website.

## Development

### Prerequisites

- Node.js
- npm

### Setup

```bash
pnpm install
```

### Run Locally

```bash
pnpm run dev
```

### Build

```bash
pnpm run build
```

## Structure

- `src/content/games/`: Individual Markdown files for each game.
- `src/pages/index.astro`: Main listing page.
- `_source/`: Original README and LICENSE (archive).

## Contributing

To add a new game, create a new Markdown file in `src/content/games/` with the required frontmatter.

```yaml
---
title: "Game Title"
url: "https://example.com"
category: "Physics"
authors: ["Author Name"]
year: 2024
sub_topics: ["Topic 1", "Topic 2"]
genres: ["Puzzle"]
platforms: ["Web"]
pricing: ["free"]
description: "Description of the game."
license: "proprietary"
---
```
