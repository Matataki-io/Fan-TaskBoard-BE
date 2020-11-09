import 'egg';


declare module 'egg' {
  interface Application {
      mysql: any
  }
}

export interface nftInterface {
  tokenId: number,
  account: string,
  transactionHash?: string,
  tx?: string,
  signature?: string,
  logo: string,
  name: string,
  externalLink: string,
  description: string,
  status?: number,
  create_time?: string,
  update_time?: string,
}

