"use strict";
function extractChunks(programNode, isPartOfChunk) {
  const chunks = [];
  let chunk = [];
  let lastNode = undefined;
  for (const node of programNode.body) {
    const result = isPartOfChunk(node, lastNode);
    switch (result) {
      case "PartOfChunk":
        chunk.push(node);
        break;

      case "PartOfNewChunk":
        if (chunk.length > 0) {
          chunks.push(chunk);
        }
        chunk = [node];
        break;

      case "NotPartOfChunk":
        if (chunk.length > 0) {
          chunks.push(chunk);
          chunk = [];
        }
        break;
      default:
        throw new Error(`Unknown chunk result: ${result}`);
    }
    lastNode = node;
  }
  if (chunk.length > 0) {
    chunks.push(chunk);
  }

  return chunks;
}

function maybeReportSorting(context, sorted, start, end) {
  const sourceCode = context.getSourceCode();
  const original = sourceCode.getText().slice(start, end);
  if (original !== sorted) {
    context.report({
      messageId: "error",
      loc: {
        start: sourceCode.getLocFromIndex(start),
        end: sourceCode.getLocFromIndex(end),
      },
      fix: (fixer) => {
        return fixer.replaceTextRange([start, end], sorted);
      },
    });
  }
}

function printSortedItems(sortedItems, originalItems, sourceCode) {
  const newline = guessNewline(sourceCode);
  const sorted = sortedItems.map(item => {
    const codeline = item.items.map(codes => codes.code.concat(newline))
   return codeline
  }).join(newline)
  return sorted
}

function getImportExportItems(chunk, sourceCode) {
  return chunk.map((node, nodeIndex) => {
    const code = printWithSortedSpecifiers(node, sourceCode);
    const [start, end] = node.range;
    const source = getSource(node);
    return {
      node,
      code,
      start: start,
      end: end,
      source,
      index: nodeIndex,
      needsNewline: false,
    };
  });
}

function printWithSortedSpecifiers(node, sourceCode) {
  const tokens = sourceCode.getTokens(node);
  const lastTokenIndex = tokens.length - 1;
  const allTokens = flatMap(tokens, (token, tokenIndex) => {
    const newToken = { ...token, code: sourceCode.getText(token) };
    if (tokenIndex === lastTokenIndex) {
      return [newToken];
    }
    const last = token;
    const nextToken = tokens[tokenIndex + 1];
    const result = [
      newToken,
      ...parseWhitespace(
        sourceCode.text.slice(last.range[1], nextToken.range[0])
      ),
    ];
    return result;
  });
  return allTokens.map((token) => token.code).join("");
}

const NEWLINE = /(\r?\n)/;

function guessNewline(sourceCode) {
  const match = NEWLINE.exec(sourceCode.text);
  return match == null ? "\n" : match[0];
}

function parseWhitespace(whitespace) {
  const allItems = whitespace.split(NEWLINE);
  const items =
    allItems.length >= 5
      ? allItems.slice(0, 2).concat(allItems.slice(-1))
      : allItems;
  return (
    items
      .map((spacesOrNewline, index) =>
        index % 2 === 0
          ? { type: "Spaces", code: spacesOrNewline }
          : { type: "Newline", code: spacesOrNewline }
      )
      // Remove empty spaces since it makes debugging easier.
      .filter((token) => token.code !== "")
  );
}

function sortImportExportItems(items) {
  return items.slice().sort((itemA, itemB) => {
    return collator.compare(itemA.source, itemB.source.source) || (itemA.source.source < itemB.source.source ? -1 : itemA.source.source > itemB.source.source ? 1 : 0);
  });
}

const collator = new Intl.Collator("en", {
  sensitivity: "base",
  numeric: true,
});

function isPunctuator(node, value) {
  return node.type === "Punctuator" && node.value === value;
}

function getSource(node) {
  const source = node.source.value;

  return {
    // Sort by directory level rather than by string length.
    source: source
      // Treat `.` as `./`, `..` as `../`, `../..` as `../../` etc.
      .replace(/^[./]*\.$/, "$&/")
      // Make `../` sort after `../../` but before `../a` etc.
      // Why a comma? See the next comment.
      .replace(/^[./]*\/$/, "$&,")
      // Make `.` and `/` sort before any other punctation.
      // The default order is: _ - , x x x . x x x / x x x
      // We’re changing it to: . / , x x x _ x x x - x x x
      .replace(/[./_-]/g, (char) => {
        switch (char) {
          case ".":
            return "_";
          case "/":
            return "-";
          case "_":
            return ".";
          case "-":
            return "/";
          // istanbul ignore next
          default:
            throw new Error(`Unknown source substitution character: ${char}`);
        }
      }),
    originalSource: source,
    kind: getImportExportKind(node),
  };
}

function getImportExportKind(node) {
  // `type` and `typeof` imports, as well as `type` exports (there are no
  // `typeof` exports). In Flow, import specifiers can also have a kind. Default
  // to "value" (like TypeScript) to make regular imports/exports come after the
  // type imports/exports.
  return node.importKind || node.exportKind || "value";
}

// Like `Array.prototype.flatMap`, had it been available.
function flatMap(array, fn) {
  return [].concat(...array.map(fn));
}

module.exports = {
  extractChunks,
  flatMap,
  getImportExportItems,
  isPunctuator,
  maybeReportSorting,
  printSortedItems,
  printWithSortedSpecifiers,
  sortImportExportItems,
  guessNewline,
};
