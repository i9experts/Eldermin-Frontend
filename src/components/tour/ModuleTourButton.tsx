import { useEffect, useState } from 'react'
import { Compass } from 'lucide-react'
import { useTourState, useMarkTourSeen } from '@/hooks/useTour'
import TourOverlay, { TourStep } from './TourOverlay'

interface ModuleTourButtonProps {
  /** Unique key for this module's tour, persisted in User.moduleToursSeen (e.g. 'finance'). */
  moduleKey: string
  steps: TourStep[]
  label?: string
  /** Auto-opens the tour the first time this user visits the module. Default true. */
  autoStart?: boolean
}

/** Drop into any module's <ModuleHeader actions={...}> slot to get a
 * replayable "Show Me Around" mini-tour for that module, using the same
 * coach-mark engine as the global tour. Pair with `data-tour="nav-tab-<id>"`
 * (already on every TabBar tab - see TabBar.tsx) to target that module's
 * own tabs, or add `data-tour` to any other element worth calling out. */
export default function ModuleTourButton({ moduleKey, steps, label = 'Show Me Around', autoStart = true }: ModuleTourButtonProps) {
  const { data: tourState } = useTourState()
  const markSeen = useMarkTourSeen()
  const [open, setOpen] = useState(false)
  const alreadySeen = !!tourState?.moduleToursSeen.includes(moduleKey)

  useEffect(() => {
    if (autoStart && tourState && !alreadySeen) setOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, alreadySeen, !!tourState])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-colors"
      >
        <Compass size={13} /> {label}
      </button>
      {open && (
        <TourOverlay
          steps={steps}
          onFinish={() => {
            setOpen(false)
            if (!alreadySeen) markSeen.mutate(moduleKey)
          }}
        />
      )}
    </>
  )
}
