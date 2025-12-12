"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/rehype-mermaid.ts
var rehype_mermaid_exports = {};
__export(rehype_mermaid_exports, {
  rehypeMermaid: () => rehypeMermaid
});
module.exports = __toCommonJS(rehype_mermaid_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  rehypeMermaid
});
