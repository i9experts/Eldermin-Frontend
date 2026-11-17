import { createContext, useContext, useState, ReactNode } from 'react'

interface TourContextType {
  isGlobalTourOpen: boolean
  startGlobalTour: () => void
  closeGlobalTour: () => void
}

const TourContext = createContext<TourContextType | null>(null)

/** Scoped to the authenticated layout (see Layout.tsx) - both GlobalTour
 * (which renders the overlay) and TopBar's profile menu (which needs a
 * "Show Me Around" replay button) sit under it. */
export function TourProvider({ children }: { children: ReactNode }) {
  const [isGlobalTourOpen, setOpen] = useState(false)
  return (
    <TourContext.Provider
      value={{
        isGlobalTourOpen,
        startGlobalTour: () => setOpen(true),
        closeGlobalTour: () => setOpen(false),
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTourContext() {
  const ctx = useContext(TourContext)
  if (!ctx) throw new Error('useTourContext must be used inside TourProvider')
  return ctx
}
