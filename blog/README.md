# Blog Authoring Guide

This blog is data-driven.

To add a new post, edit only blog/posts.js.

## Post format
Add one object to window.BLOG_POSTS with these fields:

- id: unique slug, used in links (example: "my-new-post")
- title: post title
- date: YYYY-MM-DD
- readTime: short label (example: "5 min read")
- tags: array of lowercase tags
- excerpt: short card summary
- coverImage: image path relative to site root
- coverAlt: image alt text
- content: ordered blocks for the reader modal

## Content block types
Use these block objects inside content:

1. Paragraph
{ type: 'paragraph', text: 'Your paragraph text.' }

2. Heading
{ type: 'heading', text: 'Section title' }

3. List
{ type: 'list', items: ['First point', 'Second point'] }

## Deep links
Each post opens with a URL hash:

- blog.html#post-your-id

## Example starter
Copy an existing post object and modify values.
