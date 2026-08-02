import { css } from '@emotion/react'
import { faHandBackFist } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { LocationType } from '@gamepark/leda/material/LocationType'
import { MaterialType } from '@gamepark/leda/material/MaterialType'
import { organisingPlayer } from '@gamepark/leda/rules/organisation'
import { usePlayerId, useRules } from '@gamepark/react-game'
import { useState } from 'react'
import { TakeOrganisationFoodDialog } from '../dialogs/TakeOrganisationFoodDialog'
import { LedaMenuButton } from './LedaMenuButton'

/**
 * The button that takes the 1 Food of an organisation, right under the reserve it comes from.
 * It opens a dialog rather than playing the move: the Food is what a swap pays, so taking it on its own means
 * giving up on the swap, which the player has to be told before they do it.
 *
 * Under the reserve rather than beside it, so that it stays in the middle column: the grids of the players are
 * only 3 cm away on each side, which is less than this medallion is wide.
 *
 * A closed hand for taking, the back of it rather than a raised fist: a raised fist is the military symbol of
 * the game, and it is printed on the very tokens this button has nothing to do with.
 */
export const TakeOrganisationFoodButton = () => {
  const rules = useRules<LedaRules>()
  const me = usePlayerId<number>()
  // Whether the dialog is open is state of this component, so it is forgotten as soon as the turn to organise ends.
  const [open, setOpen] = useState(false)
  // Never from the legal moves: they are filtered in the tutorial, and they come and go during animations.
  if (!rules || me === undefined || organisingPlayer(rules) !== me) return null

  // The move that creates the Food, built exactly like the rules build it: the two have to be the same object.
  const takeFood = rules.material(MaterialType.FoodToken).createItem({ location: { type: LocationType.PlayerFood, player: me }, quantity: 1 })

  return (
    <div css={clickable}>
      <LedaMenuButton y={2.6} onClick={() => setOpen(true)}>
        <FontAwesomeIcon icon={faHandBackFist} />
      </LedaMenuButton>
      <TakeOrganisationFoodDialog open={open} close={() => setOpen(false)} takeFood={takeFood} />
    </div>
  )
}

/** The location this button is the content of lets the pointer through, since there is nothing else to click on it. */
const clickable = css`
  pointer-events: auto;
  transform: translateZ(5em);
`
