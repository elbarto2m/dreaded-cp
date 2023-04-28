import Reddit from 'reddit-image-fetcher'
import { Utils } from '.'

export class RedditFetcher {
    constructor(
        private reddit: string,
        private nsfw: boolean = false,
        private type: 'meme' | 'wallpaper' | 'custom' = 'custom'
    ) {}

    public fetch = async (): Promise<IRedditResponse | { error: string }> => {
        const reddits = this.reddit.trim().split(' ')
        return await Reddit.fetch({
            type: this.type,
            total: 50,
            allowNSFW: this.nsfw,
            subreddit: reddits,
            addSubreddit: [],
            removeSubreddit: []
        })
            .then((result) => {
                if (!result.length) return { error: 'An error occurred' }
                return result[0]
            })
            .catch(() => {
                return { error: 'An error occurred' }
            })
    }

    private utils = new Utils()
}

export interface IRedditResponse {
    id: string
    type: string
    title: string
    postLink: string
    image: string
    thumbnail: string
    subreddit: string
    NSFW: boolean
    spoiler: boolean
    createdUtc: number
    upvotes: number
    upvoteRatio: number
}
