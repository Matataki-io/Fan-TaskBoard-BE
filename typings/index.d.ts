import 'egg';


declare module 'egg' {
  interface Application {
      mysql: any,
      cache: any,
      Twitter: any
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
  title?: string,
  content?: string,
  key?: string,
  twitter_id?: number,
  token_id: number,
  reward_people: string,
  reward_price: string,
  hash?: string,
  create_time?: string,
  update_time?: string,
}

export interface questKeyInterface extends questInterface {
  key?: string,
}

export interface friendshipsProps {
  relationship: {
    source: {
      id: number,
      id_str: string,
      screen_name: string,
      following: boolean,
      followed_by: boolean,
      live_following: boolean,
      following_received: unknown,
      following_requested: unknown,
      notifications_enabled: unknown,
      can_dm: boolean,
      blocking: unknown,
      blocked_by: unknown,
      muting: unknown,
      want_retweets: unknown,
      all_replies: unknown,
      marked_spam: unknown
    },
    target: {
      id: number,
      id_str: number,
      screen_name: string,
      following: boolean,
      followed_by: boolean,
      following_received: unknown,
      following_requested: unknown
    }
  }
}

export interface followersIdsProps {
  ids: number[],
  next_cursor: number,
  next_cursor_str: string,
  previous_cursor: number,
  previous_cursor_str: string,
  total_count: any,
  httpstatus: number
}

export interface friendsIdsProps {
  previous_cursor: number,
  ids: number[],
  previous_cursor_str: string,
  next_cursor: number,
  next_cursor_str: string
}