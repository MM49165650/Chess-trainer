# Design mockups

Six phone-size (390 × 844) mockups of the chosen visual direction, "Study".
They show layout, typography and colour. The requirements document
(`../requirements.md`, section "Visual design") is the authority where the two differ.

| File | Screen |
| --- | --- |
| `home-light` | Home, light mode |
| `guess-light` | Guess the move, light mode, waiting for a guess |
| `guess-dark-feedback` | Guess the move, dark mode, after a wrong guess |
| `squares-dark-marking` | Square control, dark mode, marking phase 2 |
| `squares-light-marking` | Square control, light mode, marking phase 2 |
| `squares-light-feedback` | Square control, light mode, feedback after submitting |

Each screen is a standalone `.html` file and a `.png` render of it.

## What the mockups do not show

- **Board and pieces.** The mockups draw a sage-green board with pieces from a
  symbol font. The real site uses Chessground with Lichess's olive board and the
  Maestro piece set. Ignore the mockup's board colours and piece shapes.
- **Fonts in the PNG files.** The `.png` files were rendered without access to the
  web fonts, so they show fallback typefaces. The `.html` files load the intended
  fonts (Newsreader and Instrument Sans) and are the reference for typography.
- **Font hosting.** The `.html` files load fonts from Google Fonts for convenience.
  The real site serves its fonts from its own server.
- **Sample content.** "[Site name]" is a placeholder, and the scores and
  percentages are sample numbers.
