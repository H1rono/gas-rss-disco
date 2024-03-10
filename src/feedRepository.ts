type Feed = {
    id: string
    title: string
    url: string
    webhookUrl: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class FeedRepository {
    constructor(private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet) {}

    getCurrentFeeds(): Feed[] {
        const lastRow = this.sheet.getLastRow()
        const lastColumn = this.sheet.getLastColumn()
        if (lastRow <= 1 || lastColumn <= 1) {
            return []
        }
        const range = this.sheet.getRange(2, 1, lastRow - 1, lastColumn)
        const values = range.getValues()
        const feeds = values.map((row) => {
            const id = row[0]
            const title = row[1]
            const url = row[2]
            const webhookUrl = row[3]
            return { id, title, url, webhookUrl }
        })
        return feeds
    }

    private generateFeedId(url: string, webhookUrl: string): string {
        const sha1 = Utilities.DigestAlgorithm.SHA_1
        const charset = Utilities.Charset.UTF_8
        const plain = `${url} | ${webhookUrl}`
        const hash = Utilities.computeDigest(sha1, plain, charset)
        return hash
            .map((v) => (v < 0 ? v + 256 : v))
            .map((v) => v.toString(16).padStart(2, "0"))
            .join("")
    }

    private appendFeed(feed: Feed): void {
        const lastRow = this.sheet.getLastRow()
        const lastColumn = this.sheet.getLastColumn()
        const range = this.sheet.getRange(lastRow + 1, 1, 1, lastColumn)
        range.setValues([[feed.id, feed.title, feed.url, feed.webhookUrl]])
    }

    tryAddFeed(title: string, url: string, webhookUrl: string): Feed | null {
        const feeds = this.getCurrentFeeds()
        const id = this.generateFeedId(url, webhookUrl)
        const feed = feeds.find((f) => f.id === id)
        if (feed !== undefined) {
            return null
        }
        const newFeed = { id, title, url, webhookUrl }
        this.appendFeed(newFeed)
        return newFeed
    }
}
