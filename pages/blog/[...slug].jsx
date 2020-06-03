import Blog from "../../components/layouts/Blog"
import BlogPost from "../../components/layouts/BlogPost"
import BlogDate from "../../components/blog/BlogDate"
import BlogEntry from "../../components/blog/BlogEntry"
import Pagination from "../../components/blog/Pagination"
import POSTS from "../../components/blog/get-all-posts"
import Link from "next/link"
import capitalize from "lodash/capitalize"

import { Clock } from "react-feather"

import Facebook from "@icons-pack/react-simple-icons/lib/Facebook"
import Linkedin from "@icons-pack/react-simple-icons/lib/Linkedin"
import Twitter from "@icons-pack/react-simple-icons/lib/Twitter"

const MAX_ITEMS_PER_PAGE = 6

const CATEGORIES = (() => {
  let categories = new Set()
  for (let p of POSTS) {
    if (p.meta.category !== undefined) {
      categories.add(p.meta.category)
    }
  }
  return [...categories]
})()

export async function getStaticPaths() {
  let paths = POSTS.map(p => ({ params: { slug: [p.slug, ""] } }))

  // catch categories
  for (let c of CATEGORIES) {
    paths.push({
      params: {
        slug: ["category", c, ""]
      }
    })
  }

  // catch pages
  let numPages = Math.ceil(POSTS.length / MAX_ITEMS_PER_PAGE)
  for (let p = 1; p < numPages; ++p) {
    paths.push({
      params: {
        slug: ["page", `${p + 1}`, ""]
      }
    })
  }

  // catch pages for categories
  for (let c of CATEGORIES) {
    let categoryPosts = POSTS.filter(p => p.meta.category === c)
    let nCategoryPages = Math.ceil(categoryPosts.length / MAX_ITEMS_PER_PAGE)
    for (let p = 1; p < nCategoryPages; ++p) {
      paths.push({
        params: {
          slug: ["category", c, "page", `${p + 1}`, ""]
        }
      })
    }
  }

  return {
    paths,
    fallback: false
  }
}

export async function getStaticProps({ params }) {
  let slug = params.slug[0]

  // handle page index
  if (slug === "page") {
    let page = parseInt(params.slug[1])
    return {
      props: {
        page
      }
    }
  }

  // handle category index
  if (slug === "category") {
    let category = params.slug[1]

    // handle pages
    let page
    if (params.slug.length > 3 && params.slug[2] === "page") {
      page = parseInt(params.slug[3])
    }

    return {
      props: {
        category,
        ...(page && { page })
      }
    }
  }

  // handle blog posts
  const fs = require("fs").promises
  const readingTime = require("reading-time")

  let post = POSTS.find(p => p.slug === slug)
  let source = await fs.readFile(`blog/${post.filename}`, "utf-8")
  let stats = readingTime(source)

  return {
    props: {
      ...post,
      readingTime: stats
    }
  }
}

export default ({ filename, date, slug, readingTime, category, page = 1 }) => {
  if (filename === undefined) {
    // filter posts by category
    let posts = POSTS
    if (category !== undefined) {
      posts = posts.filter(p => p.meta.category === category)
    }

    // display current page
    let numPages = Math.ceil(posts.length / MAX_ITEMS_PER_PAGE)
    posts = posts.slice(MAX_ITEMS_PER_PAGE * (page - 1), MAX_ITEMS_PER_PAGE * page)

    let entries = posts.map(p => <BlogEntry key={p.slug} post={p} />)

    return (
      <Blog meta={{ title: `${capitalize(category)} | Blog` }} categories={CATEGORIES}>
        <div className="blog-entries">
          {entries}
        </div>
        <Pagination currentPage={page} numPages={numPages} category={category} />
      </Blog>
    )
  }

  let post = require(`../../blog/${filename}`)
  let PostComponent = post.default

  let postIndex = POSTS.findIndex(p => p.slug === slug)
  let prevPost
  let nextPost
  if (postIndex > 0) {
    prevPost = POSTS[postIndex - 1]
  }
  if (postIndex < POSTS.length - 1) {
    nextPost = POSTS[postIndex + 1]
  }

  let url = `${process.env.baseUrl}/blog/${slug}`

  return (
    <BlogPost meta={{ title: `${post.meta.title} | Blog` }} categories={CATEGORIES}>
      <div className="blog-post-main">
        <div className="blog-post-content">
          <PostComponent />
        </div>

        <div className="blog-post-sidebar">
          {post.meta.authors.map(author => (
            <div className="blog-post-author" key={author.github_id}>
              <img className="blog-post-author-avatar"
                src={`https://github.com/${author.github_id}.png?size=160`} />
              <div className="blog-post-author-name">
                {post.meta.authors.length === 1 && "by "}<a href={`https://github.com/${author.github_id}`}
                  target="_blank" rel="noopener noreferrer">{author.name}</a>
              </div>
            </div>
          ))}
          <div className="blog-post-sidebar-date">Posted on <BlogDate date={date} /></div>
          in <Link href="/blog/[...slug]" as={`/blog/category/${post.meta.category}/`}>
            <a className="blog-post-sidebar-category">{post.meta.category}</a>
          </Link>
          <div className="blog-post-sidebar-reading-time"><Clock className="feather" /> {readingTime.text}</div>
          <div className="blog-post-sidebar-share-icons">
            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.meta.title)}&url=${encodeURIComponent(url)}&via=vertx_project`}
                target="_blank" rel="noopener noreferrer">
              <Twitter />
            </a>
            <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                target="_blank" rel="noopener noreferrer">
              <Linkedin />
            </a>
            <a href={`https://www.facebook.com/sharer.php?u=${encodeURIComponent(url)}`}
                target="_blank" rel="noopener noreferrer">
              <Facebook />
            </a>
          </div>
        </div>
      </div>

      <div className="blog-post-next-prev">
        <div className="blog-post-next-prev-entry">
          {prevPost && (<>
            <h5>Next post</h5>
            <BlogEntry post={prevPost} />
          </>)}
        </div>

        <div className="blog-post-next-prev-entry">
        </div>

        <div className="blog-post-next-prev-entry">
          {nextPost && (<>
            <h5>Previous post</h5>
            <BlogEntry post={nextPost} />
          </>)}
        </div>
      </div>

      <div className="blog-post-related">
        <h5>Related posts</h5>
        <div className="blog-post-related-posts">
          <BlogEntry post={POSTS[2]} />
          <BlogEntry post={POSTS[3]} />
          <BlogEntry post={POSTS[4]} />
        </div>
      </div>
    </BlogPost>
  )
}