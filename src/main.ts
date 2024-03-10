type InitResult = {
    feedRepository: FeedRepository
    articleRepository: ArticleRepository
}

function init(): InitResult | null {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet()
    const sheets = spreadsheet.getSheets()
    let feeds: GoogleAppsScript.Spreadsheet.Sheet | null = null
    let articles: GoogleAppsScript.Spreadsheet.Sheet | null = null
    for (const sheet of sheets) {
        const name = sheet.getName()
        if (name === "feeds") {
            feeds = sheet
        } else if (name === "articles") {
            articles = sheet
        }
    }
    if (feeds === null || articles === null) {
        return null
    }
    const feedRepository = new FeedRepository(feeds)
    const articleRepository = new ArticleRepository(articles)
    return { feedRepository, articleRepository }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function main(): void {
    // const result = init()
    // if (result === null) {
    //     Logger.log("init failed")
    // }
    const feed = {
        id: "sample",
        title: "sample",
        url: "https://qiita.com/H1rono_K/feed",
        webhookUrl: "hogehoge",
    }
    const articles = fetchFeed(feed)
    Logger.log(articles)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function onFormSubmit(e: GoogleAppsScript.Events.SheetsOnFormSubmit): void {
    const range = e.range
    const values = range.getValues()
    const row = values[0]
    const eventTime = new Date(row[0])
    const feedTitle = row[1]
    const feedUrl = row[2]
    const feedWebhookUrl = row[3]

    const log = { eventTime, feedTitle, feedUrl, feedWebhookUrl }
    Logger.log(`[debug] ${JSON.stringify(log)}`)

    const result = init()
    if (result === null) {
        Logger.log("[fatal] init failed")
        return
    }

    const { feedRepository, articleRepository } = result
    const feed = feedRepository.tryAddFeed(feedTitle, feedUrl, feedWebhookUrl)
    if (feed === null) {
        Logger.log("[fatal] feed already exists")
        return
    }

    const res = updateFeed(articleRepository, feed, false)
    if (res === null || !res.every((r) => r.getResponseCode() === 200)) {
        Logger.log("[fatal] update failed")
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function cronUpdate(): void {
    const result = init()
    if (result === null) {
        Logger.log("[fatal] init failed")
        return
    }

    const { feedRepository, articleRepository } = result
    const feeds = feedRepository.getCurrentFeeds()
    for (const feed of feeds) {
        const res = updateFeed(articleRepository, feed, true)
        if (res === null || !res.every((r) => r.getResponseCode() === 200)) {
            const feedStr = JSON.stringify(feed)
            Logger.log(`[fatal] update failed with feed ${feedStr}`)
        }
    }
}
