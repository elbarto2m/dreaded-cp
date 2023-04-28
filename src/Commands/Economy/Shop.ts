import { Command, BaseCommand, Message } from '../../Structures'

@Command('store', {
    description: 'Shows the available items in the store',
    aliases: ['shop'],
    cooldown: 15,
    exp: 10,
    category: 'economy',
    usage: 'store'
})
export default class command extends BaseCommand {
    override execute = async ({ from, message }: Message): Promise<void> => {
        const rows: IRows[] = []
        const { items } = await this.client.DB.getFeature('store')
        for (const { id, name, emoji } of items)
            rows.push({
                rowId: `${this.client.config.prefix}buy ${id}`,
                title: `${emoji} ${name
                    .split(' ')
                    .map((item) => this.client.utils.capitalize(item))
                    .join(' ')}`
            })
        let text = await this.client.DB.getStore()
        text += `\n📕 *Note:* Use *${this.client.config.prefix}buy <item_index_number>* to buy an item`
        return void (await this.client.sendMessage(
            from,
            {
                text,
                footer: 'Dreaded',
                buttonText: 'Store',
                sections: [
                    {
                        title: 'Items',
                        rows
                    }
                ]
            },
            {
                quoted: message
            }
        ))
    }
}

interface IRows {
    title: string
    rowId: string
    description?: string
}
