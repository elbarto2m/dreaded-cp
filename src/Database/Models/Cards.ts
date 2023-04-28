import { prop, getModelForClass } from '@typegoose/typegoose'
import { Document } from 'mongoose'
import { TCardsTier } from '../../Types'

class Card {
    @prop({ type: String, required: true })
    public name!: string

    @prop({ type: String, required: true })
    public tier!: TCardsTier
}

export class CardSchema {
    @prop({ type: String, required: true, unique: true })
    public title!: string

    @prop({ type: () => Card, required: true, default: [] })
    public data!: Card[]
}

export type TCardsModel = CardSchema & Document

export const cardsSchema = getModelForClass(CardSchema)
