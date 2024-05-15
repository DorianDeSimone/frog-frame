/** @jsxImportSource frog/jsx */

import { validateEmail, validateForm } from '@/app/utils/validation'
import { PubSub } from '@google-cloud/pubsub'
import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { neynar } from 'frog/hubs'
import { neynar as neynarMid } from 'frog/middlewares'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

const BLUE = "#109cf1"
const RED = "#f7685b"

const stringImage = ({text, bgColor = BLUE}: {
  text: string;
  bgColor?: string;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'nowrap',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundSize: '100% 100%',
        background: bgColor,
        height: '100%',
        width: '100%',
      }}
    >
      <p
        style={{
          color: 'white',
          fontSize: 60,
          fontStyle: 'normal',
          letterSpacing: '-0.025em',
          lineHeight: 1.4,
        }}
      >
        {text}
      </p>
    </div>
  )
}

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  hub: neynar({ apiKey: process.env.NEYNAR_API_KEY || "" }),
  verify: 'silent',
})

app.use(
  neynarMid({
    apiKey: process.env.NEYNAR_API_KEY || "",
    features: ['interactor'],
  }),
)

app.frame('/:formUrl', async (c) => {
  const { url } = c
  const formUrl = url.split("/api/")[1];

  const bucketName = process.env.GS_FORM_BUCKET_NAME || "";
  const settingsUrl = `https://storage.googleapis.com/${bucketName}/${formUrl}/settings.json`;

  try {
    const response = await fetch(settingsUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch form settings');
    }
    const formSettings = await response.json();
    const fields = formSettings.field_settings[0]?.fields || [];

    if (!validateForm(fields)) {
      throw new Error('Invalid form');
    }

    const firstHeadline = fields.find((field: any) => field.type === 'headline')?.options.label || '';
    const firstImage = fields.find((field: any) => field.type === 'image')?.options.url || '';
  
    return c.res({
      action: `/submit/${formUrl}`,
      image: (
        <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'nowrap',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          width: '100%',
        }}>
          <img src={firstImage ? firstImage : `${process.env.NEXT_PUBLIC_SITE_URL}/assets/welcome.jpg`} />
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: firstHeadline ? '0 18px' : '0',
              borderRadius: '8px',
            }}
          >
            <p
              style={{
                color: 'white',
                fontSize: 60,
                fontStyle: 'normal',
                letterSpacing: '-0.025em',
                lineHeight: 1.4,
              }}
            >
              {firstHeadline}
            </p>
          </div>
        </div>
      ),
      intents: [
        <TextInput placeholder="Enter your email..." />,
        <Button>Subscribe</Button>,
      ],
    })
  } catch(error: any) {
    if (error.message === "Invalid form") {
      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: "Invalid form", bgColor: RED}),
      })
    } else {
      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: "An error occured fetching form!", bgColor: RED}),
        intents: [
          <Button.Reset>Retry</Button.Reset>,
        ],
      })
    }
  }
})

app.frame('/submit/:formUrl', async (c) => {
  const { verified, frameData, inputText = '', initialPath } = c;
  const formUrl = initialPath.split("/api/")[1];
  const { fid } = frameData || {}

  if(!verified) {
    return c.res({
      action: `/${formUrl}`,
      image: stringImage({text: "You are not verified", bgColor: RED}),
      intents: [
        <Button value="retry">Retry</Button>,
      ],
    })
  }

  if (!validateEmail(inputText)) {
    return c.res({
      action: `/${formUrl}`,
      image: stringImage({text: "The email is invalid", bgColor: RED}),
      intents: [
        <Button.Reset>Retry</Button.Reset>,
      ],
    })
  }

  // Verified

  let address = '';
  const { verifiedAddresses = null }: any = c.var.interactor || {}
  if (verifiedAddresses) {
    if (verifiedAddresses.ethAddresses.length > 0) {
      address = verifiedAddresses.ethAddresses[0];
    }
  }

  const bucketName = process.env.GS_FORM_BUCKET_NAME || "";
  const settingsUrl = `https://storage.googleapis.com/${bucketName}/${formUrl}/settings.json`;

  try {
    const response = await fetch(settingsUrl);
    if (!response.ok) {
        throw new Error('Failed to fetch form settings');
    }
    const formSettings = await response.json();
    const fields = formSettings.field_settings[0]?.fields || [];

    const firstHeadline = fields.find((field: any) => field.type === 'headline')?.options.label || '';
    const firstImage = fields.find((field: any) => field.type === 'image')?.options.url || '';

    if (validateForm(fields)) {
      const emailField = fields.find((field: any) => field.name === 'email')
      const emailResponse = {
        field_id: emailField.id,
        response_type: 'string',
        response: inputText
      };
      const walletField = fields.find((field: any) => field.name === 'connectWallet')
      const walletResponse = walletField && address ? {
        field_id: walletField.id,
        response_type: 'string',
        response: address
      } : undefined;

      const payload = {
        form_id: formUrl,
        uuid: fid?.toString(),
        session_id: fid,
        responses: walletResponse ? [
          emailResponse,
          walletResponse
        ] : [
          emailResponse
        ],
      }
     
      const PUBSUB_CLIENT = new PubSub({ projectId: process.env.PUBSUB_PROJECT });
      const dataBuffer = Buffer.from(JSON.stringify({...payload, walletData: undefined}));
      const topic = await PUBSUB_CLIENT.topic(String(process.env.PUBSUB_TOPIC));
      await topic.publishMessage({ data: dataBuffer });

      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: "Email sent!"}),
        intents: [
          <Button.Reset>Back</Button.Reset>,
        ],
      }) 
    } else {
      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: "Invalid form!", bgColor: RED}),
        intents: [
          <Button.Reset>Back</Button.Reset>,
        ],
      })
     }
    }
   catch (error) {
      console.error('Error fetching form settings:', error);
      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: "An error occured fetching form!", bgColor: RED}),
        intents: [
          <Button.Reset>Back</Button.Reset>,
        ],
      })
  }
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
