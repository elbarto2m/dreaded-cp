import chalk from 'chalk'
import { config as Config } from 'dotenv'
import EventEmitter from 'events'
import TypedEventEmitter from 'typed-emitter'
import Baileys, {
    DisconnectReason,
    fetchLatestBaileysVersion,
    ParticipantAction,
    proto,
    WACallEvent,
    BinaryNode,
    useMultiFileAuthState
} from '@adiwajshing/baileys'
import P from 'pino'
import { Boom } from '@hapi/boom'
import qr from 'qr-image'
import { Utils } from '../lib'
import { Database, Contact, Message, Server, AuthenticationFromDatabase } from '.'
import { Pokemon } from '../Database'
import { IConfig, client, IEvent, ICall } from '../Types'

export class Client extends (EventEmitter as new () => TypedEventEmitter<Events>) {
    private client!: client
    constructor() {
        super()
        Config()
        this.config = {
            name: 'Dredd',
            session: 'Whatsapp-Web',
            prefix: ':',
            chatBotUrl: process.env.CHAT_BOT_URL || '',
            mods: [],
            PORT: Number(process.env.PORT || Math.floor(Math.random() * (9000 - 3000) + 3000)),
            casinoGroup: '',
            adminsGroup: ''
        }
        new Server(this)
    }

