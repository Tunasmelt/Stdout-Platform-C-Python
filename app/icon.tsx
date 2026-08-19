import { ImageResponse } from 'next/og'

// Forced Edge runtime: @vercel/og's default Node.js code path
// (index.node.js) has a Windows-specific bug in its internal file-path
// resolution that breaks `next build` outright, independent of this file's
// content (verified — even a text-free shape still hit it). The Edge
// runtime uses a different bundled path (index.edge.js) that doesn't do
// Node filesystem/URL resolution the same way.
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// A CSS border-triangle trick was tried here first (transparent top/bottom
// borders + solid left border) but Satori — next/og's renderer — doesn't
// render it as a triangle; it fills the whole border box solid instead.
// Confirmed by fetching and visually inspecting the output PNG. A text
// glyph is a shape Satori is known to render correctly.
export default function Icon() {
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
          fontSize: 22,
          color: '#f78166',
        }}
      >
        {'>'}
      </div>
    ),
    { ...size }
  )
}
