/** @jsxImportSource frog/jsx */

import { Button, Frog, TextInput } from 'frog'
import { devtools } from 'frog/dev'
// import { pinata } from 'frog/hubs'
import { neynar } from 'frog/hubs'
import { handle } from 'frog/next'
import { serveStatic } from 'frog/serve-static'

const app = new Frog({
  assetsPath: '/',
  basePath: '/api',
  // hub: neynar({ apiKey: process.env.NEXT_NEYNAR_API_KEY || "" })
  // hub: pinata(),
})

app.frame('/', (c) => {
  const { buttonValue, status } = c
  return c.res({
    image: (
      <div style={{ color: 'white', display: 'flex', fontSize: 60 }}>
        {status === 'initial' ? (
          'Select your fruit!'
        ) : (
          `Selected: ${buttonValue}`
        )}
      </div>
    ),
    intents: [
      <Button value="apple">Apple</Button>,
      <Button value="banana">Banana</Button>,
      <Button value="mango">Mango</Button>
    ]
  })
})

devtools(app, { serveStatic })

export const GET = handle(app)
export const POST = handle(app)
