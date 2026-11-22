// 生成済みの配色を JSON で書き出す (agent / 他のツール向け)。形は export.ts の buildColorsJson
//   node src/gen-colors.ts [--pages]   → dist/colors.json (--pages は dist/pages/colors.json にも)
import { writeFileSync, mkdirSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { buildColorsJson } from './export.ts'

const { values } = parseArgs({ options: { pages: { type: 'boolean', default: false } } })
const json = `${JSON.stringify(buildColorsJson(new Date().toISOString()), null, 1)}\n`
const outs = ['../dist/colors.json', ...(values.pages ? ['../dist/pages/colors.json'] : [])]
outs.forEach((out) => {
  const url = new URL(out, import.meta.url)
  mkdirSync(new URL('./', url), { recursive: true })
  writeFileSync(url, json)
  console.log(`wrote ${out.replace('../', '')} (${Math.round(json.length / 1024)}KB)`)
})
