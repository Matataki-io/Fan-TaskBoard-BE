import { Service } from 'egg';
// import { followersIdsProps, friendsIdsProps } from '../../typings/index';
import * as Twit from 'twit';
// import { isEmpty } from 'lodash';

interface usersSearchProps {
  q: string,
  count: string | number
}

interface TwitterState {
  code: number
  data?: any
  message?: string
}

/**
 * Twitter Service
 */
export default class TwitterService extends Service {

  private async TGet({ url, params }): Promise<TwitterState> {
    const { app, logger } = this;
    const T = new Twit({
      consumer_key: this.config.twitter.consumer_key,
      consumer_secret: this.config.twitter.consumer_secret,
      access_token: this.config.twitter.access_token_key,
      access_token_secret: this.config.twitter.access_token_secret,
      timeout_ms: 30 * 1000, // optional HTTP request timeout to apply to all requests.
      strictSSL: app.config.env === 'prod', // optional - requires SSL certificates to be valid.
    });

    try {
      logger.info('TGet start:', url, params);
      const result: TwitterState = await new Promise((resolve: any, reject: any) => {
        T.get(url, params, function(err, data, response) {
          logger.info('data', data);
          logger.info('response', response);
          if (err) {
            logger.info('err', err);
            const res = {
              code: -1,
              message: err,
            };
            reject(res);
          }

          const resolveRes = {
            code: 0,
            data,
          };
          resolve(resolveRes);
        });
      });

      return result;
    } catch (error) {
      logger.error('twitterFn error', url, error);
      return {
        code: -1,
        message: error.toString(),
      };
    }
  }
  // 搜索twitter用户
  public async usersSearch({ q, count }: usersSearchProps): Promise<TwitterState> {
    return await this.TGet({ url: 'users/search', params: { q, count } });
  }
  // 批量搜素用户
  public async usersLookup(screen_name: string): Promise<TwitterState> {
    return await this.TGet({ url: 'users/lookup', params: { screen_name } });
  }
  // 批量搜素用户 ids
  public async usersLookupIds(user_id: string): Promise<TwitterState> {
    return await this.TGet({ url: 'users/lookup', params: { user_id } });
  }
  // 获取twitter用户 A 和 B 的关注状态
  public async friendshipsShow(source_screen_name: string, target_screen_name: string): Promise<TwitterState> {
    const { logger } = this;
    // 不能为空
    if (!source_screen_name || !target_screen_name) {
      const e = 'friendshipsShow error: source_screen_name or target_screen_name not empty';
      logger.error(e);
      return {
        code: -1,
        message: e.toString(),
      };
    }

    return await this.TGet({ url: 'friendships/show', params: {
      source_screen_name,
      target_screen_name,
    } });
  }
  // 获取关注用户ids
  // TODO: 如果使用该接口需要判断下一页
  public async followersIds(screen_name: string, count = 5000): Promise<TwitterState> {
    const { ctx, app, logger } = this;
    const T = new Twit({
      consumer_key: this.config.twitter.consumer_key,
      consumer_secret: this.config.twitter.consumer_secret,
      access_token: this.config.twitter.access_token_key,
      access_token_secret: this.config.twitter.access_token_secret,
      timeout_ms: 30 * 1000, // optional HTTP request timeout to apply to all requests.
      strictSSL: app.config.env === 'prod', // optional - requires SSL certificates to be valid.
    });

    try {
      // 不能为空
      if (!screen_name) {
        throw new Error('screen_name not empty');
      }

      const result: TwitterState = await new Promise((resolve: any, reject: any) => {
        const params = {
          screen_name,
          count,
        };

        T.get('followers/ids', params, function(err, data, response) {
          logger.info('data', data);
          logger.info('response', response);
          if (err) {
            logger.info('err', err);
            const res = {
              code: -1,
              message: err,
            };
            reject(res);
          }

          const resolveRes = {
            code: 0,
            data,
          };
          resolve(resolveRes);
        });

      });
      return result;
    } catch (error) {
      ctx.logger.error('followersIds error', error);
      return {
        code: -1,
        message: error.toString(),
      };
    }
  }
  // 获取用户关注ids
  // TODO: 如果使用该接口需要判断下一页
  public async friendsIds(screen_name: string, count = 5000): Promise<TwitterState> {
    const { ctx, app, logger } = this;
    const T = new Twit({
      consumer_key: this.config.twitter.consumer_key,
      consumer_secret: this.config.twitter.consumer_secret,
      access_token: this.config.twitter.access_token_key,
      access_token_secret: this.config.twitter.access_token_secret,
      timeout_ms: 30 * 1000, // optional HTTP request timeout to apply to all requests.
      strictSSL: app.config.env === 'prod', // optional - requires SSL certificates to be valid.
    });

    try {
      // 不能为空
      if (!screen_name) {
        throw new Error('screen_name not empty');
      }

      const result: TwitterState = await new Promise((resolve: any, reject: any) => {
        const params = {
          screen_name,
          count,
        };

        T.get('friends/ids', params, function(err, data, response) {
          logger.info('data', data);
          logger.info('response', response);
          if (err) {
            logger.info('err', err);
            const res = {
              code: -1,
              message: err,
            };
            reject(res);
          }

          const resolveRes = {
            code: 0,
            data,
          };
          resolve(resolveRes);
        });

      });
      return result;
    } catch (error) {
      ctx.logger.error('friendsIds error', error);
      return {
        code: -1,
        message: error.toString(),
      };
    }
  }
  // 获取用户关注 list
  public async friendsList(screen_name: string, count = 200): Promise<TwitterState> {
    const { ctx, app, logger } = this;
    const T = new Twit({
      consumer_key: this.config.twitter.consumer_key,
      consumer_secret: this.config.twitter.consumer_secret,
      access_token: this.config.twitter.access_token_key,
      access_token_secret: this.config.twitter.access_token_secret,
      timeout_ms: 30 * 1000, // optional HTTP request timeout to apply to all requests.
      strictSSL: app.config.env === 'prod', // optional - requires SSL certificates to be valid.
    });

    const params = {
      screen_name,
      count,
      cursor: -1,
    };
    try {
      // 不能为空
      if (!screen_name) {
        throw new Error('screen_name not empty');
      }

      const result: TwitterState = await new Promise((resolve: any, reject: any) => {
        const friendsListResult: any[] = [];
        const friendsList = params => {

          T.get('friends/list', params, function(err, data, response) {
            logger.info('data', data);
            logger.info('response', response);
            if (err) {
              logger.info('err', err);
              const res = {
                code: -1,
                message: err,
              };

              reject(res);
            }

            friendsListResult.push(data);

            const nextCursor = data.next_cursor_str;
            if (nextCursor > 0) {
              logger.info('nextCursor', nextCursor);
              params.cursor = nextCursor;
              friendsList(params);
            } else {
              const res = {
                code: 0,
                data: friendsListResult,
              };
              resolve(res);
            }
          });
        };
        friendsList(params);
      });

      logger.info('friendsList result', result);

      return result;
    } catch (error) {
      ctx.logger.error('friendsList error', error);
      return {
        code: -1,
        data: [],
      };
    }
  }
  // GET statuses/retweets/:id
  // Returns a collection of the 100 most recent retweets of the Tweet specified by the id parameter.
  public async statusesRetweetsId({ id }): Promise<TwitterState> {
    return await this.TGet({ url: 'statuses/retweets/:id', params: { id, count: 100 } });
  }
  // GET statuses/retweeters/ids
  // Returns a collection of up to 100 user IDs belonging to users who have retweeted the Tweet specified by the id parameter.
  // 只会返回部分转推用户 官网自己的接口也只返回部分数据 不知道为什么
  public async statusesRetweetsIds({ id }): Promise<TwitterState> {
    return await this.TGet({ url: 'statuses/retweeters/ids', params: { id } });
  }
  // /2/users/:id/tweets
  public async usersIdTweets({ id }): Promise<TwitterState> {
    return await this.TGet({ url: 'users/:id/tweets', params: { id } });
  }

