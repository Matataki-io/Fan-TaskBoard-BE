import { Service } from 'egg';
import * as TwitterClient from 'twitter';
import { friendshipsProps } from '../../typings/index';
import { twitterConfig } from '../utils/twitter';

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

    try {
      const result: [] = await new Promise((resolve: any, reject: any) => {
        const params = { q, count };

        function searchData(error, data) {
          if (error) {
            reject(error);
          } else {
            console.log('data', data);
            resolve(data);
          }
        }

        const T: TwitterClient = new TwitterClient(twitterConfig({
          consumer_key: this.config.twitter.consumer_key,
          consumer_secret: this.config.twitter.consumer_secret,
          access_token_key: this.config.twitter.access_token_key,
          access_token_secret: this.config.twitter.access_token_secret,
        }));
        T.get('users/search', params, searchData);
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


    try {
      const result: [] = await new Promise((resolve: any, reject: any) => {
        // 'XiaoTianIsMe,XiaoTianIsMe,island205,XiaoTianIsMe'
        const params = { screen_name };

        function searchData(error, data) {
          if (error) {
            reject(error);
          } else {
            console.log('data', data);
            resolve(data);
          }
        }

        const T: TwitterClient = new TwitterClient(twitterConfig({
          consumer_key: this.config.twitter.consumer_key,
          consumer_secret: this.config.twitter.consumer_secret,
          access_token_key: this.config.twitter.access_token_key,
          access_token_secret: this.config.twitter.access_token_secret,
        }));
        T.get('users/lookup', params, searchData);
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

        function searchData(error, data) {
          if (error) {
            reject(error);
          } else {
            // console.log('data', data);
            resolve(data);
          }
        }

        const T: TwitterClient = new TwitterClient(twitterConfig({
          consumer_key: this.config.twitter.consumer_key,
          consumer_secret: this.config.twitter.consumer_secret,
          access_token_key: this.config.twitter.access_token_key,
          access_token_secret: this.config.twitter.access_token_secret,
        }));
        T.get('friendships/show', params, searchData);
      });

      return result;
    } catch (error) {
      ctx.logger.error('friendshipsShow error', error);
      const result: any = {};
      return result;
    }
  }
  public async test(): Promise<friendshipsProps> {
    const { ctx } = this;

    try {
      const result: friendshipsProps = await new Promise((resolve: any, reject: any) => {

        const params = {
          source_screen_name: 'XiaoTianIsMe',
          target_screen_name: 'XiaoTianIsMe',
        };

        function searchData(error, data) {
          if (error) {
            reject(error);
          } else {
            console.log('data', data);
            resolve(data);
          }
        }

        const T: TwitterClient = new TwitterClient(twitterConfig({
          consumer_key: this.config.twitter.consumer_key,
          consumer_secret: this.config.twitter.consumer_secret,
          access_token_key: this.config.twitter.access_token_key,
          access_token_secret: this.config.twitter.access_token_secret,
        }));
        T.get('friendships/show', params, searchData);
      });

      return result;
    } catch (error) {
      ctx.logger.error('usersLookup error', error);
      const result: any = {};
      return result;
    }
  }
}
