module.exports = {
  '**/*.{ts,js}': (filenames) => [
    `prettier --write ${filenames.join(' ')}`,
    `eslint . --fix ${filenames.join(' ')}`,
    `tsc --project tsconfig.json --pretty --noEmit`,
  ],
  '**/*.(md|json)': (filenames) => `prettier --write ${filenames.join(' ')}`,
}
