import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'https://countries.trevorblades.com/',
  documents: ['src/graphql/**/*.graphql'],
  generates: {
    'src/graphql/__generated__/': {
      preset: 'client',
      plugins: [],
    },
    // Alternatively, generate explicit React Apollo hooks:
    // 'src/graphql/types.ts': {
    //   plugins: ['typescript', 'typescript-operations', 'typescript-react-apollo'],
    // },
  },
}
export default config