  public async statusesUserTimeline({ screen_name, count = 200 }): Promise<TwitterState> {
    return await this.TGet({ url: 'statuses/user_timeline', params: { screen_name, count } });
  }
  // Returns a single Tweet, specified by the id parameter. The Tweet's author will also be embedded within the Tweet.
  public async statusesShowId({ id }): Promise<TwitterState> {
    return await this.TGet({ url: 'statuses/show/:id', params: { id } });
  }

  public async test(): Promise<any> {
    // const list: any[] = [];
    // list.push(this.friendshipsShow('XiaoTianIsMe', 'shellteo'));
    // list.push(this.friendshipsShow('XiaoTianIsMe', 'shellteo'));
    // const result = await Promise.all(list);

    // // 处理关系结果格式 ===> [key: target_screen_name]: {}
    // const relationshipList = {};
    // result.forEach((i: any) => {
    //   this.logger.info('friendshipsShow result i ', i);
    //   // 处理 empty object
    //   const next = i.code === 0 ? i.data : { };
    //   this.logger.info('friendshipsShow result next ', next);

    //   if (!isEmpty(next)) {
    //     const screen_name: any = next.relationship.target.screen_name;
    //     if (!relationshipList[screen_name]) {
    //       relationshipList[screen_name] = {};
    //     }
    //     relationshipList[screen_name] = next;
    //   }
    // });
    // this.logger.info('relationshipList', relationshipList);

    // return relationshipList;

    // return this.usersIdTweets({ id: '718672387714064384' });

    // return this.TGet({ url: 'statuses/user_timeline', params: { screen_name: 'XiaoTianIsMe', count: 200 } });
    // return await this.TGet({ url: 'users/search', params: { q: 'xiaotian', count: 2 } });

    return await this.usersLookup('zxtzhangqian');
  }

}
