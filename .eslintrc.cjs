/** @type { import('eslint').Linter.Config } */
module.exports = {
	parser: '@typescript-eslint/parser',
	extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
	parserOptions: {
		ecmaVersion: 2016,
		sourceType: 'module'
	},
	rules: {
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: 'typeAlias',
				format: ['PascalCase']
			},
			{
				selector: 'enumMember',
				format: ['PascalCase']
			}
		]
	}
};
