import { Service } from 'egg';
import { friendshipsProps, followersIdsProps, friendsIdsProps } from '../../typings/index';
// import * as Codebird from '../utils/codebird';
import * as Codebird from 'codebird';

interface usersSearchProps {
  q: string,
  count: string | number
}
/**
 * Twitter Service
 */
export default class TwitterService extends Service {

  // 搜索twitter用户
  public async usersSearch({ q, count }: usersSearchProps) {
    const { ctx } = this;
    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);
    cb.setToken(this.config.twitter.access_token_key, this.config.twitter.access_token_secret);

    try {
      const result: [] = await new Promise((resolve: any, reject: any) => {
        const params = { q, count };
        return cb.__call(
          'users_search',
          params,
          (reply, _: any, err) => {

            if (reply.errors && reply.errors.length) {
              reject(reply.errors[0].message);
            }

            if (err) {
              reject(err);
            }
            resolve(reply);
          },
        );
      });

      const list = result.map((i: any) => ({
        id: i.id,
        id_str: i.id_str,
        name: i.name,
        screen_name: i.screen_name,
        profile_image_url_https: i.profile_image_url_https,
      }));
      return {
        code: 0,
        message: 'success',
        data: list,
      };
    } catch (error) {
      ctx.logger.error('usersSearch error', error);
      return {
        code: -1,
        message: error.toString(),
      };
    }
  }
  // 批量搜素用户
  public async usersLookup(screen_name: string) {
    const { ctx } = this;
    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);
    try {
      const result: [] = await new Promise((resolve: any, reject: any) => {
        // 'XiaoTianIsMe,XiaoTianIsMe,island205,XiaoTianIsMe'
        const params = { screen_name };
        return cb.__call(
          'users_lookup',
          params,
          (reply, _: any, err) => {
            // console.log('respo', reply);
            // console.log('xrate', xrate);

            if (reply.errors && reply.errors.length) {
              reject(reply.errors[0].message);
            }

            if (reply && Number(reply.httpstatus) !== 200) {
              reject(JSON.stringify(reply));
            }

            if (err) {
              reject(err);
            }
            resolve(reply);
          },
        );
      });

      // 因为返回的搜索结果会去重 所以处理一下数据格式 screen_name: {}
      const list: {} = {};
      console.log('result', result);
      result.forEach((i: any) => {
        if (!list[i.screen_name]) {
          list[i.screen_name] = {};
        }
        list[i.screen_name] = {
          name: i.name,
          screen_name: i.screen_name,
          profile_image_url_https: i.profile_image_url_https,
        };
      });

      return list;
    } catch (error) {
      ctx.logger.error('usersLookup error', error);
      return {};
    }
  }
  // 批量搜素用户 ids
  public async usersLookupIds(user_id: string): Promise<any> {
    const { ctx } = this;
    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);
    try {
      const result: [] = await new Promise((resolve: any, reject: any) => {
        const params = { user_id };
        return cb.__call(
          'users_lookup',
          params,
          (reply, _: any, err) => {
            // console.log('respo', reply);
            // console.log('xrate', _);

            if (reply.errors && reply.errors.length) {
              reject(reply.errors[0].message);
            }

            if (err) {
              reject(err);
            }
            resolve(reply);
          },
        );
      });

      // console.log('result', result);
      return result;
    } catch (error) {
      ctx.logger.error('usersLookupIds error', error);
      return [];
    }
  }
  // 获取twitter用户 A 和 B 的关注状态
  public async friendshipsShow(source_screen_name: string, target_screen_name: string): Promise<friendshipsProps> {
    const { ctx } = this;
    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);

    try {
      // 不能为空
      if (!source_screen_name || !target_screen_name) {
        throw new Error('source_screen_name or target_screen_name not empty');
      }

      const result: friendshipsProps = await new Promise((resolve: any, reject: any) => {
        const params = {
          source_screen_name,
          target_screen_name,
        };
        return cb.__call(
          'friendships_show',
          params,
          (reply, _: any, err) => {
            // console.log('reply', reply, err);
            if (err) {
              reject(err);
            }
            if (reply.errors && reply.errors.length) {
              reject(reply.errors[0].message);
            }
            if (reply && Number(reply.httpstatus) !== 200) {
              reject(JSON.stringify(reply));
            }

            resolve(reply);
          },
        );
      });
      return result;
    } catch (error) {
      ctx.logger.error('friendshipsShow error', error);
      const result: any = {};
      return result;
    }
  }
  // 获取关注用户ids
  public async followersIds(screen_name: string, count = 5000): Promise<followersIdsProps> {
    const { ctx } = this;
    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);

    try {
      // 不能为空
      if (!screen_name) {
        throw new Error('screen_name not empty');
      }

      const result: followersIdsProps = await new Promise((resolve: any, reject: any) => {
        const params = {
          screen_name,
          count,
        };
        return cb.__call(
          'followers/ids',
          params,
          (reply, _: any, err) => {
            // console.log('reply', reply, err);

            if (reply.errors && reply.errors.length) {
              reject(reply.errors[0].message);
            }

            if (err) {
              reject(err);
            }
            resolve(reply);
          },
        );
      });
      return result;
    } catch (error) {
      ctx.logger.error('followersIds error', error);
      const result: any = {};
      return result;
    }
  }
  // 获取用户关注ids
  public async friendsIds(screen_name: string, count = 5000): Promise<friendsIdsProps> {
    const { ctx } = this;
    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);

    try {
      // 不能为空
      if (!screen_name) {
        throw new Error('screen_name not empty');
      }

      const result: followersIdsProps = await new Promise((resolve: any, reject: any) => {
        const params = {
          screen_name,
          count,
        };
        return cb.__call(
          'friends/ids',
          params,
          (reply, _: any, err) => {
            // console.log('reply', reply, err);

            if (reply.errors && reply.errors.length) {
              reject(reply.errors[0].message);
            }

            if (err) {
              reject(err);
            }
            resolve(reply);
          },
        );
      });
      return result;
    } catch (error) {
      ctx.logger.error('friendsIds error', error);
      const result: any = {};
      return result;
    }
  }
  // 获取用户关注 list
  public async friendsList(screen_name: string, count = 200): Promise<any[]> {
    const { ctx } = this;
    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);

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

      const result: any = await new Promise((resolve: any, reject: any) => {
        const friendsListResult: any[] = [];
        const friendsList = params => {
          cb.__call(
            'friends_list',
            params,
            (reply, _:any, err) => {
              // console.log('respo', JSON.stringify(reply));
              // console.log('xrate', xrate);
              if (err) {
                reject(err);
              }

              if (reply.errors && reply.errors.length) {
                reject(reply.errors[0].message);
              }
              if (reply && Number(reply.httpstatus) !== 200) {
                reject(JSON.stringify(reply));
              }

              friendsListResult.push(reply);

              const nextCursor = reply.next_cursor_str;
              if (nextCursor > 0) {
                console.log('nextCursor', nextCursor);
                params.cursor = nextCursor;
                friendsList(params);
              } else {
                resolve(friendsListResult);
              }
            },
          );
        };
        friendsList(params);
      });

      console.log('friendsList result', result);

      // 合并数据
      const resultTotal = result.map(i => i.users);
      return resultTotal.flat(1);
    } catch (error) {
      ctx.logger.error('friendsList error', error);
      const result: any = [];
      return result;
    }
  }
  public async test(): Promise<any> {
    const { ctx } = this;
    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);
    // cb.setToken('1218028959109210113-1kTzez8ifRL8RmbMQqyQOR4QGtiTb8', '2riDqqfjq3XjiR4JL8avjF7ONWJfAmoT1ybbAmA5Aay1r');

    // const params = {
    //   screen_name: 'XiaoTianIsMe',
    //   count: 20,
    //   cursor: -1,
    // };

    try {
    //   const result: any = await new Promise((resolve: any, reject: any) => {

      //     const friendsListResult: any[] = [];
      //     const friendsList = params => {
      //       cb.__call(
      //         'friends_list',
      //         params,
      //         (reply, _:any, err) => {
      //           // console.log('respo', JSON.stringify(reply));
      //           // console.log('xrate', xrate);
      //           if (err) {
      //             reject(err);
      //           }

      //           friendsListResult.push(reply.users.map(i => i.screen_name));

      //           const nextCursor = reply.next_cursor_str;
      //           if (nextCursor > 0) {
      //             console.log(111, nextCursor);
      //             params.cursor = nextCursor;
      //             friendsList(params);
      //           } else {
      //             resolve(friendsListResult);
      //           }
      //         },
      //       );
      //     };

      //     friendsList(params);
      //   });

      // console.log('result', result.ids.join(','));
      // const usersInfo = await this.usersLookupIds(result.ids.join(','));

      // return usersInfo.map(i => ({
      //   screen_name: i.screen_name,
      //   id: i.id,
      // }));

      const result = await this.friendsList('XiaoTianIsMe');
      return result;
    } catch (error) {
      ctx.logger.error('test error', error);
      const result: any = {};
      return result;
    }
  }
}
