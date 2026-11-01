import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useTourContext } from '@/contexts/TourContext'
import { useTourState, useMarkTourSeen } from '@/hooks/useTour'
import { buildGlobalTourSteps } from './globalTourSteps'
import TourOverlay from './TourOverlay'
import { UserRole } from '@/types/roles'

/** Auto-starts the global "Show Me Around" tour the first time a (non
 * Super Admin) user logs in, and renders it whenever TopBar's "Show Me
 * Around" menu item asks for a replay via TourContext. Mounted once in
 * Layout.tsx, so it's present on every authenticated page. */
export default function GlobalTour() {
  const { user, canAccess, hasModule, isAuthenticated } = useAuth()
  const { data: tourState } = useTourState()
  const markSeen = useMarkTourSeen()
  const { isGlobalTourOpen, startGlobalTour, closeGlobalTour } = useTourContext()

  // Super Admin gets its own, separate nav (see Sidebar.tsx's superAdminNav)
  // with no permission filtering at all - this school-admin-oriented tour
  // doesn't apply to it yet.
  const isSuperAdmin = user?.role === UserRole.SuperAdmin

  useEffect(() => {
    if (isAuthenticated && !isSuperAdmin && tourState && !tourState.globalTourCompleted) {
      startGlobalTour()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isSuperAdmin, tourState?.globalTourCompleted])

  if (!isGlobalTourOpen) return null

  const steps = buildGlobalTourSteps(canAccess, hasModule)

  return (
    <TourOverlay
      steps={steps}
      onFinish={() => {
        closeGlobalTour()
        if (!tourState?.globalTourCompleted) markSeen.mutate('global')
      }}
    />
  )
}
