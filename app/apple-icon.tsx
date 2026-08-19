import { ImageResponse } from 'next/og'

// Forced Edge runtime — see icon.tsx for the full reasoning (a Windows-
// specific bug in @vercel/og's Node.js code path breaks the build outright
// regardless of this file's content). Text glyph, not a CSS border-triangle
// trick — Satori renders that as a filled rectangle, not a triangle
// (confirmed by inspecting the output PNG).
export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'
export default function AppleIcon() {
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
          fontSize: 110,
          color: '#f78166',
        }}
      >
        {'>'}
      </div>
    ),
    { ...size }
  )
}
