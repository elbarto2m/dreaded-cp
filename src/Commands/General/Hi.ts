import { BaseCommand, Command, Message } from '../../Structures'

@Command('hi', {
    description: 'Says hello to the bot',
    category: 'general',
    usage: 'hi',
    aliases: ['hello'],
    exp: 25,
    cooldown: 5
})
export default class extends BaseCommand {
    public override execute = async ({ sender, reply }: Message): Promise<void> =>
        void (await reply(`Hello! i am ken-kaneki, all i want is for ghouls and humans to live together. *${sender.username}*`))
}
