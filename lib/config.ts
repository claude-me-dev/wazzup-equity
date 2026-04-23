export const TOKEN = {
  symbol: "WAZZUP",
  name: "Wazzup Equity",
  mint: "A2t8jVriahPQanFtVgfMSm1wW3ckMuSuuadLsXf7rEGG",
  decimals: 9,
} as const;

export type WalletRole = "main" | "treasury" | "liquidity" | "drops" | "deployer" | "locked";

export interface TrackedWallet {
  address: string;
  label: string;
  sns: string;
  role: WalletRole;
  locked?: { days: number };
  isBuybackSource?: boolean;
}

export const WALLETS: TrackedWallet[] = [
  {
    address: "BFud2Fcqjz3RS6ofFAN5yugdjvkPsAKurkhMttpKSnCy",
    label: "Wazzup Equity",
    sns: "wazzupequity.sol",
    role: "main",
  },
  {
    address: "ExLCgJR56iigdhCaKbb1guSXwWYXyCQHSc7c5VPU9oHL",
    label: "Treasury",
    sns: "treasury.wazzupequity.sol",
    role: "treasury",
    isBuybackSource: true,
  },
  {
    address: "2fX8nRY2ZuxWotrFP6SsUPM2Bt6L3FpxnjobPQ2h86yj",
    label: "Liquidity",
    sns: "liquidity.wazzupequity.sol",
    role: "liquidity",
    isBuybackSource: true,
  },
  {
    address: "G4o31Y8pK2pwiqA9nWmQhmT68c7rj7QigmZmPoejJnGC",
    label: "Drops",
    sns: "drops.wazzupequity.sol",
    role: "drops",
  },
  {
    address: "Aigjyy8JaFyPwvCWieA2rGYRWSBaahaJkkhvsV2VPmxo",
    label: "Deployer",
    sns: "deployer.wazzupequty.sol",
    role: "deployer",
    isBuybackSource: true,
  },
  {
    address: "3kwVFFDU4Am9z8ReRTT83BNcrYhFuxD8EuKqEXGWkvoP",
    label: "Locked Vault · 5,000d",
    sns: "",
    role: "locked",
    locked: { days: 5000 },
  },
  {
    address: "2dEjnFqbd9PtWctPzm3QFjSjyzHbuRpUdPbnFYwbe2QP",
    label: "Locked Vault · 15,000d",
    sns: "",
    role: "locked",
    locked: { days: 15000 },
  },
];

export const LOCKED_WALLETS = WALLETS.filter((w) => w.role === "locked");
export const BUYBACK_WALLETS = WALLETS.filter((w) => w.isBuybackSource);
