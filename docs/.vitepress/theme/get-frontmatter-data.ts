// reference: https://yingjiezhao.com/zh/articles/vitepress-sidebar-auto-generation/

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import matter from "gray-matter";

/** 文章元数据接口 */
interface PostMeta {
    /** 文章标题 */
    title: string;
    /** 撰写日期 */
    date: Date;
    /** 标签 */
    tags?: string[];
    /** 摘要 */
    excerpt?: string;
    /** 链接 */
    url?: string;
};

const files = await readdir(path.resolve('./docs/'));

// 解析文章信息
const FRONTMATTER_DATA: PostMeta[] = [];
for (const file of files) {
    if (!(['.MD', '.md'].includes(path.extname(file)))) {
        // 跳过非文章页面 (markdown格式)
        // console.warn(`❌ ${file} omitted`);
        continue;
    }
    const content = await readFile(path.resolve("./docs/", file), 'utf-8');
    const grayMatter = matter(content);
    const meta = grayMatter.data;
    // https://vitepress.dev/reference/frontmatter-config#sidebar
    if ('sidebar' in meta && !meta.sidebar) {
        // console.warn(`❌ ${file} omitted`);
        continue;
    }
    const pMeta: PostMeta = {
        title: meta.title || path.basename(file, '.md'),
        date: meta.date, // date must be specified
        tags: meta.tags || [],
        excerpt: meta.excerpt,
        url: `/${file.replace(/\.md$/, '')}`,
    }
    // console.debug(`✔️ ${file} added`);
    FRONTMATTER_DATA.push(pMeta);
}
/** all posts' frontmatter data */
export default FRONTMATTER_DATA;
