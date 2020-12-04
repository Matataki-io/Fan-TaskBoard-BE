import { Service } from 'egg';
import * as moment from 'moment';
import { questInterface } from '../../typings/index';

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

  public async getQuest({ page, size, account }: myNftInterface) {
    try {
      this.logger.info('get quest', new Date());

      let data: any = {
        columns: [ 'id', 'uid', 'type', 'twitter_id', 'token_id', 'reward_people', 'reward_price', 'create_time' ],
        orders: [[ 'id', 'desc' ], [ 'create_time', 'desc' ]], // 排序方式
        limit: Number(size), // 返回数据量
        offset: (page - 1) * size, // 数据偏移量
      };

      if (account) {
        data = { ...data, where: { account } };
      }

      const mysqlQuest = this.app.mysql.get('quest');
      const results = await mysqlQuest.select('quests', data);

      // 查询用户数据
      const mysqlMatataki = this.app.mysql.get('matataki');

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
