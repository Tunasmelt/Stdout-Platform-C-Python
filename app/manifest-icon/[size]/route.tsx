import { ImageResponse } from 'next/og'

// Parameterized rather than separate icon192.tsx/icon512.tsx files — the
// manifest needs specific sizes (192/512 are Chrome's PWA-install minimum)
// that Next's built-in icon/apple-icon conventions don't cover, so this is a
// plain route instead, one implementation shared across sizes.
//
// Forced Edge runtime — see app/icon.tsx for the full reasoning (a Windows-
// specific bug in @vercel/og's Node.js code path breaks the build outright
// regardless of this route's content). Text glyph, not a CSS border-triangle
// trick — Satori renders that as a filled rectangle, not a triangle
// (confirmed by inspecting the output PNG).
export const runtime = 'edge'

export async function GET(_request: Request, { params }: { params: { size: string } }) {
  const size = Math.min(Math.max(parseInt(params.size, 10) || 512, 16), 1024)
  const fontSize = Math.round(size * 0.6)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1117',
          fontFamily: 'monospace',
          fontWeight: 700,
          fontSize,
          color: '#f78166',
        }}
      >
        {'>'}
      </div>
    ),
    { width: size, height: size }
  )
}
