import { Contact } from '@adiwajshing/baileys'
import {
    User,
    Group,
    Character,
    Feature,
    ChatSchema,
    SessionSchema,
    CardSchema,
    Contact as C,
    DisabledCommandsSchema
} from '../Database'
import { QuickDB } from 'quick.db'
import moment from 'moment-timezone'
import { Utils } from '../lib'
import { join } from 'path'

export class Database {
    public getUser = async (jid: string): Promise<User> =>
        (await this.user.get<User>(jid)) ||
        (await this.user.set<User>(jid, {
            jid,
            tag: this.utils.generateRandomUniqueTag(),
            wallet: 0,
            experience: 0,
            bank: 0,
            quizWins: 0,
            lastDaily: 0,
            lastRob: 0,
            ban: { banned: false },
            level: 1,
            party: [],
            pc: [],
            deck: [],
            cardCollection: [],
            inventory: [],
            icon: { custom: false },
            about: { custom: false },
            username: { custom: false },
            haigusha: { married: false, data: {} },
            companion: 'None',
            lastHeal: 0,
            gallery: []
        }))

    public setExp = async (jid: string, experience: number): Promise<void> => {
        experience = experience + Math.floor(Math.random() * 25)
        await this.updateUser(jid, 'experience', 'inc', experience)
    }

    public updateUser = async (
        jid: string,
        field: keyof User,
        method: 'inc' | 'set',
        update: User[typeof field]
    ): Promise<void> => {
        const x = await this.getUser(jid)
        if (method === 'inc') x[field as 'wallet'] += update as number
        //@ts-ignore
        else x[field] = update
        await this.user.set(jid, x)
    }

    public banUser = async (jid: string, bannedBy: string, bannedIn: string, reason: string) => {
        const x = await this.getUser(jid)
        const time = moment.tz('Etc/GMT').format('MMM D, YYYY HH:mm:ss')
        x.ban = {
            banned: true,
            bannedBy,
            bannedIn,
            time,
            reason
        }
        await this.user.set(jid, x)
    }

    public unbanUser = async (jid: string) => {
        const x = await this.getUser(jid)
        x.ban = {
            banned: false,
            bannedBy: '',
            bannedIn: '',
            time: '',
            reason: ''
        }
        await this.user.set(jid, x)
    }

    public setGold = async (jid: string, gold: number, field: 'wallet' | 'bank' = 'wallet'): Promise<void> => {
        await this.updateUser(jid, field, 'inc', gold)
    }

    public removeUser = async (jid: string): Promise<void> => {
        await this.user.delete(jid)
    }

    public getGroup = async (jid: string): Promise<Group> =>
        (await this.group.get<Group>(jid)) ||
        (await this.group.set<Group>(jid, {
            jid,
            mods: false,
            events: false,
            nsfw: false,
            wild: false,
            cards: false,
            news: false,
            bot: 'all',
            chara: false
        }))

    public updateGroup = async (jid: string, field: keyof Group, update: boolean | string): Promise<void> => {
        const x = await this.getGroup(jid)
        x[field as 'bot'] = update as string
        await this.group.set(jid, x)
    }

    public getMarriedSlugs = async (): Promise<string[]> => {
        const result =
            (await this.characters.get<Character>('married')) ||
            (await this.characters.set('married', { mwl: 'married', slugs: [] }))
        return result?.slugs || []
    }

    public getSession = async (sessionId: string): Promise<SessionSchema | null> => await this.session.get(sessionId)

    public saveNewSession = async (sessionId: string): Promise<void> => {
        await this.session.set(sessionId, { sessionId })
    }

    public updateSession = async (sessionId: string, session: string): Promise<void> => {
        await this.session.set(sessionId, { sessionId, session })
    }

    public removeSession = async (sessionId: string): Promise<void> => {
        await this.session.delete(sessionId)
    }

    public getContacts = async (): Promise<Contact[]> => {
        const result =
            (await this.contact.get<C>('contacts')) ||
            (await this.contact.set<C>('contacts', { ID: 'contacts', data: [] }))
        return result.data
    }

    public useInventoryItem = async (jid: string, item: string): Promise<void> => {
        const x = await this.getUser(jid)
        const index = x.inventory.findIndex((Item) => Item.item.toLowerCase() === item.toLowerCase())
        if (index < 0) return
        if (!x.inventory[index].usageLeft || x.inventory[index].usageLeft > 15) return
        const left = x.inventory[index].usageLeft
        if (left <= 1) x.inventory.splice(index, 1)
        else x.inventory[index].usageLeft -= 1
        await this.user.set(jid, x)
    }

