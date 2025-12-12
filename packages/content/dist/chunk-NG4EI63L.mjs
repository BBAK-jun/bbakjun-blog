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

export {
  rehypeMermaid
};
