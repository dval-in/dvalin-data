// @ts-check

import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
	{
		ignores: [
			'.github/*',
			'.node_modules/*',
			'dist/*',
			'data/*',
			'.DS_Store',
			'.env*',
			'pnpm-lock.yaml'
		]
	},
	{
		plugins: {
			'@typescript-eslint': tseslint.plugin
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				project: true,
				sourceType: 'module',
				ecmaVersion: 2020
			}
		},
		rules: {
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/naming-convention': [
				'error',
				{ selector: 'typeAlias', format: ['PascalCase'] },
				{
					selector: 'enumMember',
					format: ['PascalCase']
				}
			]
		}
	},
	{
		// disable type-aware linting on JS files
		files: ['**/*.js'],
		...tseslint.configs.disableTypeChecked
	},
	eslintPluginPrettier
);
