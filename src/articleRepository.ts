type Article = {
    feedId: string
    title: string
    url: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ArticleRepository {
    constructor(private readonly sheet: GoogleAppsScript.Spreadsheet.Sheet) {}

    getCurrentArticles(): Article[] {
        const lastRow = this.sheet.getLastRow()
        const lastColumn = this.sheet.getLastColumn()
        if (lastRow <= 1 || lastColumn <= 1) {
            return []
        }
        const range = this.sheet.getRange(2, 1, lastRow - 1, lastColumn)
        const values = range.getValues()
        const articles = values.map((row) => {
            const feedId = row[0]
            const title = row[1]
            const url = row[2]
            return { feedId, title, url }
        })
        return articles
    }

    getCurrentArticlesByFeedId(feedId: string): Article[] {
        const articles = this.getCurrentArticles()
        return articles.filter((a) => a.feedId === feedId)
    }

    getCurrentArticlesByFeedIdAndUrl(feedId: string, url: string): Article[] {
        const articles = this.getCurrentArticlesByFeedId(feedId)
        return articles.filter((a) => a.url === url)
    }

    appendArticle(article: Article): void {
        const lastRow = this.sheet.getLastRow()
        const lastColumn = this.sheet.getLastColumn()
        const range = this.sheet.getRange(lastRow + 1, 1, 1, lastColumn)
        range.setValues([[article.feedId, article.title, article.url]])
    }

    tryAddArticle(feedId: string, title: string, url: string): Article | null {
        const articles = this.getCurrentArticles()
        const article = articles.find((a) => a.url === url)
        if (article !== undefined) {
            return null
        }
        const newArticle = { feedId, title, url }
        this.appendArticle(newArticle)
        return newArticle
    }
}
