"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/markdown.ts
var markdown_exports = {};
__export(markdown_exports, {
  processMarkdown: () => processMarkdown
});
module.exports = __toCommonJS(markdown_exports);
var import_unified = require("unified");
var import_remark_parse = __toESM(require("remark-parse"));
var import_remark_gfm = __toESM(require("remark-gfm"));
var import_remark_rehype = __toESM(require("remark-rehype"));
var import_rehype_slug = __toESM(require("rehype-slug"));
var import_rehype_autolink_headings = __toESM(require("rehype-autolink-headings"));
var import_rehype_highlight = __toESM(require("rehype-highlight"));
var import_rehype_stringify = __toESM(require("rehype-stringify"));

// src/rehype-mermaid.ts
function walkTree(node, callback, parent, index) {
  callback(node, parent, index);
  if ("children" in node && Array.isArray(node.children)) {
    node.children.forEach((child, childIndex) => {
      walkTree(child, callback, node, childIndex);
    });
  }
}
function rehypeMermaid() {
  return (tree) => {
    const nodesToReplace = [];
    walkTree(tree, (node, parent, index) => {
      if (node.type === "element" && node.tagName === "code" && node.properties && Array.isArray(node.properties.className) && node.properties.className.includes("language-mermaid")) {
        const element = node;
        const codeContent = element.children.filter((child) => child.type === "text").map((child) => child.value).join("");
        const mermaidElement = {
          type: "element",
          tagName: "div",
          properties: {
            "data-mermaid": codeContent,
            className: ["mermaid-container", "my-6", "p-4", "bg-white", "dark:bg-gray-900", "rounded-lg", "border", "border-gray-200", "dark:border-gray-700", "shadow-sm", "overflow-x-auto"]
          },
          children: [
            {
              type: "element",
              tagName: "pre",
              properties: {
                className: ["mermaid"],
                style: "display: flex; justify-content: center; align-items: center; min-height: 150px;"
              },
              children: [
                {
                  type: "text",
                  value: codeContent
                }
              ]
            }
          ]
        };
        if (parent && parent.tagName === "pre") {
          walkTree(tree, (grandParentNode, greatGrandParent, grandParentIndex) => {
            if (grandParentNode === parent && greatGrandParent && grandParentIndex !== void 0) {
              nodesToReplace.push({
                parent: greatGrandParent,
                index: grandParentIndex,
                newNode: mermaidElement
              });
            }
          });
        } else if (parent && index !== void 0) {
          nodesToReplace.push({
            parent,
            index,
            newNode: mermaidElement
          });
        }
      }
    });
    nodesToReplace.forEach(({ parent, index, newNode }) => {
      parent.children[index] = newNode;
    });
  };
}

// src/markdown.ts
async function processMarkdown(content) {
  const processor = (0, import_unified.unified)().use(import_remark_parse.default).use(import_remark_gfm.default).use(import_remark_rehype.default, { allowDangerousHtml: true }).use(import_rehype_slug.default).use(import_rehype_autolink_headings.default, {
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
  }).use(import_rehype_highlight.default, {
    detect: true,
    ignoreMissing: true
  }).use(rehypeMermaid).use(import_rehype_stringify.default, { allowDangerousHtml: true });
  const result = await processor.process(content);
  return String(result);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  processMarkdown
});
