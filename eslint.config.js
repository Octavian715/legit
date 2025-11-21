import vuePlugin from 'eslint-plugin-vue'
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'
import prettierPlugin from 'eslint-plugin-prettier'

export default [
    {
        files: ['**/*.js', '**/*.ts', '**/*.vue'], // Lint these file types
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser, // TypeScript parser for .vue files
                sourceType: 'module',
                ecmaVersion: 'latest',
            },
            globals: {
                browser: true,
                node: true,
            },
        },
        plugins: {
            vue: vuePlugin,
            '@typescript-eslint': typescriptEslintPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...vuePlugin.configs['vue3-recommended'].rules, // Vue 3 recommended rules
            ...typescriptEslintPlugin.configs.recommended.rules, // TS recommended rules
            'prettier/prettier': 'error', // Enforce Prettier
            'no-unused-vars': 'off', // Disable base rule
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // TS-specific
            'vue/multi-word-component-names': 'off', // Allow single-word components
            // Add rule to enforce kebab-case for attribute names in Vue templates
            'vue/attribute-hyphenation': ['error', 'always'],
            // Disallow console.log in production code
            'no-console': ['error', { allow: ['warn', 'error'] }],
        },
    },
    {
        ignores: ['node_modules', 'dist', '.nuxt', '.output'], // Exclude these directories
    },
]
