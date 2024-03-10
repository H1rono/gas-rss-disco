function parseRssFeed(feedId: string, xml: string): Article[] {
    const document = XmlService.parse(xml)
    const root = document.getRootElement()
    const channel = root.getChild("channel")
    const items = channel.getChildren("item")
    const articles = items.map((item) => {
        const title = item.getChildText("title")
        const url = item.getChildText("link")
        return { feedId, title, url }
    })
    return articles
}

function parseAtomFeed(feedId: string, xml: string): Article[] {
    const document = XmlService.parse(xml)
    const root = document.getRootElement()
    const atom = XmlService.getNamespace("http://www.w3.org/2005/Atom")
    const entries = root.getChildren("entry", atom)
    const articles = entries.map((entry) => {
        const title = entry.getChildText("title", atom)
        const url = entry.getChild("link", atom).getAttribute("href").getValue()
        return { feedId, title, url }
    })
    return articles
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseFeed(feedId: string, xml: string): Article[] {
    try {
        return parseAtomFeed(feedId, xml)
    } catch (_) {
        // do nothing
    }
    return parseRssFeed(feedId, xml)
}
