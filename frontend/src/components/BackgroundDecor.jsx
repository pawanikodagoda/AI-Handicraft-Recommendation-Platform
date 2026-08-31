/**
 * Ambient 3D blobs drifting behind the page. Purely decorative, so they
 * sit behind everything, ignore pointer events, and are hidden on small
 * screens where they'd crowd the content.
 */
// Positioned into the page gutters so they frame the content column
// rather than sitting behind it.
const SHAPES = [
  {
    className: 'top-[14%] left-[1%] h-28 w-28 rotate-[15deg]',
    style: {
      background: 'linear-gradient(145deg, #2a6b52, #1e4d3b)',
      borderRadius: '30% 70% 50% 50%',
    },
  },
  {
    className: 'bottom-[10%] right-[1.5%] h-36 w-36 -rotate-[10deg]',
    style: {
      background: 'linear-gradient(145deg, #d4a73c, #b88e2a)',
      borderRadius: '60% 40% 30% 70%',
      animationDuration: '16s',
    },
  },
  {
    className: 'bottom-[32%] left-[2%] h-20 w-20',
    style: {
      background: '#f0d47a',
      borderRadius: '50%',
      animationDuration: '18s',
      boxShadow: '0 0 40px rgba(212,167,60,0.3)',
    },
  },
  {
    className: 'top-[26%] right-[2%] h-16 w-16',
    style: {
      background: '#2a6b52',
      borderRadius: '50% 50% 20% 80%',
      animationDuration: '20s',
    },
  },
]

export default function BackgroundDecor() {
  // Only on screens wide enough to have real margin beside the content.
  return (
    <div aria-hidden="true" className="pointer-events-none hidden xl:block">
      {SHAPES.map((shape, i) => (
        <div key={i} className={`floating-3d ${shape.className}`} style={shape.style} />
      ))}
    </div>
  )
}
