// Unobtrusive deploy-version indicator - the frontend counterpart to the
// backend's GET /health. Lets anyone confirm which commit is actually live
// (Vercel builds fresh from the checked-out repo every time) instead of
// guessing whether a merged fix has actually deployed.
export default function BuildInfo() {
  const commit = typeof __BUILD_COMMIT__ !== 'undefined' ? __BUILD_COMMIT__ : 'dev'
  const builtAt = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : null

  const title = builtAt ? `Built ${new Date(builtAt).toLocaleString()}` : undefined

  return (
    <p
      className="px-3 pt-2 text-[10px] text-navy-500 truncate select-none"
      title={title}
    >
      v{commit}
    </p>
  )
}
