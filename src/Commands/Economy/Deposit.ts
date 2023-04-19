import { BaseCommand, Command, Message } from '../../Structures'

@Command('deposit', {
    description: '',
    usage: '',
    cooldown: 15,
    exp: 5,
    category: 'economy'
})
export default class command extends BaseCommand {
    override execute = async (M: Message): Promise<void> => {
        if (M.numbers.length < 1) return void M.reply('Specify the amount of gold to deposit')
        const { wallet } = await this.client.DB.getUser(M.sender.jid)
        if (M.numbers[0] > wallet) return void M.reply(`Check your wallet`)
        await this.client.DB.setGold(M.sender.jid, M.numbers[0], 'bank')
        await this.client.DB.setGold(M.sender.jid, -M.numbers[0])
        const buttons = [
            {
          
            text: `${M.numbers[0]} to your bank`,
            footer: 'Dreaded',
            buttons: buttons,
            headerType: 1
        }
        return void (await this.client.sendMessage(M.from, buttonMessage, {
            quoted: M.message
        }))
    }
}
