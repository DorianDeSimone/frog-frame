/** @jsxImportSource frog/jsx */

import { validateEmail, validateForm } from '@/app/utils/validation'
import { PubSub } from '@google-cloud/pubsub'
import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { neynar } from 'frog/hubs'
import { neynar as neynarMid } from 'frog/middlewares'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'
import {
  RED,
  BLUE,
  FETCHING_FAILURE,
  INVALID_FORM,
  EMAIL_PLACEHOLDER,
  BUTTON_SUBMIT,
  BUTTON_RESET,
  BUTTON_BACK,
  NOT_VERIFIED,
  INVALID_EMAIL,
  SUBMITTED,
} from '../../utils/constants'


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
  const formUrl = c.req.param("formUrl");

  const bucketName = process.env.GS_FORM_BUCKET_NAME || "";
  const settingsUrl = `https://storage.googleapis.com/${bucketName}/${formUrl}/settings.json`;

  try {
    const response = await fetch(settingsUrl);
    if (!response.ok) {
        throw new Error(FETCHING_FAILURE);
    }
    const formSettings = await response.json();
    const fields = formSettings.field_settings[0]?.fields || [];

    if (!validateForm(fields)) {
      throw new Error(INVALID_FORM);
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
          {/* @ts-ignore */}
          <img alt="home image" src={firstImage ? firstImage : `${process.env.NEXT_PUBLIC_SITE_URL}/assets/welcome.jpg`} />
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: firstHeadline ? '0 36px' : '0',
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
        <TextInput placeholder={EMAIL_PLACEHOLDER} />,
        <Button>{BUTTON_SUBMIT}</Button>,
      ],
    })
  } catch(error: any) {
    console.log("error", error)
    if (error.message === "Invalid form") {
      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: INVALID_FORM, bgColor: RED}),
      })
    } else {
      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: FETCHING_FAILURE, bgColor: RED}),
        intents: [
          <Button.Reset>{BUTTON_RESET}</Button.Reset>,
        ],
      })
    }
  }
})

app.frame('/submit/:formUrl', async (c) => {
  const { verified, frameData, inputText = '' } = c;
  const formUrl = c.req.param("formUrl");
  const { fid } = frameData || {}

  if(!verified) {
    return c.res({
      action: `/${formUrl}`,
      image: stringImage({text: NOT_VERIFIED, bgColor: RED}),
      intents: [
        <Button value="retry">{BUTTON_RESET}</Button>,
      ],
    })
  }

  if (!validateEmail(inputText)) {
    return c.res({
      action: `/${formUrl}`,
      image: stringImage({text: INVALID_EMAIL, bgColor: RED}),
      intents: [
        <Button.Reset>{BUTTON_RESET}</Button.Reset>,
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
        throw new Error(FETCHING_FAILURE);
    }
    const formSettings = await response.json();
    const fields = formSettings.field_settings[0]?.fields || [];

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
        image: stringImage({text: SUBMITTED}),
        intents: [
          <Button.Reset>{BUTTON_BACK}</Button.Reset>,
        ],
      }) 
    } else {
      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: INVALID_FORM, bgColor: RED}),
        intents: [
          <Button.Reset>{BUTTON_RESET}</Button.Reset>,
        ],
      })
     }
    }
   catch (error) {
      return c.res({
        action: `/${formUrl}`,
        image: stringImage({text: FETCHING_FAILURE, bgColor: RED}),
        intents: [
          <Button.Reset>{BUTTON_RESET}</Button.Reset>,
        ],
      })
  }
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
