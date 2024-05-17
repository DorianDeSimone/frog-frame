import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const hasText = searchParams.has('text')
  const text = hasText ? searchParams.get('text')?.slice(0, 100) : ''

  const imageData = await fetch(
    new URL('./default.jpg', import.meta.url)
  ).then((res) => res.arrayBuffer())

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          background: '#f6f6f6',
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {/* @ts-ignore */}
        <img alt="form image" src={imageData} />
        {/* <img alt="form image" src={`${process.env.NEXT_PUBLIC_SITE_URL}/assets/welcome.jpg`} /> */}
        <p
          style={{
            position: 'absolute',
            margin: 0,
            paddingBottom: 20,
            color: '#ffffff',
            lineHeight: 1,
            fontSize: 100,
            textAlign: 'center',
            textTransform: 'uppercase',
            textShadow:
              '5px 5px 3px #000, -5px 5px 3px #000, -5px -5px 0 #000, 5px -5px 0 #000',
          }}
        >
          {text}
        </p>
      </div>
    ),
  )
}