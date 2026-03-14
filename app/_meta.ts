export default {
  index: {
    title: "mukoko registry",
    type: "page",
    theme: {
      layout: "full",
      sidebar: false,
      toc: false,
      pagination: false,
      breadcrumb: false,
    },
  },
  brand: {
    title: "Brand",
    type: "page",
  },
  architecture: {
    title: "Architecture",
    type: "page",
  },
  patterns: {
    title: "Patterns",
    type: "page",
  },
  api: {
    title: "API",
    type: "page",
    href: "/api/v1",
  },
  "---": {
    type: "separator",
  },
  ecosystem: {
    title: "Ecosystem",
    type: "menu",
    items: {
      mukoko: {
        title: "mukoko.com",
        href: "https://www.mukoko.com",
      },
      lingo: {
        title: "lingo",
        href: "https://lingo.mukoko.com",
      },
      nhimbe: {
        title: "nhimbe",
        href: "https://nhimbe.com",
      },
      bushtrade: {
        title: "bushtrade",
        href: "https://bushtrade.co.zw",
      },
      bundu: {
        title: "bundu",
        href: "https://bundu.family",
      },
      news: {
        title: "news",
        href: "https://news.mukoko.com",
      },
      weather: {
        title: "weather",
        href: "https://weather.mukoko.com",
      },
    },
  },
}
