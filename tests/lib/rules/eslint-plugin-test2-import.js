/**
 * @fileoverview test2
 * @author wangtianyou
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/eslint-plugin-test2-import"),
  RuleTester = require("eslint").RuleTester;
const { input } = require("../../../helpers");

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: "module" },
});
ruleTester.run("eslint-plugin-test2-import", rule, {
  valid: [
    // give me some code that won't trigger a warning
  ],

  invalid: [
    // {
    //   only: true,
    //   code: "import {SelectionSetNode} from '../language/ast';import u from '@/c';const a = 111;import { foo, bar, baz } from 'example';",
    //   errors: [{ message: "Run autofix to sort these imports!" }],
    //   output:
    //     "import u from '@/c';\n\nimport {SelectionSetNode} from '../language/ast';const a = 111;import { bar, baz,foo } from 'example';",
    // },
    {
      code: input`
          |import x2 from "b"
          |import x1 from "a";
      `,
      errors: [{ message: "Run autofix to sort these imports!" }],
      output: input`
          |import x1 from "a";
          |import x2 from "b"
      `,
    },
    {
      code: input`
          |import x2 from "b"
          |import x7 from "g";
          |import x6 from "f"
          |;import x5 from "e"
          |import x4 from "d" ;
          |import x1 from "a" ;
      `,
      errors: [{ message: "Run autofix to sort these imports!" }],
      output: input`
          |import x1 from "a" ;
          |import x2 from "b"
          |import x4 from "d" ;
          |import x5 from "e"
          |import x6 from "f"
          |;
          |import x7 from "g";
      `
    },
    { only: true,
      code: `import x from "../ccc";import { e, b, a as c } from "aa";import d from "@a";`,
      output: `import d from "@a";\n\nimport { e, b, a as c } from "aa";\n\nimport x from "../ccc";\n`,
      errors: [{ message: "Run autofix to sort these imports!" }],
    },
  ],
});
