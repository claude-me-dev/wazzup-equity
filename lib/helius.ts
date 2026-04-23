import { TOKEN } from "./config";

const RPC_URL = () => {
  const key = process.env.HELIUS_API_KEY;
  if (!key) throw new Error("HELIUS_API_KEY is not set");
  return `https://mainnet.helius-rpc.com/?api-key=${key}`;
};

const ENHANCED_URL = (path: string) => {
  const key = process.env.HELIUS_API_KEY;
  if (!key) throw new Error("HELIUS_API_KEY is not set");
  return `https://api.helius.xyz/v0${path}${path.includes("?") ? "&" : "?"}api-key=${key}`;
};

interface RpcResponse<T> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: { code: number; message: string };
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: method, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Helius RPC ${method} failed: ${res.status}`);
  const json = (await res.json()) as RpcResponse<T>;
  if (json.error) throw new Error(`Helius RPC ${method}: ${json.error.message}`);
  if (json.result === undefined) throw new Error(`Helius RPC ${method}: empty result`);
  return json.result;
}

interface TokenSupplyResult {
  context: { slot: number };
  value: { amount: string; decimals: number; uiAmount: number | null; uiAmountString: string };
}

export async function getMintSupply(): Promise<{ raw: bigint; ui: number; decimals: number }> {
  const result = await rpc<TokenSupplyResult>("getTokenSupply", [TOKEN.mint]);
  return {
    raw: BigInt(result.value.amount),
    ui: Number(result.value.uiAmountString),
    decimals: result.value.decimals,
  };
}

interface TokenAccountsByOwnerResult {
  context: { slot: number };
  value: Array<{
    pubkey: string;
    account: {
      data: {
        parsed: {
          info: {
            tokenAmount: { amount: string; decimals: number; uiAmount: number | null; uiAmountString: string };
            mint: string;
            owner: string;
          };
        };
      };
    };
  }>;
}

export async function getWalletBalance(owner: string): Promise<number> {
  const result = await rpc<TokenAccountsByOwnerResult>("getTokenAccountsByOwner", [
    owner,
    { mint: TOKEN.mint },
    { encoding: "jsonParsed" },
  ]);
  return result.value.reduce(
    (sum, acc) => sum + Number(acc.account.data.parsed.info.tokenAmount.uiAmountString),
    0,
  );
}

export async function getManyWalletBalances(owners: string[]): Promise<Record<string, number>> {
  const balances = await Promise.all(owners.map((o) => getWalletBalance(o)));
  return Object.fromEntries(owners.map((o, i) => [o, balances[i]]));
}

export interface HeliusParsedTx {
  signature: string;
  timestamp: number;
  type: string;
  source?: string;
  fee?: number;
  feePayer?: string;
  description?: string;
  tokenTransfers?: Array<{
    fromUserAccount?: string;
    toUserAccount?: string;
    fromTokenAccount?: string;
    toTokenAccount?: string;
    tokenAmount: number;
    mint: string;
  }>;
  events?: {
    swap?: {
      nativeInput?: { account: string; amount: string } | null;
      nativeOutput?: { account: string; amount: string } | null;
      tokenInputs?: Array<{
        userAccount: string;
        mint: string;
        rawTokenAmount: { tokenAmount: string; decimals: number };
      }>;
      tokenOutputs?: Array<{
        userAccount: string;
        mint: string;
        rawTokenAmount: { tokenAmount: string; decimals: number };
      }>;
    };
  };
}

export async function getAddressTransactions(
  address: string,
  opts: { limit?: number; before?: string; until?: string; type?: string } = {},
): Promise<HeliusParsedTx[]> {
  const params = new URLSearchParams();
  params.set("limit", String(opts.limit ?? 100));
  if (opts.before) params.set("before", opts.before);
  if (opts.until) params.set("until", opts.until);
  if (opts.type) params.set("type", opts.type);
  const res = await fetch(ENHANCED_URL(`/addresses/${address}/transactions?${params}`), {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Helius enhanced tx failed: ${res.status}`);
  return (await res.json()) as HeliusParsedTx[];
}
