/** @jsxImportSource frog/jsx */

import { validateEmail } from '@/app/utils/validation'
import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  hub: neynar({ apiKey: process.env.NEXT_NEYNAR_API_KEY || "" }),
  verify: 'silent',
})

app.frame('/', (c) => {
  return c.res({
    action: '/submit',
    image: `${process.env.NEXT_PUBLIC_SITE_URL}/assets/welcome.jpg`,
    imageAspectRatio: '1:1',
    intents: [
      <TextInput placeholder="Enter your email..." />,
      <Button>Subscribe</Button>,
    ],
  })
})

app.frame('/submit', (c) => {
  console.log("c", c)
  const { verified, frameData } = c;
  
  console.log("frameData", frameData)
  // const { inputText } = frameData;


  if(!verified) {
    return c.res({
      action: '/',
      image: (
        <div
          style={{
            alignItems: 'center',
            background: 'black',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 60,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            You are not verified !
          </div>
        </div>
      ),
      intents: [
        <Button value="retry">Retry</Button>,
      ],
    })
  }

  const inputText = ""

  if (!validateEmail(inputText)) {
    return c.res({
      action: '/',
      image: (
        <div
          style={{
            alignItems: 'center',
            background: 'black',
            backgroundSize: '100% 100%',
            display: 'flex',
            flexDirection: 'column',
            flexWrap: 'nowrap',
            height: '100%',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
          }}
        >
          <div
            style={{
              color: 'white',
              fontSize: 60,
              fontStyle: 'normal',
              letterSpacing: '-0.025em',
              lineHeight: 1.4,
              marginTop: 30,
              padding: '0 120px',
              whiteSpace: 'pre-wrap',
            }}
          >
            The email is invalid
          </div>
        </div>
      ),
      intents: [
        <Button value="retry">Retry</Button>,
      ],
    })
  }

  return c.res({
    action: '/',
    image: (
      <div
        style={{
          alignItems: 'center',
          background: 'black',
          backgroundSize: '100% 100%',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 60,
            fontStyle: 'normal',
            letterSpacing: '-0.025em',
            lineHeight: 1.4,
            marginTop: 30,
            padding: '0 120px',
            whiteSpace: 'pre-wrap',
          }}
        >
          Email should be managed here !
        </div>
      </div>
    ),
    intents: [
      <Button value="back">Back</Button>,
    ],
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
