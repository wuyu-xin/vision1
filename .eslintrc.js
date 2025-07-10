module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        es6: true
    },
    parserOptions: {
        parser: '@typescript-eslint/parser', // 如果使用 TypeScript
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    extends: [
        'plugin:vue/vue3-essential', // Vue 3 基本规则
        'eslint:recommended', // ESLint 推荐规则
        'standard', // JavaScript Standard Style
        'plugin:prettier/recommended', // Prettier 集成
        'plugin:@typescript-eslint/recommended' // TypeScript 推荐规则
    ],
    plugins: ['vue', '@typescript-eslint', 'prettier'],
    rules: {
        // 基础 JavaScript 规则
        'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-var': 'error', // 禁用 var
        'prefer-const': 'error', // 优先使用 const
        'eqeqeq': 'error', // 强制使用 ===
        'no-unused-vars': ['warn', { vars: 'all', args: 'after-used', ignoreRestSiblings: true }],
        'no-multiple-empty-lines': ['warn', { max: 2, maxBOF: 1, maxEOF: 0 }], // 限制空行数量

        // Vue 特定规则
        'vue/max-attributes-per-line': ['warn', { singleline: 3, multiline: { max: 1, allowFirstLine: false } }],
        'vue/singleline-html-element-content-newline': 'off',
        'vue/multiline-html-element-content-newline': 'off',
        'vue/attribute-hyphenation': ['warn', 'always'], // 属性名使用短横线
        'vue/no-v-html': 'off', // 不禁用 v-html
        'vue/require-default-prop': 'off', // 不强制要求默认值

        // 函数和箭头函数规则
        'func-call-spacing': ['error', 'never'], // 函数调用括号前无空格
        'space-before-function-paren': ['warn', {
            anonymous: 'never',
            named: 'never',
            asyncArrow: 'always'
        }],

        // 注释规则
        'spaced-comment': ['warn', 'always', {
            exceptions: ['-', '+'],
            markers: ['/']
        }],

        // 缩进和空格（与 Prettier 协同工作）
        'indent': 'off',
        'vue/script-indent': ['warn', 2, { baseIndent: 1 }],
        'prettier/prettier': ['error', {
            semi: false, // 不使用分号
            singleQuote: true, // 使用单引号
            trailingComma: 'es5', // 尾随逗号
            printWidth: 100, // 行宽
            vueIndentScriptAndStyle: true
        }],

        // TypeScript 规则（如果使用）
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off'
    },
    overrides: [{
        files: ['*.vue'],
        rules: {
            indent: 'off' // 让 vue/script-indent 处理 Vue 文件缩进
        }
    },
    {
        files: ['*.ts', '*.tsx'],
        rules: {
            'no-undef': 'off', // TypeScript 会处理未定义变量
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['warn']
        }
    }
    ]
}