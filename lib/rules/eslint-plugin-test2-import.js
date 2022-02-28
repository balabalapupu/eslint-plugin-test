const util = require("../../utils");
const defaultGroups = ["^@\\w", "^[^@|\\.]", "^\\."];

module.exports = {
  meta: {
    type: "layout", // `problem`, `suggestion`, or `layout`
    docs: {
      description: "那这个又是啥",
      category: "让我看看这又是啥",
      recommended: false,
      url: null, // URL to the documentation page for this rule
    },
    messages: {
      error: "Run autofix to sort these imports!",
    },
    fixable: "code", // Or `code` or `whitespace`
    schema: [
      {
        type: "object",
        properties: {
          groups: {
            type: "array",
            items: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        },
        additionalProperties: false,
      },
    ],
  },

  create(context) {
    const outerGroups = defaultGroups.map((item) => RegExp(item, "u"));
    return {
      Program: (programNode) => {
        function findNode(node) {
          return node.type === "ImportDeclaration"
            ? "PartOfChunk"
            : "NotPartOfChunk";
        }
        for (const chunk of util.extractChunks(programNode, findNode)) {
          maybeReportChunkSorting(chunk, context, outerGroups);
        }
      },
    };
  },
};

function maybeReportChunkSorting(chunk, context, outerGroups) {
  const sourceCode = context.getSourceCode();
  const items = util.getImportExportItems(chunk, sourceCode);
  const sortedItems = makeSortedItems(items, outerGroups);
  const sorted = util.printSortedItems(sortedItems, items, sourceCode);
  const { start } = items[0];
  const { end } = items[items.length - 1];
  util.maybeReportSorting(context, sorted, start, end);
}

function makeSortedItems(items, outerGroups) {
  const itemGroups = outerGroups.map((regex) => {
    return { regex, items: [] };
  });
  for (const item of items) {
    const { originalSource } = item.source;
    const source =
      item.source.kind !== "value" ? `${originalSource}\0` : originalSource;
    for (let index = 0; index < itemGroups.length; index++) {
      if (itemGroups[index].regex.exec(source)) {
        itemGroups[index].items.push(item);
        break;
      }
    }
  }
  return itemGroups.filter((t) => t.items.length > 0);
}
