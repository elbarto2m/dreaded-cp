import { BaseCommand, Command, Message } from '../../Structures'

@Command('withdraw', {
    description: '',
    usage: '',
    cooldown: 15,
    exp: 5,
    category: 'economy'
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (M.numbers.length < 1) return void M.reply('amount?')
        const { bank } = await this.client.DB.getUser(M.sender.jid)
        if (M.numbers[0] > bank) return void M.reply(`check ur bank`)
        await this.client.DB.setGold(M.sender.jid, -M.numbers[0], 'bank')
        await this.client.DB.setGold(M.sender.jid, M.numbers[0])
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
            text: `*${M.numbers[0]}* gold to ur wallet`,
            footer: 'Dreaded',
            buttons: buttons,
            headerType: 1
        }
        return void (await this.client.sendMessage(M.from, buttonMessage, {
            quoted: M.message
        }))
    }
}
