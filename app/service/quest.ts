import { Service } from 'egg';
import * as moment from 'moment';
import { questInterface, friendshipsProps } from '../../typings/index';
import { isEmpty } from 'lodash';


interface paginationInterface {
  page: number,
  size: number,
}

interface myNftInterface extends paginationInterface {
  account: string,
}

interface tokenIdInterface {
  id: string,
}


// interface requestResult {
//   count: number,
//   message: string,
//   data?: any
// }

interface questsListProps {
  count: number,
  list: {
    'id': number,
    'uid': number,
    'type': number,
    'twitter_id': string,
    'token_id': number,
    'reward_people': string,
    'reward_price': string,
    'create_time': string,
    'username': string,
    'symbol': string,
    'name': string,
    'screen_name': string,
    'profile_image_url_https': string
  }[]
}

/**
 * Quest Service
 */
export default class Quest extends Service {
  public async CreateQuest({ type, twitter_id, token_id, reward_people, reward_price }: questInterface) :Promise<any> {
    console.log('type, twitter_id, token_id, reward_people, reward_price', type, twitter_id, token_id, reward_people, reward_price);
    try {
      this.logger.info('create quest submit', new Date());

      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      const { id } = this.ctx.user;
      const data: questInterface = {
        uid: id,
        type,
        twitter_id,
        token_id,
        reward_people,
        reward_price,
        create_time: time,
        update_time: time,
      };

      const mysqlQuest = this.app.mysql.get('quest');
      const result = await mysqlQuest.insert('quests', data);
      const insertSuccess = result.affectedRows === 1;

      if (insertSuccess) {
        return { code: 0 };
      }
    } catch (e) {
      this.logger.error('create quest error: ', e);
      return {
        code: -1,
        message: `create quest error ${e}`,
      };
    }
  }

