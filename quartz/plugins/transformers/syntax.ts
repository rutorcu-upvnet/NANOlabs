import { QuartzTransformerPlugin } from "../types"
import rehypePrettyCode, { Options as CodeOptions, Theme as CodeTheme } from "rehype-pretty-code"

interface Theme extends Record<string, CodeTheme> {
  light: CodeTheme
  dark: CodeTheme
}

interface Options {
  theme?: Theme
  keepBackground?: boolean
  // map language aliases (fenced code label -> shiki language)
  aliases?: Record<string, string>
}

const defaultOptions: Options = {
  theme: {
    light: "github-light",
    dark: "github-dark",
  },
  keepBackground: false,
  // common assembly labels map to GNU assembler highlight
  aliases: {
    asm: "gas",
    riscv: "gas",
    armasm: "gas",
    gas: "gas",
  },
}

export const SyntaxHighlighting: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts: CodeOptions = { ...defaultOptions, ...userOpts }

  return {
    name: "SyntaxHighlighting",
    htmlPlugins() {
      return [[rehypePrettyCode, opts]]
    },
  }
}
