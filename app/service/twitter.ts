import { Service } from 'egg';
import { friendshipsProps } from '../../typings/index';
// import * as Codebird from '../utils/codebird';
import * as Codebird from 'codebird';

interface usersSearchProps {
  q: string,
  count: string | number
}
/**
 * Twitter Service
 */
export default class Twitter extends Service {

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

            if (err) {
              reject(err);
            }
            resolve(reply);
          },
        );
      });

      // 因为返回的搜索结果会去重 所以处理一下数据格式 screen_name: {}
      const list: {} = {};
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
      ctx.logger.error('friendshipsShow error', error);
      const result: any = {};
      return result;
    }
  }
  public async test(): Promise<any> {
    const { ctx } = this;

    const cb = new Codebird();
    cb.setUseProxy(true);
    cb.setConsumerKey(this.config.twitter.consumer_key, this.config.twitter.consumer_secret);
    cb.setToken(this.config.twitter.access_token_key, this.config.twitter.access_token_secret);

    try {
      const params = {
        source_screen_name: 'realmatataki',
        target_screen_name: 'guanchao71',
      };
      return new Promise((resolve: any, reject: any) => {
        return cb.__call(
          'friendships_show',
          params,
          (reply, xrate, err) => {
            console.log('respo', reply);
            console.log('xrate', xrate);
            if (err) {
              reject(err);
            }
            resolve(reply);
          },
        );
      });
    } catch (error) {
      ctx.logger.error('test error', error);
      const result: any = {};
      return result;
    }
  }
}
