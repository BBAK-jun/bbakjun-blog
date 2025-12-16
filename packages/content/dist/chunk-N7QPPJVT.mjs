import {
  rehypeMermaid
} from "./chunk-NG4EI63L.mjs";

// src/markdown.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

// src/rehype-optimize-images.ts
import { visit } from "unist-util-visit";
function rehypeOptimizeImages() {
  return (tree) => {
    visit(tree, "element", (node) => {
      if (node.tagName === "img") {
        const src = node.properties?.src;
        const alt = node.properties?.alt || "";
        if (!src) return;
        node.properties = {
          ...node.properties,
          loading: "lazy",
          decoding: "async",
          alt,
          // Add CSS classes for styling
          className: "blog-image rounded-lg my-6 w-full h-auto",
          // Add dimensions if not already present (prevents layout shift)
          style: "max-width: 100%; height: auto;"
        };
        if (alt) {
          const figure = {
            type: "element",
            tagName: "figure",
            properties: {
              className: "blog-image-figure my-8"
            },
            children: [
              node,
              {
                type: "element",
                tagName: "figcaption",
                properties: {
                  className: "text-center text-sm text-gray-600 dark:text-gray-400 mt-2 italic"
                },
                children: [
                  {
                    type: "text",
                    value: alt
                  }
                ]
              }
            ]
          };
          Object.assign(node, figure);
        }
      }
    });
  };
}

// src/markdown.ts
async function processMarkdown(content) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype, { allowDangerousHtml: true }).use(rehypeSlug).use(rehypeAutolinkHeadings, {
    behavior: "append",
    properties: {
      className: ["anchor-link"],
      title: "Direct link to heading"
    },
    content: () => [
      {
        type: "element",
        tagName: "svg",
        properties: {
          className: ["anchor-icon"],
          width: 16,
          height: 16,
          viewBox: "0 0 16 16",
          fill: "currentColor"
        },
        children: [
          {
            type: "element",
            tagName: "path",
            properties: {
              d: "M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z"
            },
            children: []
          }
        ]
      }
    ]
  }).use(rehypeHighlight, {
    detect: true,
    ignoreMissing: true
  }).use(rehypeMermaid).use(rehypeOptimizeImages).use(rehypeStringify, { allowDangerousHtml: true });
  const result = await processor.process(content);
  return String(result);
}

export {
  processMarkdown
};
