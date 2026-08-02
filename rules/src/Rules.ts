import { MaterialRules } from '@gamepark/rules-api'
import { LocationType } from './material/LocationType'
import { MaterialType } from './material/MaterialType'

/**
 * All that a helper reading the game outside of a rule needs, and which both a part of the rules and the
 * MaterialRules instance the app holds satisfy.
 * What a card costs, or what a player may still do, has to be answered the same way on both sides, so it is
 * written once against this rather than twice against each.
 */
export type Rules = Pick<MaterialRules<number, MaterialType, LocationType>, 'game' | 'material'>
