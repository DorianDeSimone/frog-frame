import { Env, FrameContext } from 'frog';
import { BlankInput } from 'hono/types';

export type FrameContextType = FrameContext<Env, "/", BlankInput>;

export type FrameDataType = {
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
} | undefined;