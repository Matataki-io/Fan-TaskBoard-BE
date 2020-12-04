import 'egg';


declare module 'egg' {
  interface Application {
      mysql: any
  }
}

export interface nftInterface {
  tokenId?: number,
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

export interface questInterface {
  id?: number,
  uid?: number,
  type: number,
  twitter_id: number,
  token_id: number,
  reward_people: string,
  reward_price: string,
  create_time?: string,
  update_time?: string,
}

