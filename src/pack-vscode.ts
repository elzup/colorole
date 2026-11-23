// dist/vscode/ → dist/colorole-<ver>.vsix。--install で code --install-extension まで行う。
// VSCode は ~/.vscode/extensions/extensions.json に載った拡張しか読まないので、symlink では入らない。
// vsce を依存に入れないため、.vsix (zip + manifest 2 枚) を自前で組む
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { EXT } from './gen-vscode.ts'

const STAGE = 'dist/vsix-stage'
const VSIX = resolve(`dist/${EXT.name}-${EXT.version}.vsix`)

const manifest = `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011" xmlns:d="http://schemas.microsoft.com/developer/vsx-schema-design/2011">
  <Metadata>
    <Identity Language="en-US" Id="${EXT.name}" Version="${EXT.version}" Publisher="${EXT.publisher}" />
    <DisplayName>Colorole</DisplayName>
    <Description xml:space="preserve">Blueprint / gray-ladder themes with weekday and season accent variants.</Description>
    <Categories>Themes</Categories>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="^1.80.0" />
    </Properties>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code" />
  </Installation>
  <Dependencies />
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true" />
  </Assets>
</PackageManifest>
`

const contentTypes = `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension=".json" ContentType="application/json" /><Default Extension=".vsixmanifest" ContentType="text/xml" /></Types>
`

const pack = () => {
  rmSync(STAGE, { recursive: true, force: true })
  rmSync(VSIX, { force: true })
  mkdirSync(STAGE, { recursive: true })
  cpSync('dist/vscode', `${STAGE}/extension`, { recursive: true })
  writeFileSync(`${STAGE}/extension.vsixmanifest`, manifest)
  writeFileSync(`${STAGE}/[Content_Types].xml`, contentTypes)
  execFileSync('zip', ['-qr', VSIX, '.'], { cwd: STAGE })
  console.log(`wrote ${VSIX}`)
}

const main = () => {
  const { values } = parseArgs({ options: { install: { type: 'boolean', default: false } } })
  pack()
  if (!values.install) return
  execFileSync('code', ['--install-extension', VSIX, '--force'], { stdio: 'inherit' })
}

main()
