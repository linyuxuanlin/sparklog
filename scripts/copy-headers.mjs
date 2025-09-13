import { copyFile, constants } from 'node:fs'
import { resolve } from 'node:path'

const srcRoot = process.cwd()
const outDir = resolve(srcRoot, 'out')
for (const fname of ['_redirects', '_headers']) {
  const src = resolve(srcRoot, fname)
  const dst = resolve(outDir, fname)
  copyFile(src, dst, constants.COPYFILE_FICLONE, (err)=> { if (err) console.warn(`[copy-headers] skip ${fname}:`, err.message) })
}

