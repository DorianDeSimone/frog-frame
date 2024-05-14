// import { PubSub }  from '@google-cloud/pubsub';
// import { NextApiRequest, NextApiResponse } from 'next'
// import { fetchFormSettings } from './getForm';
// import { recoverAddress, getBytes, hashMessage } from "ethers";
// import { createRedisInstance } from '@/utils/redis';

// const validateRequestBody = (body: any) => {
//   if (!body.form_id || typeof body.form_id !== 'string') {
//     return 'Invalid or missing form_id.';
//   }
//   if (!Array.isArray(body.responses)) {
//     return 'Responses should be an array.';
//   }
//   for (const response of body.responses) {
//     if (typeof response.field_id !== 'string' || 
//         typeof response.response_type !== 'string' || 
//         (!['string', 'number', 'boolean'].includes(typeof response.response))) {
//       return 'Invalid response format.';
//     }
//   }
//   return null;
// };

// const recoverPublicKey = (message: string, signature: string) => {
//   const digest = getBytes(hashMessage(message));
//   return recoverAddress(digest, signature);
// }

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const { method, body } = req;
//   if (method === 'POST') {
//     const errorMessage = validateRequestBody(body.payload);
//     if (errorMessage) {
//       res.status(400).json({ error: errorMessage });
//       return;
//     }

//     try {
//       const formSettings = await fetchFormSettings(body.payload.form_id);
//       const walletField = formSettings.field_settings.find((page: any) => page.pageName === 'main-form')?.fields.find((field: any) => field.name === 'connectWallet');
//       if (walletField) {
//         const isRequired = walletField.options?.required;
//         const requiresSignature = walletField.options?.requiresSignature;
//         const data = body.payload.walletData;
        
//         if (isRequired) {
//           if (!data) throw new Error('Invalid wallet data.')
          
//           if (requiresSignature) {
//             if (!data.signature || !data.signatureMessage) {
//               throw new Error('Invalid signature data.')
//             } else {
//               const client = createRedisInstance();
//               const nonce = await client.get(data.address)

//               const messageToTest = `${data.signatureMessage}\n\nSignature ID:\n${nonce}`
//               const addressFromSignature = recoverPublicKey(messageToTest, data.signature);
//               if (addressFromSignature.toLowerCase() !== data.address.toLowerCase()) {
//                 throw new Error('Invalid address.')
//               }
//             }
//           } else if (!data.address) {
//             throw new Error('Invalid address.')
//           }
//         } else {
//           if (data && data.address && requiresSignature) {
//             if (!data.signature || !data.signatureMessage) {
//               throw new Error('Invalid signature data.')
//             } else {
//               const client = createRedisInstance();
//               const nonce = await client.get(data.address)

//               const messageToTest = `${data.signatureMessage}\n\nSignature ID:\n${nonce}`
//               const addressFromSignature = recoverPublicKey(messageToTest, data.signature);
//               if (addressFromSignature.toLowerCase() !== data.address.toLowerCase()) {
//                 throw new Error('Invalid address.')
//               }
//             }
//           }
//         }
//       }

//       const PUBSUB_CLIENT = new PubSub({ projectId: process.env.PUBSUB_PROJECT });
//       const dataBuffer = Buffer.from(JSON.stringify({...body.payload, walletData: undefined}));
//       const topic = await PUBSUB_CLIENT.topic(String(process.env.PUBSUB_TOPIC));
//       await topic.publishMessage({ data: dataBuffer });
//       res.status(200).json({ message: 'Successfully published' });
//     } catch (error: any) {
//       console.error(`Received error while publishing: ${error.message}`);
//       res.status(500).json({ error: 'Internal server error' });
//     }
//   } else {
//     res.status(405).end(`Method ${method} Not Allowed`);
//   }
// }