    public denyCommand = async (command: string, reason: string, username: string) => {
        const disabledCommands = await this.getDisabledCommands()
        const time = moment.tz('Etc/GMT').format('MMM D, YYYY HH:mm:ss')
        disabledCommands.push({ command, reason, time, deniedBy: username })
        await this.disabledCommands.set(`commands.disabledCommands`, disabledCommands)
    }

    public acceptCommand = async (index: number) => {
        const disabledCommands = await this.getDisabledCommands()
        disabledCommands.splice(index, 1)
        await this.disabledCommands.set(`commands.disabledCommands`, disabledCommands)
    }

    public getClaimedCards = async (): Promise<CardSchema> =>
        (await this.card.get('cards')) || (await this.card.set('cards', { title: 'cards', data: [] }))

    public updateClaimedCards = async (data: CardSchema['data']): Promise<void> => {
        await this.getClaimedCards()
        await this.card.set('cards', { title: 'cards', data })
    }

    public addItem = async (
        name: string,
        description: string,
        emoji: string,
        price: number,
        usageLimit: number = 30
    ): Promise<void> => {
        const { items } = await this.getFeature('store')
        items.push({ name, emoji, description, price, usageLimit, id: items.length + 1 })
        await this.feature.set('store.items', items)
    }

    public getStore = async (): Promise<string> => {
        const { items } = await this.getFeature('store')
        let text = '🏬 *Store* 🏬\n'
        for (const item of items)
            text += `\n${item.emoji} *#${item.id} ${item.name
                .split(' ')
                .map((name) => this.utils.capitalize(name))
                .join(' ')}*\n\t💬 *Description:* ${item.description}\n\t🔖 *Price:* ${item.price}\n`
        return text
    }

    public getFeature = async (feature: string): Promise<Feature> => {
        if (feature !== 'store')
            return (
                (await this.feature.get(feature)) ||
                (await this.feature.set(feature, { feature, newsId: '', items: [] }))
            )
        return {
            feature: 'store',
            newsId: '',
            items: [
                {
                    id: 1,
                    name: 'protection charm',
                    description: 'Charm to protect user from getting robbed',
                    emoji: '🎐',
                    usageLimit: 15,
                    price: 150000
                },
                {
                    name: 'experience charm',
                    id: 2,
                    description: 'Charm to double the exprrience earned in using commands',
                    price: 25000,
                    usageLimit: 0,
                    emoji: '🌟'
                },
                {
                    name: 'gold charm',
                    id: 3,
                    description: 'Charm to double the gold earned in using commands',
                    price: 35000,
                    usageLimit: 0,
                    emoji: '✨'
                }
            ]
        }
    }

    public getDisabledCommands = async (): Promise<DisabledCommandsSchema['disabledCommands']> => {
        const result =
            (await this.disabledCommands.get<DisabledCommandsSchema>('commands')) ||
            (await this.disabledCommands.set<DisabledCommandsSchema>('commands', {
                title: 'commands',
                disabledCommands: []
            }))
        return result.disabledCommands
    }

    public updateDisabledCommands = async (update: DisabledCommandsSchema['disabledCommands']): Promise<void> => {
        await this.getDisabledCommands()
        await this.disabledCommands.set('commands.disabledCommands', update)
    }

    public getChat = async (chat: string): Promise<ChatSchema> =>
        (await this.chat.get<ChatSchema>(chat)) ||
        (await this.chat.set<ChatSchema>(chat, {
            chat,
            state: false
        }))

    public updateChat = async (chat: string, update: boolean): Promise<void> => {
        const x = await this.getChat(chat)
        x['state'] = update as boolean
        await this.chat.set(chat, x)
    }

    private path = (name: string) => join(__dirname, '..', '..', 'Database', `${name}.sqlite`)

    private utils = new Utils()

    public user = new QuickDB({ filePath: this.path('user') })

    public group = new QuickDB({ filePath: this.path('group') })

    public contact = new QuickDB({ filePath: this.path('contact') })

    public session = new QuickDB({ filePath: this.path('session') })

    public disabledCommands = new QuickDB({ filePath: this.path('disabled') })

    public feature = new QuickDB({ filePath: this.path('feature') })

    public characters = new QuickDB({ filePath: this.path('character') })

    public card = new QuickDB({ filePath: this.path('card') })

    public chat = new QuickDB({ filePath: this.path('chat') })
}
