/** @jsxImportSource frog/jsx */

import { validateEmail } from '@/app/utils/validation'
import { Button, Env, FrameContext, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import { BlankInput } from 'hono/types'

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

app.frame('/submit', (c: FrameContext<Env, "/", BlankInput>) => {
  console.log("c", c)
  const { verified, frameData } = c;

  const test : {
    address?: string | undefined;
    buttonIndex?: 1 | 2 | 3 | 4 | undefined;
    castId: {
        fid: number;
        hash: string;
    };
    fid: number;
    inputText?: string | undefined;
    messageHash: string;
    network: number;
    state?: string | undefined;
    timestamp: number;
    transactionId?: `0x${string}` | undefined;
    url: string;
} | undefined = c.frameData;
  
const test2 = test?.inputText;
console.log("test", test)
console.log("test2", test2)


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
