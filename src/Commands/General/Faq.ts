import { BaseCommand, Command, Message } from '../../Structures'

@Command('faq', {
    description: '',
    usage: 'faq',
    category: 'general',
    exp: 10,
    cooldown: 10
})
export default class command extends BaseCommand {
    override execute = async ({ from, sender, message }: Message): Promise<void> => {
        const buttons = [
            {
                buttonId: 'id1',
                buttonText: { displayText: `${this.client.config.prefix}rules` },
                type: 1
            }
        ]
        const buttonMessage = {
            text: `*━━━❰ FAQ ❱━━━*\n\n📮 *Q1:* How do I add dreaded bot in my group?\n📑 *A:* Send the group link in the bot's or owner's DM & it will join soon.\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q2:* What are the requirements for the bot to join a group?\n📑 *A:* First the group must have atleast 50 members for the bot to join & the group must be active & also be a non-hentai/porn group.\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q3:* How do I earn XP in the group?\n📑 *A:* By earning XP you will need to use commands of the bot like reaction command & others.\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q4:* Can the bot work in personal message?\n📑 *A:* Yes, but ONLY stickers command will work otherwise you're recommended to use the bot in groups only.\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q5:* Can I call the bot?\n📑 *A:* Calling the bot is at your own pleasure but with consequences thus you will be blocked & banned instantly for calling the bot!\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q6:* Where can I find Dreaded bot?\n📑 *A:* Dreades bot is one of the bots owned by *Elbarto, fortunatus and pro yuji* group. Incase you need other bots, use the command ${this.client.config.prefix}support & you will get support group link in your DM.\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q7:* Can you hire a bot from *Dreaded bot?*\n📑 *A:* Based on the copyrights, we don't hire bots to anyone thus the bots are free to use.\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q8:* Why is the bot not working in my group?📑 *A:* There are 3 main reasons for that, either the bot is lagging due to data traffic, inactive or the bot has been banned.\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q9:* How can I create a bot like Dreaded botto?\n📑 *A:* You can't deploy a version of Dreaded botto thus it's not an open source project.\nᚖ ────── ✪ ────── ᚖ\n\n📮 *Q10:* Is the project of *Dreaded imc* group sponsored?\n📑 *A:* Of course not, we're not sponsored either way but it could be your own pleasure to do that thus this is a non-profit organization.\nᚖ ────── ✪ ────── ᚖ`,
            footer: '© Dreaded Inc 2023',
            buttons: buttons,
            headerType: 1
        }
        return void (await this.client.sendMessage(from, buttonMessage, {
            quoted: message
        }))
    }
}