    public start = async (): Promise<client> => {
        //await connect('mongodb+srv://shinei:BAKA@just.xmzds.mongodb.net/?retryWrites=true&w=majority')
        //this.log('Connected to the Database')
        const { useDatabaseAuth } = new AuthenticationFromDatabase(this.config.session)
        const { saveCreds, state } = await useMultiFileAuthState('s')
        this.client = Baileys({
            version: (await fetchLatestBaileysVersion()).version,
            printQRInTerminal: true,
            auth: state,
            logger: P({ level: 'fatal' }),
            browser: ['WhatsApp Web', 'Chrome', '4.0.0'],
            getMessage: async (key) => {
                return {
                    conversation: ''
                }
            },
            msgRetryCounterMap: {},
            markOnlineOnConnect: false
        })
        for (const method of Object.keys(this.client))
            this[method as keyof Client] = this.client[method as keyof client]
        this.ev.on('call', (a) => void this.emit('new_call', a[0]))
        this.ev.on('contacts.update', async (contacts) => await this.contact.saveContacts(contacts))
        this.ev.on('messages.upsert', async ({ messages }) => {
            const M = new Message(messages[0], this)
            if ((M.type === 'protocolMessage' || M.type === 'senderKeyDistributionMessage') && M.content === '')
                return void null
            if (M.stubType && M.stubParameters) {
                const emitParticipantsUpdate = (action: ParticipantAction): boolean =>
                    this.emit('participants_update', {
                        jid: M.from,
                        participants: M.stubParameters as string[],
                        action
                    })
                switch (M.stubType) {
                    case proto.WebMessageInfo.StubType.GROUP_CREATE:
                        return void this.emit('new_group_joined', {
                            jid: M.from,
                            subject: M.stubParameters[0]
                        })
                    case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_ADD:
                    case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_ADD_REQUEST_JOIN:
                    case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_INVITE:
                        return void emitParticipantsUpdate('add')
                    case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_LEAVE:
                    case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_REMOVE:
                        return void emitParticipantsUpdate('remove')
                    case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_DEMOTE:
                        return void emitParticipantsUpdate('demote')
                    case proto.WebMessageInfo.StubType.GROUP_PARTICIPANT_PROMOTE:
                        return void emitParticipantsUpdate('promote')
                }
            }
            return void this.emit('new_message', await M.simplify())
        })
        this.ev.on('connection.update', (update) => {
            if (update.qr) {
                this.log(
                    `QR code generated. Scan it to continue | You can also authenicate in http://localhost:${this.config.PORT}`
                )
                this.QR = qr.imageSync(update.qr)
            }
            const { connection, lastDisconnect } = update
            if (connection === 'close') {
                if ((lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                    this.log('Reconnecting...')
                    this.start()
                } else {
                    this.log('Disconnected.', true)
                }
            }
            if (connection === 'connecting') {
                this.condition = 'connecting'
                this.log('Connecting to WhatsApp...')
            }
            if (connection === 'open') {
                this.condition = 'connected'
                this.log('Connected to WhatsApp')
                this.emit('open')
            }
        })
        this.ev.on('creds.update', saveCreds)
        return this.client
    }

    public utils = new Utils()

    public DB = new Database()

    public config: IConfig

    public contact = new Contact(this)

    public rejectCall = async (call: WACallEvent): Promise<void> => {
        if (call.status !== 'offer') return void null
        const { authState } = this
        const stanza: BinaryNode = {
            tag: 'call',
            attrs: {
                from: authState.creds.me!.id,
                to: call.from,
                id: (new Date().getTime() / 1000).toString().replace('.', '-')
            },
            content: [
                {
                    tag: 'reject',
                    attrs: {
                        'call-id': call.id,
                        'call-creator': call.from,
                        count: '0'
                    },
                    content: undefined
                }
            ]
        }
        return await this.sendNode(stanza)
    }

    public getAllGroups = async (): Promise<string[]> => Object.keys(await this.groupFetchAllParticipating())

    public correctJid = (jid: string): string => `${jid.split('@')[0].split(':')[0]}@s.whatsapp.net`

    public assets = new Map<string, Buffer>()

    public log = (text: string, error: boolean = false): void =>
        console.log(chalk[error ? 'red' : 'blue']('[SHOOTING_STAR]'), chalk[error ? 'redBright' : 'greenBright'](text))

    public QR!: Buffer

    public condition!: 'connected' | 'connecting' | 'logged_out'

    public appPatch!: client['appPatch']
    public assertSessions!: client['assertSessions']
    public authState!: client['authState']
    public chatModify!: client['chatModify']
    public end!: client['end']
    public ev!: client['ev']
    public fetchBlocklist!: client['fetchBlocklist']
    public fetchPrivacySettings!: client['fetchPrivacySettings']
    public fetchStatus!: client['fetchStatus']
    public generateMessageTag!: client['generateMessageTag']
    public getBusinessProfile!: client['getBusinessProfile']
    public getCatalog!: client['getCatalog']
    public getCollections!: client['getCollections']
    public getOrderDetails!: client['getOrderDetails']
    public groupAcceptInvite!: client['groupAcceptInvite']
    public groupAcceptInviteV4!: client['groupAcceptInviteV4']
    public groupInviteCode!: client['groupInviteCode']
    public groupLeave!: client['groupLeave']
    public groupMetadata!: client['groupMetadata']
    public groupCreate!: client['groupCreate']
    public groupFetchAllParticipating!: client['groupFetchAllParticipating']
    public groupGetInviteInfo!: client['groupGetInviteInfo']
    public groupRevokeInvite!: client['groupRevokeInvite']
    public groupSettingUpdate!: client['groupSettingUpdate']
    public groupToggleEphemeral!: client['groupToggleEphemeral']
    public groupUpdateDescription!: client['groupUpdateDescription']
    public groupUpdateSubject!: client['groupUpdateSubject']
    public groupParticipantsUpdate!: client['groupParticipantsUpdate']
    public logout!: client['logout']
    public presenceSubscribe!: client['presenceSubscribe']
    public productDelete!: client['productDelete']
    public productCreate!: client['productCreate']
    public productUpdate!: client['productUpdate']
    public profilePictureUrl!: client['profilePictureUrl']
    public updateMediaMessage!: client['updateMediaMessage']
    public query!: client['query']
    public readMessages!: client['readMessages']
    public refreshMediaConn!: client['refreshMediaConn']
    public relayMessage!: client['relayMessage']
    public resyncAppState!: client['resyncAppState']
    public sendMessageAck!: client['sendMessageAck']
    public sendNode!: client['sendNode']
    public sendRawMessage!: client['sendRawMessage']
    public sendRetryRequest!: client['sendRetryRequest']
    public sendMessage!: client['sendMessage']
    public sendPresenceUpdate!: client['sendPresenceUpdate']
    public sendReceipt!: client['sendReceipt']
    public type!: client['type']
    public updateBlockStatus!: client['updateBlockStatus']
    public onUnexpectedError!: client['onUnexpectedError']
    public onWhatsApp!: client['onWhatsApp']
    public uploadPreKeys!: client['uploadPreKeys']
    public updateProfilePicture!: client['updateProfilePicture']
    public user!: client['user']
    public ws!: client['ws']
    public waitForMessage!: client['waitForMessage']
    public waitForSocketOpen!: client['waitForSocketOpen']
    public waitForConnectionUpdate!: client['waitForConnectionUpdate']
    public waUploadToServer!: client['waUploadToServer']
}

type Events = {
    new_call: (call: WACallEvent) => void
    new_message: (M: Message) => void
    participants_update: (event: IEvent) => void
    new_group_joined: (group: { jid: string; subject: string }) => void
    open: () => void
    pokemon_levelled_up: (data: {
        M: Message
        pokemon: Pokemon
        inBattle: boolean
        player: 'player1' | 'player2'
        user: string
    }) => void
}
