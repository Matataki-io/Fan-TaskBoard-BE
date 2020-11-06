import 'egg';

declare module 'egg' {
  interface Application {
      mysql: any
  }
}

export interface nftInterface {
  tokenId: number,
  account: string,
  transactionHash: string,
  tx: string,
  signature?: string,
  logo: string,
  name: string,
  symbol: string,
  description: string,
  create_time?: string,
  update_time?: string,
}