  public async getQuest({ page, size, account }: myNftInterface): Promise<questsListProps> {
    try {
      this.logger.info('get quest', new Date());

      const { ctx } = this;
      const { id } = ctx.user;

      // init mysql
      const mysqlQuest = this.app.mysql.get('quest');
      const mysqlMatataki = this.app.mysql.get('matataki');

      let data: any = {
        columns: [ 'id', 'uid', 'type', 'twitter_id', 'token_id', 'reward_people', 'reward_price', 'create_time' ],
        orders: [[ 'id', 'desc' ], [ 'create_time', 'desc' ]], // 排序方式
        limit: Number(size), // 返回数据量
        offset: (page - 1) * size, // 数据偏移量
      };

      if (account) {
        data = { ...data, where: { account } };
      }

      // 查询任务
      const results = await mysqlQuest.select('quests', data);

      // 查询用户数据
      let sqlUser = '';
      results.forEach((i: any) => {
        sqlUser += `SELECT * FROM users WHERE id = ${i.uid};`;
      });
      const resultsMatatakiUser = await mysqlMatataki.query(sqlUser);

      // 查询Token数据
      let sqlToken = '';
      results.forEach((i: any) => {
        sqlToken += `SELECT * FROM minetokens WHERE id = ${i.token_id};`;
      });
      const resultsMatatakiToken = await mysqlMatataki.query(sqlToken);

      // 写入用户和token数据
      if (results.length <= 1) {
        results[0].username = resultsMatatakiUser[0].nickname || resultsMatatakiUser[0].username || '';
        results[0].symbol = resultsMatatakiToken[0].symbol || '';
      } else {
        results.forEach((i: any, idx: number) => {
          i.username = resultsMatatakiUser[idx][0].nickname || resultsMatatakiUser[idx][0].username || '';
          i.symbol = resultsMatatakiToken[idx][0].symbol || '';
        });
      }

      // 查询count
      let sql = 'SELECT COUNT(1) as count from quests';
      if (account) {
        sql += ` WHERE account = '${account}'`;
      }
      sql += ';';
      const countResults = await mysqlQuest.query(sql);

      // 查询 Twitter 信息

      // Twitter 任务 查询用户信息
      const screenNameArr = results.map((i: any) => i.type === 0 && i.twitter_id);
      const screenNameStr = screenNameArr.join(',');

      const usersTwitter = await this.service.twitter.usersLookup(screenNameStr);
      // console.log('usersTwitter', usersTwitter);

      results.forEach((i: any) => {
        if (i.type === 0) { // Twitter 任务 查询用户信息
          i = Object.assign(i, usersTwitter[i.twitter_id]);
        }
      });

      // 没有登陆不查询 Twitter 关注信息 直接返回
      if (!id) {
        return {
          count: countResults[0].count,
          list: results,
        };
      }

      // 当前登陆用户是否关注任务的twitter用户

      // 查询当前账户绑定的twitter
      const sqlCurrentUserTwitter = 'SELECT u.id, ua.uid, ua.account FROM users u LEFT JOIN user_accounts ua ON u.id = ua.uid WHERE u.id = ? AND ua.platform = \'twitter\';';
      const currentUserTwitter = await mysqlMatataki.query(sqlCurrentUserTwitter, [ id ]);
      // console.log('currentUserTwitter', currentUserTwitter);

      // 查询 Twitter 关系   TIPS: 没有找到批量查询的接口 只能一个一个去查询了....
      const relationship = async (source_screen_name: string, target: any[]) => {

        // a,b
        const argumentsArr: string[] = target.map((i: any) => `${source_screen_name},${i.screen_name}`);
        // 去重处理
        const argumentsArrDedupe: string[] = [ ...new Set(argumentsArr) ];
        // 筛选掉查询自己的
        const argumentsArrDedupeFilter: string[] = argumentsArrDedupe.filter(i => {
          const arr = i.split(',');
          return arr[0] !== arr[1];
        });
        console.log('argumentsArr', argumentsArrDedupeFilter);

        // 准备查询语句
        const promiseArr: any[] = [];
        argumentsArrDedupeFilter.forEach((i: any) => {
          promiseArr.push(ctx.service.twitter.friendshipsShow(source_screen_name, (i.split(','))[1])); // a,b
        });

        // 开始查询twitter关系结果
        const result: friendshipsProps[] = await Promise.all(promiseArr);
        // console.log('result', result);

        // 处理关系结果格式 ===> [key: target_screen_name]: {}
        const relationshipList = {};
        result.forEach((i: friendshipsProps) => {
          // 处理 empty object
          if (!isEmpty(i)) {
            const screen_name: any = i.relationship.target.screen_name;
            if (!relationshipList[screen_name]) {
              relationshipList[screen_name] = {};
            }
            relationshipList[screen_name] = i;
          }
        });
        console.log('relationshipList', relationshipList);

        // 循环target 根据 screen_name 匹配 relationshipList 的结果
        target.forEach((i: any, idx: number) => {
          const screen_name = i.screen_name;
          if (relationshipList[screen_name]) {
            target[idx].following = relationshipList[screen_name].relationship.source.following;
          } else {
            target[idx].following = false; // 默认参数，自己的关注状态
          }
        });

      };

      // 绑定了 Twitter
      if (currentUserTwitter.length) {
        await relationship(currentUserTwitter[0].account, results); // 传递 results 引用
      }

      return {
        count: countResults[0].count,
        list: results,
      };
    } catch (e) {
      this.logger.error('get quest error: ', e);
      return {
        count: 0,
        list: [],
      };
    }
  }
  public async receive(qid: number) {
    try {
      this.logger.info('receive', new Date());

      const { ctx } = this;
      // 获取用户 uid
      const { id } = ctx.user;

      // 获取任务 type
      const mysqlQuest = this.app.mysql.get('quest');

      const resultQuest = await mysqlQuest.get('quests', { id: qid });
      console.log('resultQuest', resultQuest);

      // 发送奖励.....

      // 插入数据
      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      await mysqlQuest.insert('quests_logs', {
        qid,
        uid: id,
        type: resultQuest.type,
        create_time: time,
      });

      return {
        code: 0,
      };
    } catch (e) {
      this.logger.error('receive error: ', e);
      return {
        code: -1,
        message: `receive error${e}`,
      };
    }
  }
  public async getNftId({ id }: tokenIdInterface) {
    try {
      this.logger.info('get nfts', new Date());
      const results = await this.app.mysql.select('nfts', {
        where: { tokenId: id },
        columns: [ 'tokenId', 'account', 'transactionHash', 'logo', 'name', 'externalLink', 'description', 'create_time' ],
      });
      return {
        code: 0,
        data: results[0] || {},
      };
    } catch (e) {
      this.logger.error('get nft id error: ', id, e);
      return {
        code: -1,
        message: `get nft id error ${id} ${e}`,
      };
    }
  }
}
