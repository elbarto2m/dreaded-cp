import { Command, BaseCommand, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('accept', {
    category: 'dev',
    description: 'Accepts (or enables) a command globally',
    dm: true,
    usage: 'accept [command]'
})
export default class command extends BaseCommand {
    override execute = async ({ reply }: Message, { context }: IArgs): Promise<void> => {
        if (!context) return void reply('🟥 *Provide the command that you want it to be accepted globally*')
        const cmd = context.toLowerCase().trim()
        const command = this.handler.commands.get(cmd) || this.handler.aliases.get(cmd)
        if (!command) return void reply('🟨 *Provide a command which exists*')
        const commands = await this.client.DB.getDisabledCommands()
        const index = commands.findIndex((x) => x.command === command.name)
        if (index < 0)
            return void reply(`🟨 *${this.client.utils.capitalize(command.name)}* is already accepted globally`)
        await this.client.DB.acceptCommand(index)
        return void reply(`🟩 *${this.client.utils.capitalize(cmd)}* is accepted globally now`)
    }
}
