# Design System

The site uses a custom Material Design 3 (MD3) color scheme paired with the Libre Baskerville serif typeface. Colors and typography are defined as Tailwind theme extensions in `src/style.css`, so the full MD3 vocabulary is available as utility classes.

## Colors

All colors adapt automatically to the user's OS light/dark mode preference via `prefers-color-scheme`.

Raw token values are defined as CSS custom properties on `:root`. Tailwind aliases in `@theme` reference these, generating utility classes like `bg-surface-container` and `text-primary`.

| Token              | Tailwind class               | Light     | Dark      |
| ------------------ | ---------------------------- | --------- | --------- |
| Surface            | `bg-surface`, `text-surface` | `#FFF8F7` | `#1A1111` |
| On Surface         | `text-on-surface`            | `#221919` | `#F0DEDE` |
| Surface Container  | `bg-surface-container`       | `#FCEAE9` | `#271D1D` |
| Primary            | `text-primary`, `bg-primary` | `#8F4A4C` | `#FFB3B4` |
| On Surface Variant | `text-on-surface-variant`    | `#524343` | `#D7C1C1` |
| Outline Variant    | `border-outline-variant`     | `#D7C1C1` | `#524343` |

To add a new color, define the raw value as a CSS custom property in both the light and dark `:root` blocks, then add a Tailwind alias in the `@theme` block.

## Typography

Font: [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville) (400 regular, 700 bold, 400 italic) loaded from Google Fonts.

The MD3 type scale is defined in the `@theme` block. Each entry generates a `text-*` utility that sets both `font-size` and `line-height`.

| MD3 Role       | Size / Line Height | Tailwind class        | Typical use           |
| -------------- | ------------------ | --------------------- | --------------------- |
| Display Medium | 45px / 52px        | `text-display-medium` | Rotating quote        |
| Headline Large | 32px / 40px        | `text-headline-large` | Page title            |
| Headline Small | 24px / 32px        | `text-headline-small` | Section heading       |
| Title Large    | 22px / 28px        | `text-title-large`    | Subtitle              |
| Body Large     | 16px / 26px        | `text-body-large`     | Paragraph text, links |
| Label Medium   | 12px / 16px        | `text-label-medium`   | Navigation, captions  |

A custom tracking value `tracking-display` (`-0.5px`) is used on display and headline text for tighter letter-spacing.

## Where things live

- **Token definitions:** `src/style.css` — `:root` blocks for raw values, `@theme` block for Tailwind aliases
- **Font loading:** `<head>` of each HTML page via Google Fonts `<link>` tags with `preconnect`
- **Favicon:** `public/favicon.svg`
