# Git Conventions

## Commit messages

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/) via a `commit-msg` git hook. Every commit message must match:

```
type: description
```

or, with an optional scope:

```
type(scope): description
```

### Allowed types

| Type       | Use for                                     |
| ---------- | ------------------------------------------- |
| `feat`     | New functionality or content                |
| `fix`      | Bug fixes                                   |
| `chore`    | Dependency updates, config changes, tooling |
| `refactor` | Code restructuring without behavior change  |

### Scopes

Scopes are optional. When used, the scope must appear in `allowed-scopes.txt` at the project root. This file is currently empty, meaning scoped commits will be rejected until scopes are explicitly defined.

To add a scope, add it on its own line in `allowed-scopes.txt`.

### Examples

```
feat: add rotating quote section
fix: restore quote rotation after Tailwind migration
chore: pin dependency versions
refactor: move typography to Tailwind utilities
```

## Git hooks

Hooks live in `.githooks/` and are tracked in version control. They are activated automatically when you run `pnpm install` — the `prepare` script sets `core.hooksPath` to `.githooks/`.

### pre-commit

Runs Prettier on all staged `.js`, `.css`, `.html`, `.json`, and `.md` files, then re-stages them. Formatting is automatic — you don't need to run it manually.

### commit-msg

Validates the first line of the commit message against the Conventional Commits format described above. The commit is rejected with an explanatory error if validation fails.

## Manual setup

If hooks aren't active (e.g. after a fresh clone without `pnpm install`):

```sh
git config core.hooksPath .githooks
```
