import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0A7C6E, #0D9E8D)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
        }}
      >
        <span
          style={{
            color: 'white',
            fontWeight: 800,
            fontSize: 20,
            fontFamily: 'sans-serif',
            letterSpacing: '-1px',
          }}
        >
          C
        </span>
      </div>
    ),
    { ...size }
  )
}
