import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface TourStep {
  /** Value of the target element's `data-tour` attribute. */
  target: string
  title: string
  content: string
}

interface TourOverlayProps {
  steps: TourStep[]
  /** completed=true when the user clicked Finish on the last step, false when they clicked Skip. */
  onFinish: (completed: boolean) => void
}

const SPOTLIGHT_PADDING = 8
const TOOLTIP_WIDTH = 320

/**
 * Coach-mark tour: dims the page, cuts a spotlight hole around whichever
 * real element the current step targets (via `data-tour="<target>"`), and
 * shows a small Next/Back/Skip tooltip next to it. No tour library - the
 * spotlight is a fixed div sized to the target's live bounding rect with a
 * giant box-shadow, which is cheap to keep in sync on scroll/resize and
 * needs no SVG mask/cutout math.
 */
export default function TourOverlay({ steps, onFinish }: TourOverlayProps) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const step = steps[index]

  const measure = useCallback(() => {
    if (!step) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      requestAnimationFrame(() => setRect(el.getBoundingClientRect()))
    } else {
      setRect(null)
    }
  }, [step])

  useLayoutEffect(() => { measure() }, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [measure])

  // A step whose target isn't on the page right now (role doesn't have
  // that nav item, a collapsed section, a page that hasn't rendered it
  // yet) gets skipped automatically instead of pointing a tooltip at
  // nothing.
  useEffect(() => {
    if (!step) return
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (el) return
    if (index < steps.length - 1) setIndex((i) => i + 1)
    else onFinish(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, index])

  if (!step) return null

  const isLast = index === steps.length - 1

  const tooltipStyle: React.CSSProperties = rect
    ? {
        top: window.innerHeight - rect.bottom > 190 ? rect.bottom + 12 : Math.max(12, rect.top - 184),
        left: Math.min(Math.max(12, rect.left), window.innerWidth - TOOLTIP_WIDTH - 12),
      }
    : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  return createPortal(
    <div className="fixed inset-0 z-[200]">
      {rect ? (
        <div
          className="fixed rounded-lg pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
            outline: '2px solid #D4AF37',
            outlineOffset: 2,
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-navy-950/65" />
      )}

      <div
        className="fixed bg-white rounded-xl shadow-2xl p-5"
        style={{ width: TOOLTIP_WIDTH, ...tooltipStyle }}
      >
        <p className="text-[10px] font-semibold text-gold-600 uppercase tracking-wider mb-1">
          Step {index + 1} of {steps.length}
        </p>
        <h3 className="text-sm font-bold text-gray-900 mb-1.5">{step.title}</h3>
        <p className="text-xs text-gray-600 leading-relaxed mb-4">{step.content}</p>
        <div className="flex items-center justify-between">
          <button onClick={() => onFinish(false)} className="text-xs text-gray-400 hover:text-gray-600 font-medium">
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="text-xs text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onFinish(true) : setIndex((i) => i + 1))}
              className="text-xs bg-navy-900 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-navy-800"
            >
              {isLast ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-3">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 rounded-full flex-1 ${i <= index ? 'bg-gold-500' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
