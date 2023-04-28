import chalk from 'chalk'
import { schedule } from 'node-cron'
import { MessageHandler } from '.'
import { AnyMessageContent, delay } from '@adiwajshing/baileys'
import { client as NewsClient } from '@shineiichijo/anime-news-network-scraper'
import { Client } from '../Structures'

export class NewsHandler {
    constructor(private client: Client, private handler: MessageHandler) {}

    public loadNewsEnabledGroups = async (): Promise<void> => {
        const groups = this.handler.groups ? this.handler.groups : await this.client.getAllGroups()
        for (const group of groups) {
            const { news } = await this.client.DB.getGroup(group)
            if (!news) continue
            this.handler.news.push(group)
            this.client.log(
                `Successfully loaded ${chalk.blueBright(`${this.handler.news.length}`)} ${
                    this.handler.news.length > 1 ? 'groups' : 'group'
                } which has enabled news`
            )
            return await this.broadCastNews()
        }
    }

    private broadCastNews = async (): Promise<void> => {
        schedule('*/10 * * * *', async () => {
            const feeds = await NewsClient.getNewsFeeds()
            const { newsId } = await this.client.DB.getFeature('news')
            if (newsId === feeds[0].link) return void null
            const { link, categories } = feeds[0]
            const { title, trailer, description, intro, images } = await NewsClient.getNewsContents(link)
            const thumbnail = await this.client.utils.getBuffer(images[0] || 'https://i.imgur.com/KkkVr1g.png')
            const caption = `*━━━━━❰ JUST IN ❱━━━━━━*\n\n🎗 *Title:* ${title}\n\n❓ *Categories:* ${categories.join(
                ', '
            )}\n\n❄ *Intro:* ${intro}\n\n📒 *Description:* ${description}${
                trailer ? `\n\n🍁 *Trailer: ${trailer}*` : ''
            }`
            for (const group of this.handler.news) {
                await delay(8000)
                await this.client.sendMessage(group, {
                    image: thumbnail,
                    caption,
                    jpegThumbnail: thumbnail.toString('base64'),
                    contextInfo: {
                        externalAdReply: {
                            title: title,
                            body: intro,
                            thumbnail,
                            sourceUrl: link
                        }
                    }
                } as unknown as AnyMessageContent)
            }
            return void (await this.client.DB.feature.set('news.newsId', link))
        })
    }
}
