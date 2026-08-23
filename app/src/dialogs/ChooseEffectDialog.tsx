import { css } from '@emotion/react'
import { LedaRules } from '@gamepark/leda/LedaRules'
import { EffectChoice } from '@gamepark/leda/material/Effect'
import { CustomMoveType } from '@gamepark/leda/rules/CustomMoveType'
import { Dialog, PlayMoveButton, ThemeButton, useUndo } from '@gamepark/react-game'
import { MaterialMoveBuilder } from '@gamepark/rules-api'
import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import { EffectIcon, EffectIcons } from '../headers/EffectIcon'
import { copper } from '../theme'

type ChooseEffectDialogProps = {
  choice: EffectChoice
  rules: LedaRules
  player: number
}

/**
 * An "OR" asked in the middle of the table rather than in the bar at the top of it, where a player who reads the
 * table first would walk past it. This is the whole of the choice: the bar behind it only says what is happening
 * (see {@link ChooseEffectHeader}, which mounts this for the player being asked).
 *
 * Hence a dialog that only closes when closing leads somewhere: the rules offer nothing but these branches, so
 * closing takes back the activation that led here, and the player may activate another square instead, or the
 * same one once they have looked at the table. An activation that revealed something cannot be taken back, a card
 * drawn for instance, and then there is nothing to close onto and no way out but answering.
 */
export const ChooseEffectDialog = ({ choice, rules, player }: ChooseEffectDialogProps) => {
  const { t } = useTranslation()
  const [undo, canUndo] = useUndo()
  const cancel = canUndo() ? () => undo() : undefined
  return (
    <Dialog open onBackdropClick={cancel}>
      <div css={content}>
        <h2 css={title}>{t('choose-effect.choose')}</h2>
        {/*
          The branches are written the way the cards print them, in symbols and not in words, and read against the
          player being asked. What the choice was reached through opens the line when it was reached through
          something: a special activation reads "1 crystal = 1 Food OR 1 Awakening", and the crystal is half of it.
          Nothing closes the dialog on a branch being played: the rule hands the game over on its own, and a card
          that asks twice in a row keeps it open on the question that follows.
        */}
        <div css={branches}>
          {choice.from !== undefined && (
            <span css={source}>
              <EffectIcon effect={choice.from} /> =
            </span>
          )}
          {choice.or.map((branch, branchIndex) => (
            <Fragment key={branchIndex}>
              {branchIndex > 0 && <span css={or}>{t('choose-effect.or')}</span>}
              <PlayMoveButton move={MaterialMoveBuilder.customMove(CustomMoveType.ChooseEffect, branchIndex)} css={branchButton}>
                <EffectIcons effects={branch} rules={rules} player={player} source={choice} />
              </PlayMoveButton>
            </Fragment>
          ))}
        </div>
        {/*
          "Annuler" is the platform's own word, which every game on it shares: taken from the common namespace
          rather than written again here, so that it reads the same in every locale the platform is translated in.
        */}
        {cancel !== undefined && (
          <div css={buttons}>
            <ThemeButton css={cancelButton} onClick={cancel}>
              {t('Cancel', { ns: 'common' })}
            </ThemeButton>
          </div>
        )}
      </div>
    </Dialog>
  )
}

/** Colors come from the theme: the Dialog of the framework already applies its background and its text color. */
const content = css`
  padding: 2em 3em;
`

const title = css`
  margin: 0 0 0.8em;
  text-align: center;
  font-size: 2.6em;
`

/** The line the choice is read on, laid out around whatever it was reached from. */
const branches = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1em;
`

const source = css`
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  font-size: 3em;
  color: ${copper};
`

const or = css`
  font-size: 2.4em;
  font-style: italic;
`

/**
 * The branches are cut to one size rather than to the symbols each holds: they are the faces of one choice, and
 * one of them being bigger than the others would read as one of them mattering more.
 * Sized in an em of their own, the symbols inside following along: their height is given in em too, and nothing
 * has to be said twice.
 */
const branchButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.3em;
  font-size: 3em;
  min-width: 3em;
  min-height: 2em;
  padding: 0.2em 0.6em;
`

const buttons = css`
  display: flex;
  justify-content: center;
  margin-top: 1.2em;
`

/**
 * Read as an answer to the question above it and not as a footnote to it, hence a size of its own rather than the
 * one the other dialogs give their buttons: this one is the way out of a choice the player did not mean to open.
 */
const cancelButton = css`
  font-size: 2.4em;
  padding: 0.3em 1.4em;
`
