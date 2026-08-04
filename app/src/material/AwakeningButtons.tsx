import { LedaRules } from '@gamepark/leda/LedaRules'
import { awakenings } from '@gamepark/leda/rules/specialActivation'
import { useRules } from '@gamepark/react-game'
import { useState } from 'react'
import { AwakeningRuleDialog } from '../dialogs/AwakeningRuleDialog'
import { AwakeningIcon } from '../headers/AwakeningIcon'
import { LedaMenuButton, ledaMenuButtonSize } from './LedaMenuButton'
import { tileSize } from './TileDescription'

/**
 * The Awakenings a player gathered while activating their zone and has not resolved yet. They are written down
 * rather than played out (see Memory.Awakenings), so nothing on the table would show them: these medallions under
 * the clan card of their owner are where they are counted, one medallion each.
 * The rule they are waiting for is not obvious, hence the dialog a click opens (see {@link AwakeningRuleDialog}).
 *
 * Read through the hooks rather than through the context handed to the material description: the count lives in
 * the memory of the game, so the card the medallions hang under never changes when it does.
 */
export const AwakeningButtons = ({ player }: { player: number }) => {
  const rules = useRules<LedaRules>()
  const [open, setOpen] = useState(false)
  const count = rules !== undefined ? awakenings(rules, player) : 0
  if (count === 0) return null
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <LedaMenuButton key={index} x={awakeningX} y={awakeningY + index * awakeningStep} onClick={() => setOpen(true)}>
          {/**
           * Wrapped so that the icon is not a span the medallion can reach: it styles its direct spans as the label
           * of the framework, which paints them parchment, and the icon is a mask filled with the color of the text
           * around it. Left alone it takes that color: ink on the parchment of the medallion, parchment while the
           * button is held down and the medallion turns to copper.
           */}
          <div>
            <AwakeningIcon />
          </div>
        </LedaMenuButton>
      ))}
      <AwakeningRuleDialog open={open} close={() => setOpen(false)} />
    </>
  )
}

/**
 * Where the medallions hang, in centimeters from the center of the clan card: down the first quarter of the space
 * under it, which is the column the Shark tokens are in. A Panda player has no Shark token, and their Military
 * Victory tokens only come up that column from the 6th one on, from the bottom, so it is theirs to use.
 */
const awakeningX = -tileSize / 4
const awakeningY = tileSize / 2 + 0.3 + ledaMenuButtonSize / 2
const awakeningStep = ledaMenuButtonSize + 0.3
