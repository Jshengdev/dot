// diag.ts — one-shot Photon health probe. Is the bridge alive? Can we send?
import { loadEnv } from './env.js';
loadEnv();
import { AdvancedIMessageKit } from '@photon-ai/advanced-imessage-kit';

/* eslint-disable @typescript-eslint/no-explicit-any */
async function main(): Promise<void> {
  const sdk = new AdvancedIMessageKit({
    serverUrl: process.env.IMESSAGE_SERVER_URL ?? '',
    apiKey: process.env.IMESSAGE_API_KEY ?? '',
  });
  await sdk.connect();
  console.log('connected OK');

  // server metadata / health if available
  try {
    const meta = await (sdk as any).getServerMetadata?.();
    if (meta) console.log('server meta:', JSON.stringify(meta).slice(0, 200));
  } catch (e: any) {
    console.log('server meta error:', e?.response?.status ?? '', e?.message ?? '');
  }

  try {
    const chats = await sdk.chats.getChats({ limit: 8, withLastMessage: true });
    console.log('getChats OK — count:', chats.length);
    for (const c of chats.slice(0, 8)) {
      console.log('  chat:', (c as any).guid, '·', (c as any).displayName ?? (c as any).chatIdentifier ?? '');
    }
    if (chats.length && process.env.DIAG_SEND === '1') {
      const guid = (chats[0] as any).guid as string;
      console.log('trying sendMessage to EXISTING chat:', guid);
      await sdk.messages.sendMessage({ chatGuid: guid, message: 'dot diagnostic ping (please ignore)' } as any);
      console.log('✅ sendMessage to existing chat: OK — the bridge can send.');
    } else {
      console.log('no existing chats to test a send against.');
    }
  } catch (e: any) {
    console.log('✗ getChats/send error:', e?.response?.status ?? '', e?.message ?? '');
  }
  process.exit(0);
}
main().catch((e: any) => {
  console.error('DIAG FAILED:', e?.response?.status ?? '', e?.message ?? e);
  process.exit(1);
});
