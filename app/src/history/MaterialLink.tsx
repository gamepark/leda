import { css } from '@emotion/react'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { Picture, PlayMoveButton } from '@gamepark/react-game'
import { MaterialItem, MaterialMoveBuilder } from '@gamepark/rules-api'
import { materialImage } from './logMaterial'

/**
 * A piece named inside a log entry: its picture, drawn inline in the sentence, and clicked to open the help of
 * that piece. The material of LEDA has no name of any kind, only icons, so a picture is the one way a sentence can
 * say which card or which tile it is talking about.
 *
 * The item is handed over as it was when the move was played rather than by its index: a log is read long after
 * the fact, and the card it names may by then be buried under another one or back in a deck.
 * Nothing is drawn at all for a piece the reader may not see, which is what tells a log entry to write the other
 * of its 2 sentences instead (see {@link materialImage}).
 */
export const MaterialLink = ({ type, item, flipped }: { type: MaterialType; item?: Partial<MaterialItem<number, LocationType>>; flipped?: boolean }) => {
  const image = materialImage(type, item?.id, flipped)
  if (item === undefined || image === undefined) return null
  return (
    <PlayMoveButton move={MaterialMoveBuilder.displayMaterialHelp<number, MaterialType, LocationType>(type, item)} transient css={linkButton}>
      <Picture src={image} css={picture} alt="" />
    </PlayMoveButton>
  )
}

/** The button is only there to make the picture clickable: nothing of it is drawn around it. */
const linkButton = css`
  && {
    display: inline;
    padding: 0;
    border: none;
    background: none;
    box-shadow: none;
    vertical-align: baseline;
  }
`

/** Sized off the text of the entry, high enough for the icons printed on a card to be told apart. */
const picture = css`
  && {
    height: 2.2em;
    top: 0;
    vertical-align: -0.7em;
  }
`
