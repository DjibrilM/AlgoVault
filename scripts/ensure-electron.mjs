import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'

function getPlatformPath(platform) {
  switch (platform) {
    case 'mas':
    case 'darwin':
      return 'Electron.app/Contents/MacOS/Electron'
    case 'freebsd':
    case 'openbsd':
    case 'linux':
      return 'electron'
    case 'win32':
      return 'electron.exe'
    default:
      throw new Error(`Electron builds are not available on platform: ${platform}`)
  }
}

function isElectronReady(electronDir, platform, platformPath) {
  try {
    const recordedPath = fs.readFileSync(path.join(electronDir, 'path.txt'), 'utf-8').trim()
    if (recordedPath !== platformPath) return false
  } catch {
    return false
  }

  const distDir = path.join(electronDir, 'dist')
  const hasVersion = fs.existsSync(path.join(distDir, 'version'))
  const hasBinary = fs.existsSync(path.join(distDir, platformPath))
  if (!hasVersion || !hasBinary) return false

  if (platform === 'darwin' || platform === 'mas') {
    const hasPlist = fs.existsSync(path.join(distDir, 'Electron.app/Contents/Info.plist'))
    if (!hasPlist) return false
  }

  return true
}

function resolveTargetArch(platform) {
  let arch = process.env.npm_config_arch || process.arch
  if (
    platform === 'darwin' &&
    process.platform === 'darwin' &&
    arch === 'x64' &&
    process.env.npm_config_arch === undefined
  ) {
    try {
      const translated = execFileSync('sysctl', ['-in', 'sysctl.proc_translated'], {
        encoding: 'utf-8',
      }).trim()
      if (translated === '1') {
        arch = 'arm64'
      }
    } catch {
      // Ignore if sysctl check is unavailable
    }
  }
  return arch
}

async function main() {
  if (process.env.ELECTRON_SKIP_BINARY_DOWNLOAD) {
    return
  }

  const electronEntry = path.resolve('node_modules/electron')
  if (!fs.existsSync(electronEntry)) {
    return
  }

  const electronDir = fs.realpathSync(electronEntry)
  const platform = process.env.npm_config_platform || os.platform()
  const platformPath = getPlatformPath(platform)

  if (isElectronReady(electronDir, platform, platformPath)) {
    return
  }

  const req = createRequire(path.join(electronDir, 'install.js'))
  const { version } = req('./package.json')
  const checksums =
    process.env.electron_use_remote_checksums ?? process.env.npm_config_electron_use_remote_checksums
      ? undefined
      : req('./checksums.json')
  const { downloadArtifact } = req('@electron/get')

  const arch = resolveTargetArch(platform)
  const zipPath = await downloadArtifact({
    version,
    artifactName: 'electron',
    force: process.env.force_no_cache === 'true',
    cacheRoot: process.env.electron_config_cache,
    checksums,
    platform,
    arch,
  })

  const distDir = path.join(electronDir, 'dist')
  fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })

  if (process.platform === 'win32') {
    const extract = req('extract-zip')
    await extract(zipPath, { dir: distDir })
  } else {
    execFileSync('unzip', ['-q', '-o', zipPath, '-d', distDir])
  }

  const srcTypeDefPath = path.join(distDir, 'electron.d.ts')
  const targetTypeDefPath = path.join(electronDir, 'electron.d.ts')
  if (fs.existsSync(srcTypeDefPath)) {
    fs.renameSync(srcTypeDefPath, targetTypeDefPath)
  }

  fs.writeFileSync(path.join(electronDir, 'path.txt'), platformPath)
  console.log(`[ensure-electron] Restored Electron ${version} binary at ${path.join(distDir, platformPath)}`)
}

main().catch((err) => {
  console.error('[ensure-electron] Failed to verify/restore Electron binary:', err)
  process.exit(1)
})
