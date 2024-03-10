/*
 * ```bash
 * curl \
 *     -X POST \
 *     -H "Content-Type: application/json" \
 *     -d '{
 *         "content": "$ARTICLE_TITLE | $FEED_TITLE",
 *         "embeds": [
 *             {
 *                 "title": "$ARTICLE_TITLE",
 *                 "url": "$ARTICLE_URL"
 *         }
 *     }' \
 *     "$WEBHOOK_URL"
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function notice(feed: Feed, article: Article): GoogleAppsScript.URL_Fetch.HTTPResponse {
    const title = article.title
    const url = article.url
    const payload = {
        content: `${title} | ${feed.title}`,
        embeds: [{ title, url }],
    }
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
    }
    return UrlFetchApp.fetch(feed.webhookUrl, options)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fetchFeed(feed: Feed): Article[] | null {
    const url = feed.url
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        method: "get",
        muteHttpExceptions: true,
    }
    const response = UrlFetchApp.fetch(url, options)
    if (response.getResponseCode() !== 200) {
        Logger.log(`[error] GET ${url} returned ${response.getResponseCode()}`)
        return null
    }
    try {
        const xml = response.getContentText()
        return parseFeed(feed.id, xml)
    } catch (e) {
        Logger.log(`[error] failed to parse feed ${JSON.stringify(feed)}`)
        Logger.log(e)
        return null
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function updateFeed(
    articleRepository: ArticleRepository,
    feed: Feed,
    sendNotification: boolean,
): GoogleAppsScript.URL_Fetch.HTTPResponse[] | null {
    const articles = fetchFeed(feed)
    if (articles === null) {
        return null
    }
    const currentArticles = articleRepository.getCurrentArticlesByFeedId(feed.id)
    const articleMap = new Map<string, Article>()
    for (const article of currentArticles) {
        articleMap.set(article.url, article)
    }
    const responses = []
    for (const article of articles) {
        if (articleMap.has(article.url)) {
            continue
        }
        articleRepository.appendArticle(article)
        articleMap.set(article.url, article)
        if (sendNotification) {
            const response = notice(feed, article)
            responses.push(response)
        }
    }
    return responses
}
