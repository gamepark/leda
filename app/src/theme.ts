import { css } from '@emotion/react'
import { Clan } from '@gamepark/leda/Clan'
import { GameTheme, PaletteTheme } from '@gamepark/react-game'

/**
 * GameProvider merges what is given here into the default theme, so only the keys that differ have to be set.
 * The palette is the one part that has to be loosened: its type requires every color, and the danger and disabled
 * ones have no equivalent in the rulebook, so the defaults of the framework are kept for them.
 */
type LedaTheme = Omit<Partial<GameTheme>, 'palette'> & { palette: Partial<PaletteTheme> }

/**
 * Colors sampled on the rulebook: the parchment of the pages, the copper of the frame that runs around them,
 * and the near black of the body text. The deep blue is the one of the numbered bullets of the setup.
 * The variants below are the base colors mixed towards black or towards the parchment.
 */
export const parchment = '#efdcc1'
export const parchmentDark = '#d7c6ae'
export const copper = '#bd6e43'
export const copperHover = '#a6613b'
export const copperActive = '#905433'
export const copperLight = '#e9cfb2'
export const ink = '#231f20'
export const deepBlue = '#004670'

/**
 * The color of each clan, sampled on the back of its cards, and the gold of the emblem printed on it.
 * The Pandas are missing: their cards are absent from the assets.
 */
export const clanColors: Partial<Record<Clan, string>> = {
  [Clan.Cat]: '#623c91',
  [Clan.Shark]: '#0090cf',
  [Clan.Scorpion]: '#f0921e'
}

export const clanGold = '#e8c851'

/**
 * Buttons over the parchment surfaces: ink label in a copper outline, filling with a light copper tint on hover.
 * Contrast ratios: 12.2 at rest, 10.9 on hover, 4.5 while pressed.
 */
const parchmentButtons = css`
  color: ${ink};
  background: transparent;
  border: 0.08em solid ${copper};
  border-radius: 2em;
  font-weight: 700;
  transition:
    background-color 0.1s ease-in-out,
    color 0.1s ease-in-out;

  &:not(:disabled) {
    &:hover,
    &:focus {
      background: ${copperLight};
      color: ${ink};
    }

    &:active {
      background: ${copperActive};
      color: ${parchment};
    }
  }
`

/** The background of the table is left alone: it is the cover art of the game, not something the rulebook dictates. */
export const ledaTheme: LedaTheme = {
  dialog: {
    backgroundColor: parchment,
    color: ink,
    /** A copper frame with a thin inner rule, the way the pages of the rulebook are framed. */
    container: css`
      border: 0.35em solid ${copper};
      border-radius: 0.5em;
      box-shadow:
        inset 0 0 0 0.12em ${parchmentDark},
        0 0.5em 1.5em rgba(0, 0, 0, 0.55);
    `,
    /**
     * Repeated here even though it is the same as theme.buttons, because a Dialog composes its buttons as
     * [base, theme.buttons, theme.dialog.buttons] with the theme of the tree it is mounted in. The clan dialog is
     * mounted inside the header, whose ThemeProvider replaces theme.buttons with the recipe for the dark bar, so
     * this last entry is what keeps the dialog buttons readable on parchment wherever the dialog is rendered from.
     */
    buttons: parchmentButtons
  },

  palette: {
    primary: copper,
    primaryHover: copperHover,
    primaryActive: copperActive,
    primaryLight: copperLight,
    primaryLighter: '#f4e8d6',
    surface: parchment,
    onSurface: ink,
    onSurfaceFocus: '#e2c0a2',
    onSurfaceActive: '#dbb08f'
  },

  /** The game wide button recipe, for everything that is not the header bar. */
  buttons: parchmentButtons,

  /**
   * The header bar is dark, so the recipe above would put a near black label on it: 1.1 of contrast, unreadable
   * until hovered. Over the bar the label is parchment instead, and hovering fills the button with parchment.
   * Contrast ratios: 11.3 at rest, 12.2 on hover, 4.5 while pressed.
   */
  header: {
    buttons: css`
      color: ${parchment};
      background: transparent;
      border: 0.08em solid ${copper};

      &:not(:disabled) {
        &:hover,
        &:focus {
          background: ${parchment};
          color: ${ink};
        }

        &:active {
          background: ${copperActive};
          color: ${parchment};
        }
      }
    `
  },

  /** The panels sit right next to the grids, on the same parchment as the dialogs. */
  playerPanel: {
    panel: css`
      background: ${parchment};
    `,
    activeRingColors: [copper, deepBlue]
  }
}
