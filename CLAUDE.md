# CLAUDE.md

Personal portfolio site for Ryan Siegel (M.S. Biomedical Engineering candidate, University of Vermont). It presents personal, academic, and professional experience: bio, work/research experience, education, projects, awards, and publications.

## Stack

- **Hugo extended v0.140.0** (installed at `/usr/local/bin/hugo`; the `.deb` installer is checked into the repo root).
- **Theme:** [hugo-profile](https://github.com/gurusabarish/hugo-profile) v4.06, as a git submodule at `themes/hugo-profile`.
- Bootstrap 5 and Font Awesome 6 are served locally from the theme's `static/` (`useBootstrapCDN: false`). Search uses Fuse.js from jsDelivr.
- Live site: https://rsiegel.netlify.app. Netlify builds it from source using `netlify.toml` (`hugo --gc --minify`, Hugo 0.140.0, publishes `public/`).

## Commands

```bash
hugo server            # local dev server with live reload (http://localhost:1313)
hugo server -D         # same, also showing draft pages
hugo                   # build into public/ (git-ignored)
hugo -d /some/tmp/dir  # build elsewhere without touching public/
```

There are no tests or linters. A clean `hugo` build with no errors is the check.

## Where content lives

Almost all site content is in **`hugo.yaml` under `params:`**, not in Markdown files. The home page (`layouts/index.html`) renders these sections in order, each from a partial in `layouts/partials/sections/`:

| Section | `hugo.yaml` key | Partial |
|---|---|---|
| Hero (name, subtitle, portrait, GitHub link) | `params.hero` | `sections/hero/index.html` |
| About Me (bio, photo, tech and interpersonal skills) | `params.about` | `sections/about.html` |
| Experience (UVM TA, M³ Lab, Center for Biomedical Innovation, Glass Brain Lab, SRACLC, Evolve Senior Living) | `params.experience` | `sections/experience.html` |
| Education (UVM M.S. and B.S., Lake Zurich HS) | `params.education` | `sections/education.html` |
| Projects (GIFBA, FBANet, this site) | `params.projects` | `sections/projects.html` |
| Achievements (BME awards 2025/2026) | `params.achievements` | `sections/achievements.html` |
| Contact | `params.contact` (currently `enable: false`) | `sections/contact.html` |

Other config in `params`: colors (light and dark; the primary color is green `#0E8008`), navbar, footer socials, fonts, and single-page options.

**Publications** is the only real content page: `content/publications/_index.md`. Entries go in a `publications:` front-matter list (`title`, `authors`, `year`, `journal`, `doi`). These are rendered by the custom `layouts/publications/list.html`, which bolds "Ryan Siegel" / "R. Siegel" in author lists and links each DOI. It is linked from the main menu (`Menus.main` in `hugo.yaml`).

**CV** (`/cv/`, the menu item to the right of Publications) is `content/cv/_index.md`, rendered by `layouts/cv/list.html`.
- Entries go under `sections[].entries` with `title`, `org`, `orgUrl`, `start`/`end` (or a single `date`), `tags`, and Markdown `details`.
- Dates are `"YYYY-MM"`, `"YYYY"`, or `end: "Present"`. They are formatted by `layouts/partials/cv-date.html`.
- Each section is sorted newest-first by `start`, falling back to `date`, then `end`. File order doesn't matter.
- A section with `source: "publications"` is filled from the Publications page. Tag publications there with `cvTags`.
- Filter buttons come from the page's `cvTags` list (Highschool, B.S., M.S., External). Selecting several shows entries matching any of them, and sections with no matches hide.
- CV content partly duplicates the Experience/Education sections of `hugo.yaml`. Update both when either changes.

Multi-line YAML text fields (`content: |`) accept Markdown, and raw HTML is allowed (`goldmark.renderer.unsafe: true`).

## Layout overrides

`layouts/` and `static/css`, `static/js` at the repo root are **copies of the theme's files**, and they take precedence over the theme. The copies inside the submodule have been deleted locally, so `git -C themes/hugo-profile status` shows them as `D` and the submodule looks dirty. Edit the root copies, not the theme. Don't "fix" the submodule by restoring or updating it without checking first.

Customizations to the theme so far:
- `layouts/publications/list.html`: new publications page.
- `layouts/projects/list.html` and `layouts/partials/sections/projects.html`: card images only render when an `image` is set, so projects without one show no broken image.

## Gotchas

- Images and favicons go in `static/` (e.g. `static/images/foo.jpg` is served as `/images/foo.jpg`). Never put source files in `public/`. It is build output, git-ignored, and rebuilt by Netlify.
- `.hugo_build.lock` and `resources/_gen/` are also git-ignored build artifacts.
- `layouts/partials/sections/projects.html` uses Windows (CRLF) line endings. Keep them when editing.
- Some files in `static/images/` aren't referenced yet (`rsiegel.jpg`, `51419511_00201_0039_Medium.jpg`, `2025-bme-awards.heic`, web-app manifest icons).

## Conventions

- Keep content edits in `hugo.yaml` / `content/` and template edits in root `layouts/`.
- New custom styles in templates use the theme CSS variables (`--primary-color`, `--secondary-background-color`, `--text-color`, `--text-secondary-color`, `--background-color`) so light and dark mode both work.
- Commit messages so far are short and informal. Commit to `main`.
