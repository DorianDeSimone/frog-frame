/** @jsxImportSource frog/jsx */

import { validateEmail } from '@/app/utils/validation'
import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { neynar } from 'frog/hubs'
import { neynar as neynarMid } from 'frog/middlewares'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  hub: neynar({ apiKey: process.env.NEYNAR_API_KEY || "" }),
  verify: 'silent',
})

app.use(
  neynarMid({
    apiKey: process.env.NEYNAR_API_KEY || "",
    features: ['interactor', 'cast'],
  }),
)

app.frame('/', (c) => {
  console.log("c init", c)
  // console.log("c init", c.var.interactor)
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

app.frame('/submit', async (c) => {
  const { verified, frameData, inputText = '' } = c;
  // const { frameData, inputText = '' } = c;
  // const verified = true;

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

  // Verified

  const bucketName = process.env.GS_FORM_BUCKET_NAME || "";
  const formUrl = process.env.FORM_URL || "";
  const settingsUrl = `https://storage.googleapis.com/${bucketName}/${formUrl}/settings.json`;

  try {
    const response = await fetch(settingsUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch form settings');
    }
    const formSettings = await response.json();
    const fields = formSettings.field_settings[0]?.fields || [];

    console.log("fields", fields)

    if (fields.length === 1 && fields[0].name === "email") {
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
              Email sent !
            </div>
          </div>
        ),
        intents: [
          <Button value="back">Back</Button>,
        ],
      })
    } else {
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
              Invalid form!
            </div>
          </div>
        ),
        intents: [
          <Button value="back">Back</Button>,
        ],
      })
     }}
   catch (error) {
      console.error('Error fetching form settings:', error);
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
              An error occured fetching form!
            </div>
          </div>
        ),
        intents: [
          <Button value="back">Back</Button>,
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
