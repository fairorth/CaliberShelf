// Metro config for the TenTen iPhone app.
//
// The app imports the web app's PURE shared files (src/lib/dates.ts,
// validations/*, valuation.ts, …) directly rather than copying them — the
// rules that must never disagree between web and phone live once
// (docs/iphone-app.md §16; the ESLint rule in ../eslint.config.mjs keeps them
// free of Next.js/server imports). Two things make that work:
//   1. ../src/lib is a watch folder, so Metro may bundle files from it.
//   2. Imports are resolved for it: `@/lib/x` maps to ../src/lib/x, and a bare
//      package import FROM a shared file (e.g. `zod`) resolves from THIS app's
//      node_modules — never the web app's, which Metro doesn't watch and whose
//      versions are not the phone's.
const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")

const projectRoot = __dirname
const sharedRoot = path.resolve(projectRoot, "../src/lib")

const config = getDefaultConfig(projectRoot)

config.watchFolders = [...(config.watchFolders ?? []), sharedRoot]

const upstreamResolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = upstreamResolve ?? context.resolveRequest
  if (moduleName.startsWith("@/lib/")) {
    return resolve(context, path.join(sharedRoot, moduleName.slice("@/lib/".length)), platform)
  }
  const isBare = !moduleName.startsWith(".") && !path.isAbsolute(moduleName)
  if (isBare && context.originModulePath.startsWith(sharedRoot)) {
    return resolve(
      { ...context, originModulePath: path.join(projectRoot, "index.ts") },
      moduleName,
      platform
    )
  }
  return resolve(context, moduleName, platform)
}

module.exports = config
