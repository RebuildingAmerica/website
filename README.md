# The Rebuilding America Project Website

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black.svg)](https://vercel.com)
[![Built with Vite](https://img.shields.io/badge/Built%20with-Vite-646CFF.svg)](https://vite.dev)
[![Styled with Tailwind CSS](https://img.shields.io/badge/Styled%20with-Tailwind%20CSS-06B6D4.svg)](https://tailwindcss.com)
[![Code style: Prettier](https://img.shields.io/badge/Code%20style-Prettier-F7B93E.svg)](https://prettier.io)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-FE5196.svg)](https://conventionalcommits.org)

The public website for the **Rebuilding America Project**, a nonprofit that uses media and civic technology to strengthen American democracy. Civic technology means software built to help people engage with government and public life — things like tools for understanding legislation, tracking elected officials, or making it easier to participate in local decision-making.

This repo contains the organization's public-facing landing page. Right now the site communicates who we are, what we're building toward, and how to reach us while the organization prepares for launch.

This is a public repository. We believe in building in the open — both because transparency is core to our mission and because civic tech works best when people can see how it's made.

## Getting Started

You'll need two things installed on your machine:

- **Node.js** (v24.3.0 or later) — the JavaScript runtime that powers the build tooling. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions. The `.nvmrc` file in this repo will automatically select the right version when you run `nvm use`.
- **pnpm** (v10.18.0 or later) — the package manager we use to install dependencies. You can install it with `npm install -g pnpm` or via [Corepack](https://pnpm.io/installation#using-corepack): `corepack enable && corepack prepare`.

Once those are in place:

```sh
# Clone the repo
git clone https://github.com/RebuildingAmerica/website.git
cd website

# Install dependencies (this also sets up git hooks automatically)
pnpm install

# Start the development server
pnpm dev
```

The dev server starts at `http://localhost:5173`. Changes to HTML, CSS, and JavaScript are reflected immediately in the browser.

To create a production build:

```sh
pnpm build     # outputs to dist/
pnpm preview   # preview the production build locally
```

## Contributing

Contributions are managed by the internal team. If you notice a bug or have a suggestion, feel free to open an issue.

### Code formatting

Prettier runs automatically on every commit via a pre-commit git hook — you don't need to think about formatting. If you want to format manually, run `pnpm format`.

The project uses the same Prettier configuration as our other repositories (semicolons, double quotes, trailing commas). See `.prettierrc.json` for details.

### Commit messages

We use [Conventional Commits](https://conventionalcommits.org) to keep the git history readable. A commit-msg hook enforces this automatically. The format is:

```
type: description
```

Where `type` is one of: `feat`, `fix`, `chore`, `refactor`. See [docs/reference/git-conventions.md](docs/reference/git-conventions.md) for full details.

## Design System

The site uses a Material Design 3 color scheme with automatic light/dark mode support and the Libre Baskerville serif typeface. Colors and typography are defined as Tailwind CSS theme extensions, so the full MD3 vocabulary is available as utility classes.

See [docs/reference/design-system.md](docs/reference/design-system.md) for the full token table and usage guide.

## License

[MIT](LICENSE)
