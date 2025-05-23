import path from 'path'
import { writeFileSync } from 'fs'
import { Feed } from 'feed'
import { createContentLoader, type SiteConfig } from 'vitepress'

import { BLOG_HOST } from "./constants";

const baseUrl =  BLOG_HOST + '/blog';

export async function genFeed(config: SiteConfig) {
  const feed = new Feed({
    title: "ZXS's blog",
    description: 'blog site for ZXS',
    id: baseUrl,
    link: baseUrl,
    language: 'en',
    image: `${baseUrl}/favicon.ico`,
    favicon: `${baseUrl}/favicon.ico`,
    copyright:
      'Copyright (c) 2020-present, ZXS'
  })

  const posts = await createContentLoader('*.md', {
    excerpt: true,
    render: true
  }).load()

  posts.sort(
    (a, b) =>
      +new Date(b.frontmatter.date as string) -
      +new Date(a.frontmatter.date as string)
  )

  for (const { url, excerpt, frontmatter, html } of posts) {
    feed.addItem({
      title: frontmatter.title,
      id: `${baseUrl}${url}`,
      link: `${baseUrl}${url}`,
      description: excerpt,
      content: html?.replace(/&ZeroWidthSpace;/, ''),
      author: [
        {
          name: frontmatter.author,
          link: frontmatter.twitter
            ? `https://twitter.com/${frontmatter.twitter}`
            : undefined
        }
      ],
      date: frontmatter.date
    })
  }

  writeFileSync(path.join(config.outDir, 'feed.rss'), feed.rss2())
}
