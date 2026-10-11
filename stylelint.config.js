// Rejects hard-coded colours in stylesheets and in the style blocks of Vue
// files. Colours are design tokens, and the tokens file is the only place
// where one may be written out.

const colourFunctions = [
    'rgb',
    'rgba',
    'hsl',
    'hsla',
    'hwb',
    'lab',
    'lch',
    'oklab',
    'oklch',
    'color',
];

export default {
    rules: {
        'color-no-hex': true,
        'color-named': 'never',
        'function-disallowed-list': colourFunctions,
    },
    overrides: [
        {
            files: ['**/*.vue'],
            customSyntax: 'postcss-html',
        },
        {
            files: ['resources/css/tokens.css'],
            rules: {
                'color-no-hex': null,
                'color-named': null,
                'function-disallowed-list': null,
            },
        },
    ],
};
