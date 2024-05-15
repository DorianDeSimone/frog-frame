/** @jsxImportSource frog/jsx */

import { validateEmail, validateForm } from '@/app/utils/validation'
import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
import { neynar } from 'frog/hubs'
import { neynar as neynarMid } from 'frog/middlewares'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

const stringImage = (str: string) => {
  return (
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
        {str}
      </div>
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
    features: ['interactor', 'cast'],
  }),
)

app.frame('/:formUrl', (c) => {
  const { url } = c
  const formUrl = url.split("/api/")[1];
  
  return c.res({
    action: `/submit/${formUrl}`,
    image: `${process.env.NEXT_PUBLIC_SITE_URL}/assets/welcome.jpg`,
    imageAspectRatio: '1:1',
    intents: [
      <TextInput placeholder="Enter your email...test" />,
      <Button>Subscribe</Button>,
    ],
  })
})

app.frame('/submit/:formUrl', async (c) => {
  // const { verified, frameData, inputText = '', initialPath } = c;
  const { frameData, inputText = '', initialPath } = c;
  const verified = true;

  const formUrl = initialPath.split("/api/")[1];

  const { fid } = frameData || {}

  if(!verified) {
    return c.res({
      action: `/${formUrl}`,
      image: stringImage("You are not verified"),
      intents: [
        <Button value="retry">Retry</Button>,
      ],
    })
  }

  if (!validateEmail(inputText)) {
    return c.res({
      action: `/${formUrl}`,
      image: stringImage("The email is invalid"),
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
    const walletData: any = address ? {
      address,
      signature: undefined,
      signatureMessage: ''
    } : null;

    if (validateForm(fields)) {
      console.log("fid", fid)

      // const payload = walletData 
      //       ? { form_id: props.url, fid, session_id: fid, responses: formattedAnswers, walletData }
      //       : { form_id: props.url, fid, session_id: fid, responses: formattedAnswers };

      // const response = await fetch('/api/publish', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ payload }),
      // });

      // if (response.ok) {
        return c.res({
          action: `/${formUrl}`,
          image: stringImage("Email sent!"),
          intents: [
            <Button.Reset>Back</Button.Reset>,
          ],
        }) 
      } else {
        return c.res({
          action: `/${formUrl}`,
          image: stringImage("An error occured during submission"),
          intents: [
            <Button.Reset>Back</Button.Reset>,
          ],
        })
      }
    // } else {
    //   return c.res({
    //     action: `/${formUrl}`,
    //     image: stringImage("Invalid form!"),
    //     intents: [
    //       <Button.Reset>Back</Button.Reset>,
    //     ],
    //   })
    //  }
    }
   catch (error) {
      console.error('Error fetching form settings:', error);
      return c.res({
        action: `/${formUrl}`,
        image: stringImage("An error occured fetching form!"),
        intents: [
          <Button.Reset>Back</Button.Reset>,
        ],
      })
  }
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
