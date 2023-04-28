import { BaseCommand, Command, Message } from '../../Structures'

@Command('daily', {
    category: 'economy',
    description: '',
    usage: 'daily',
    exp: 10
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        const pad = (s: number): string => (s < 10 ? '0' : '') + s
        const formatTime = (seconds: number): string => {
            const hours = Math.floor(seconds / (60 * 60))
            const minutes = Math.floor((seconds % (60 * 60)) / 60)
            const secs = Math.floor(seconds % 60)
            return `*${pad(hours)} hour(s), ${pad(minutes)} minute(s), ${pad(secs)} second(s)*`
        }
        const time = 86400000
        const { lastDaily: cd } = await this.client.DB.getUser(M.sender.jid)
        if (time - (Date.now() - cd) > 0) {
            const timeLeft = formatTime((time - (Date.now() - cd)) / 1000)
            return void M.reply(`You have claimed your daily gold recently. Claim again in ${timeLeft}`)
        }
        await this.client.DB.setGold(M.sender.jid, 1000)
        await this.client.DB.user.set(`${M.sender.jid}.lastDaily`, Date.now())
        const buttons = [
            {
                buttonId: 'id1',
                buttonText: { displayText: `${this.client.config.prefix}wallet` },
                type: 1
            },
            {
                buttonId: 'id2',
                buttonText: { displayText: `${this.client.config.prefix}bank` },
                type: 1
            }
        ]
        const buttonMessage = {
            text: '1000 gold has been claimed',
            footer: 'Dreaded',
            buttons: buttons,
            headerType: 1
        }
        return void (await this.client.sendMessage(M.from, buttonMessage, {
            quoted: M.message
        }))
    }
}
