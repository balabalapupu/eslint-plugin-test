/**
 * @fileoverview test1
 * @author wangtianyou
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/**
 * @type {import('eslint').Rule.RuleModule}
 */
module.exports = {
  meta: {
    type: 'suggestion', // `problem`, `suggestion`, or `layout`
    docs: {
      description: "test1",
      category: "Fill me in",
      recommended: false,
      url: null, // URL to the documentation page for this rule
    },
    fixable: 'code', // Or `code` or `whitespace`
    schema: [], // Add a schema if the rule has options
  },

  create(context) {
    // var sourceCode = context.getSourceCode();
    return {
      CallExpression: node => {
        if (node.callee.name !== 'setTimeout') return;
        const indexNode = node.arguments && node.arguments[1];
        if (!indexNode) return
        if (indexNode.type == 'Literal' && typeof indexNode.value == 'number') {
          context.report({
            node,
            loc: indexNode.loc,
            message: '卧槽这都写错了'
          })
        }
      }
    };
  },
};
