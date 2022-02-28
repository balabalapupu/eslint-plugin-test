/**
 * @fileoverview test1
 * @author wangtianyou
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/eslint-plugin-test1"),
  RuleTester = require("eslint").RuleTester;

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  parserOptions: {
      ecmaVersion: 7, // 默认支持语法为es5 
  },
});
ruleTester.run("eslint-plugin-test1", rule, {
  valid: [
    // give me some code that won't trigger a warning
    {
      code: "let someNumber = 1000; setTimeout(()=>{ console.log(11) },someNumber);",
    },
    {
      code: "setTimeout(()=>{ console.log(11) },someNumber)",
    },
    {
      code: "setTimeout(someName,someNumber)",
    },
  ],

  invalid: [
    {
      code: "setTimeout(()=>{ console.log(11) },700)",
      errors: [
        {
          message: "卧槽这都写错了", // 与rule抛出的错误保持一致
          type: "CallExpression", // rule监听的对应钩子
        },
      ],
    },
    // setTimeout第二个参数为数字即报错
    {
      code: "setTimeout(test,1000)",
      errors: [
        {
          message: "卧槽这都写错了", // 与rule抛出的错误保持一致
          type: "CallExpression", // rule监听的对应钩子
        },
      ],
    },
  ],
});
