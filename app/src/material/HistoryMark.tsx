import { css } from '@emotion/react'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

/**
 * What a button that tells the story of the round carries: the symbol of what happened, followed by a question
 * mark (see {@link SpyHistoryButton} and {@link SwapHistoryButton}).
 *
 * Wrapped in a div so that the mark is not a span the medallion can reach: it paints its direct spans as the label
 * of the framework (see {@link LedaMenuButton}).
 */
export const HistoryMark = ({ icon }: { icon: IconDefinition }) => (
  <div css={mark}>
    <FontAwesomeIcon icon={icon} />
    <span>?</span>
  </div>
)

/** The symbol and its question mark side by side, small enough for the two of them to fit the medallion. */
const mark = css`
  display: flex;
  align-items: center;
  gap: 0.1em;
  font-size: 0.75em;
  font-weight: 700;
`
