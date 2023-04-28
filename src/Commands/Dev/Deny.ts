import { Command, BaseCommand, Message } from '../../Structures'
import { IArgs } from '../../Types'

@Command('deny', {
    description: 'Denies (or disables) a command globally',
    category: 'dev',
    dm: true,
    usage: 'deny [command]'
})
export default class command extends BaseCommand {
    override execute = async ({ sender, reply }: Message, { context }: IArgs): Promise<void> => {
        if (!context)
            return void reply(
                '🟥 *Provide the command that you want it to be denied globally with the reason for denying it*'
            )
        const terms = context.trim().split('|')
        const cmd = terms[0].toLowerCase().trim()
        if (!terms[1])
            return void reply(
                `🟥 *Provide the reason for denying it*. Example - *${this.client.config.prefix}deny hi | Under maintenance*`
            )
        const command = this.handler.commands.get(cmd) || this.handler.aliases.get(cmd)
        if (!command) return void reply('🟨 *Provide a command which exists*')
        const commands = await this.client.DB.getDisabledCommands()
        const index = commands.findIndex((x) => x.command === command.name)
        if (index >= 0)
            return void reply(
                `🟨 *${this.client.utils.capitalize(cmd)}* is already denied globally by *${
                    commands[index].deniedBy
                }* in *${commands[index].time} (GMT)*. 🎈 Reason: *${commands[index].reason}*`
            )
        const reason = terms[1].trim()
        await this.client.DB.denyCommand(command.name, reason, sender.username)
        return void reply(`🎏 *${this.client.utils.capitalize(cmd)}* is denied globally now. 🎈 Reason: *${reason}*`)
    }
}
