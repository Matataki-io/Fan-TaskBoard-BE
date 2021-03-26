import { Service } from 'egg';
import * as moment from 'moment';
import { questInterface, questKeyInterface, UpdateQuestProps } from '../../typings/index';
import { isEmpty } from 'lodash';
import BigNumber from 'bignumber.js';
import { transformForOneArray } from '../utils/index';
import * as random from 'string-random';
import { decimalProcessing } from '../utils/index';

interface paginationInterface {
  page: number,
  size: number,
}

interface getQuestProps extends paginationInterface {
  account?: string
  sort?: string
  token?: string | number
  type?: string
  filter?: string
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

const TwitterFollowersMap = new Map();

export default class Quest extends Service {

  private checkReward({ reward_people, reward_price }) {
    if (!(Number.isInteger(Number(reward_people)) && Number(reward_people) > 0)) {
      throw new Error('奖励人数必须为整数并大于0');
    }
    if (!(Number(reward_price) > 0)) {
      throw new Error('奖励金额必须大于0');
    }
  }

  // 计算获取奖励
  private processReward(price: string, people: string) {
    const BN = BigNumber.clone();
    // BN.config({ DECIMAL_PLACES: 3 });
    const single = new BN(new BN(Number(price))).dividedBy(Number(people));
    return decimalProcessing(single.toString());
  }

  // 创建任务转账
  private async CreateQuestTransfer(type, reward_price, token_id): Promise<string> {
    const { ctx } = this;
    const token = ctx.cookies.get('access-token');
    // 转账
    const resultUserTransfer = await ctx.curl(`${this.config.mtkApi}/minetoken/transfer`, {
      dataType: 'json',
      method: 'POST',
      // contentType: 'json',
      headers: {
        'x-access-token': token,
      },
      timeout: 30 * 1000,
      data: {
        amount: Number(reward_price) * 10000,
        memo: `Matataki Quest 任务创建奖池 - ${Number(type) === 0 ? 'Twitter 关注任务' : '自定义任务'}`,
        to: ctx.userQuest.id,
        tokenId: token_id,
      },
    });
    this.logger.info('CreateQuest resultUserTransfer', resultUserTransfer, token);
    if (
      resultUserTransfer.status === 200 &&
      resultUserTransfer.data.code === 0 &&
      resultUserTransfer.data.data &&
      resultUserTransfer.data.data.tx_hash
    ) {
      return resultUserTransfer.data.data.tx_hash;
    }
    throw new Error('支付失败');
  }
  // 创建Twitter任务
  public async CreateQuestTwitter({ type, twitter_id, token_id, reward_people, reward_price }: questInterface) :Promise<any> {
    this.logger.info('type, twitter_id, token_id, reward_people, reward_price', type, twitter_id, token_id, reward_people, reward_price);
    this.logger.info('create quest twitter submit', new Date());
    const { ctx } = this;
    const { id } = ctx.user;

    try {

      // 判断参数
      const questData = { twitter_id, token_id, reward_people, reward_price };
      for (const key in questData) {
        if (!String(questData[key]).trim()) {
          throw new Error(`${key} 不能为空`);
        }
      }

      if (!(Number.isInteger(Number(questData.reward_people)) && Number(questData.reward_people) > 0)) {
        throw new Error('奖励人数必须为整数并大于0');
      }
      if (!(Number(questData.reward_price) > 0)) {
        throw new Error('奖励金额必须大于0');
      }

      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      const hash = await this.CreateQuestTransfer(type, reward_price, token_id);
      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      const data: questInterface = {
        uid: id,
        type,
        twitter_id,
        token_id,
        reward_people,
        reward_price,
        hash,
        end: 0,
        create_time: time,
        update_time: time,
      };

      const mysqlQuest = this.app.mysql.get('quest');
      const result = await mysqlQuest.insert('quests', data);
      const insertSuccess = result.affectedRows === 1;

      this.logger.info('result', result);

      if (insertSuccess) {
        return {
          code: 0,
          data: result.insertId,
        };
      }
      throw new Error(`insertSuccess fail ${result}`);

    } catch (e) {
      this.logger.error('create quest twitter error: ', e);
      return {
        code: -1,
        message: `create quest twitter error ${e}`,
      };
    }
  }
  // 创建自定义任务
  public async CreateQuestCustomTask({ type, title, content, token_id, reward_people, reward_price }: questInterface) :Promise<any> {
    this.logger.info('type, title, content, token_id, reward_people, reward_price', type, title, content, token_id, reward_people, reward_price);
    this.logger.info('create quest custom task submit', new Date());
    const { ctx } = this;
    const { id } = ctx.user;

    try {
      // 判断参数
      const questData = { title, content, token_id, reward_people, reward_price };
      for (const key in questData) {
        if (!String(questData[key]).trim()) {
          throw new Error(`${key} 不能为空`);
        }
      }

      if (!(Number.isInteger(Number(questData.reward_people)) && Number(questData.reward_people) > 0)) {
        throw new Error('奖励人数必须为整数并大于0');
      }
      if (!(Number(questData.reward_price) > 0)) {
        throw new Error('奖励金额必须大于0');
      }

      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      // const hash = await this.CreateQuestTransfer(type, reward_price, token_id);
      const hash = 'hash';
      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      const data: questInterface = {
        uid: id,
        type,
        title,
        content,
        token_id,
        reward_people,
        reward_price,
        hash,
        end: 0,
        create_time: time,
        update_time: time,
      };

      const mysqlQuest = this.app.mysql.get('quest');
      const result = await mysqlQuest.insert('quests', data);
      const insertSuccess = result.affectedRows === 1;

      this.logger.info('result', result);

      if (insertSuccess) {
        return {
          code: 0,
          data: result.insertId,
        };
      }
      throw new Error(`insertSuccess fail ${result}`);

    } catch (e) {
      this.logger.error('create quest custom task error: ', e);
      return {
        code: -1,
        message: `create quest custom task error ${e}`,
      };
    }
  }
  // 创建key任务
  public async CreateQuestKey({ type, title, content, key, token_id, reward_people, reward_price }: questInterface) :Promise<any> {
    this.logger.info('CreateQuestKey submit', new Date());
    const { ctx } = this;
    const { id } = ctx.user;

    try {
      // 判断参数
      const questData = { title, content, token_id, reward_people, reward_price };
      for (const key in questData) {
        if (!String(questData[key]).trim()) {
          throw new Error(`${key} 不能为空`);
        }
      }

      if (!(Number.isInteger(Number(questData.reward_people)) && Number(questData.reward_people) > 0)) {
        throw new Error('奖励人数必须为整数并大于0');
      }
      if (!(Number(questData.reward_price) > 0)) {
        throw new Error('奖励金额必须大于0');
      }

      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      // const hash = await this.CreateQuestTransfer(type, reward_price, token_id);
      const hash = 'hash';
      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      const randomKey = random(32, { numbers: false });
      const data: questKeyInterface = {
        uid: id,
        type,
        title,
        content,
        key: key || randomKey,
        token_id,
        reward_people,
        reward_price,
        hash,
        end: 0,
        create_time: time,
        update_time: time,
      };

      const mysqlQuest = this.app.mysql.get('quest');
      const result = await mysqlQuest.insert('quests', data);
      const insertSuccess = result.affectedRows === 1;

      this.logger.info('result', result);

      if (insertSuccess) {
        return {
          code: 0,
          data: result.insertId,
        };
      }
      throw new Error(`insertSuccess fail ${result}`);

    } catch (e) {
      this.logger.error('create quest key error: ', e);
      return {
        code: -1,
        message: `create quest key error ${e}`,
      };
    }
  }
  // 创建转推任务
  public async CreateQuestRetweet({ type, twitter_status, twitter_status_url, token_id, reward_people, reward_price }: questInterface) :Promise<any> {
    this.logger.info('CreateQuestRetweet submit', new Date());
    const { ctx } = this;
    const { id } = ctx.user;

    try {
      // 判断参数
      const questData = { twitter_status, token_id, reward_people, reward_price };
      for (const key in questData) {
        if (!String(questData[key]).trim()) {
          throw new Error(`${key} 不能为空`);
        }
      }

      this.checkReward({
        reward_people: questData.reward_people,
        reward_price: questData.reward_price,
      });

      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      // const hash = await this.CreateQuestTransfer(type, reward_price, token_id);
      const hash = 'hash';
      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      const data: questKeyInterface = {
        uid: id,
        type,
        twitter_status,
        twitter_status_url,
        token_id,
        reward_people,
        reward_price,
        hash,
        end: 0,
        create_time: time,
        update_time: time,
      };

      const mysqlQuest = this.app.mysql.get('quest');
      const result = await mysqlQuest.insert('quests', data);
      const insertSuccess = result.affectedRows === 1;

      this.logger.info('result', result);

      if (insertSuccess) {
        return {
          code: 0,
          data: result.insertId,
        };
      }
      throw new Error(`insertSuccess fail ${result}`);

    } catch (e) {
      this.logger.error('create quest key error: ', e);
      return {
        code: -1,
        message: `create quest key error ${e}`,
      };
    }
  }
  // 更新任务
  public async UpdateQuest({ qid, type, title, content, key }: UpdateQuestProps) {
    this.logger.info('UpdateQuest', new Date());
    this.logger.info('UpdateQuest', qid, type, title, content, key);

    const { logger, ctx } = this;
    const { id } = ctx.user;
    const mysqlQuest = this.app.mysql.get('quest');

    try {

      if (String(type) === '0' || String(type) === '1') {
        if (title && content) {
          //
        } else {
          throw new Error('标题或内容不能为空');
        }
      } else if (String(type) === '2') {
        if (title && content && key) {
          //
        } else {
          throw new Error('标题、内容或口令不能为空');
        }
      }

      // 判断任务是否存在
      const resultQuest = await mysqlQuest.get('quests', {
        id: qid,
      });
      if (!resultQuest) {
        throw new Error('没有任务信息');
      }
      logger.info('resultQuest', resultQuest);

      // 判断是否自己
      if (String(id) !== String(resultQuest.uid)) {
        throw new Error('只能修改自己发布的任务');
      }

      // 根据 type 生成 Row
      const generateRow = (type: string) => {
        if (type === '0' || type === '1') {
          return {
            id: qid,
            title,
            content,
          };
        } else if (type === '2') {
          return {
            id: qid,
            title,
            content,
            key,
          };
        }
        throw new Error('任务类型错误');
      };

      let row = Object.create(null);
      row = generateRow(String(type));

      // 更新信息
      const resultUpdateQuest = await mysqlQuest.update('quests', row); // 更新 posts 表中的记录
      logger.info('resultUpdateQuest', resultUpdateQuest);

      // 判断更新成功
      const updateQuestSuccess = resultUpdateQuest.affectedRows === 1;
      if (updateQuestSuccess) {
        return {
          code: 0,
        };
      }
      throw new Error(`任务更新失败${resultUpdateQuest}`);
    } catch (error) {
      logger.error('UpdateQuest error: ', error);
      return {
        code: -1,
        message: error.toString(),
      };
    }
  }

  public async getQuest({ page, size, sort, token, type, filter }: getQuestProps): Promise<questsListProps> {
    try {
      this.logger.info('get quest', new Date());

      const { ctx } = this;
      const { id } = ctx.user;

      // init mysql
      const mysqlQuest = this.app.mysql.get('quest');
      const mysqlMatataki = this.app.mysql.get('matataki');

      // 处理排序
      let orders = '';
      if (sort === 'new') {
        orders = 'create_time DESC';
      } else if (sort === 'most') {
        orders = 'reward_price+0 DESC';
      } else if (sort === 'default') {
        orders = '\`end\` = 0 DESC, id DESC';
      } else {
        orders = 'create_time DESC';
      }

      // 处理 token 筛选
      let whereToken = '';
      if (token) {
        whereToken = `WHERE token_id = ${token}`;
      }


      // 查询领取记录做计算
      const resultsQuestsLogs = await mysqlQuest.query('SELECT qid FROM quests_logs;');
      this.logger.info('resultsQuestsLogs', resultsQuestsLogs);

      // [ {qid: x}, {} ] ===> { x: count, y: count }
      const questsLogs = {};
      resultsQuestsLogs.forEach(i => {
        if (!questsLogs[i.qid]) {
          questsLogs[i.qid] = 0;
        }
        questsLogs[i.qid] = questsLogs[i.qid] += 1;
      });
      this.logger.info('questsLogs', questsLogs);

      // 处理 filter 筛选 需要判断 token 筛选

      // 查询已经完成的任务
      const completedQuests = async () => {
        let sql = '';
        for (const key in questsLogs) {
          sql += `SELECT * FROM quests WHERE id = ${key} AND ${questsLogs[key]} >= reward_people;`;
        }
        const result = await mysqlQuest.query(sql);
        const resultFilter = result.filter(i => !isEmpty(i));
        return transformForOneArray(resultFilter);
      };

      // generate completed sql
      const completedResult = async () => {
        const res = await completedQuests();
        let sqlWhere = '';
        res.forEach((i, idx) => {
          sqlWhere += `id = ${i.id}`;
          if (idx !== res.length - 1) {
            sqlWhere += ' OR ';
          }
        });

        return sqlWhere;
      };

      // generate undone sql
      const undoneResult = async () => {
        const res = await completedQuests();
        let sqlWhere = '';
        res.forEach((i, idx) => {
          sqlWhere += `id <> ${i.id}`;
          if (idx !== res.length - 1) {
            sqlWhere += ' AND ';
          }
        });

        return sqlWhere;
      };

      // generate received sql
      const receivedResult = async id => {
        const sql = `
        SELECT DISTINCT(q.id)
        FROM quests q LEFT JOIN quests_logs ql ON q.id = ql.qid
        WHERE ql.uid = ${id};`;
        const res = await mysqlQuest.query(sql);
        let sqlWhere = '';
        res.forEach((i, idx) => {
          sqlWhere += `id = ${i.id}`;
          if (idx !== res.length - 1) {
            sqlWhere += ' OR ';
          }
        });

        return sqlWhere;
      };

      // handle type query sql
      const handleTypeQuery = (sql: string): string => {
        let _sql: string = sql;
        if (type === 'twitter') {
          _sql += ' AND type = 0';
        } else if (type === 'customtask') {
          _sql += ' AND type = 1';
        } else if (type === 'key') {
          _sql += ' AND type = 2';
        } else if (type === 'twitterRetweet') {
          _sql += ' AND type = 3';
        }
        return _sql;
      };

      // 查询 count
      let sql = 'SELECT COUNT(1) as count from quests';
      // 处理筛选
      if (token) {
        sql += ` WHERE token_id = ${token}`;
      }

      // all
      // undone
      // completed
      // received
      // created
      if (filter === 'all') {
        // 不做 filter 处理

        let _sql = '';
        if (type === 'twitter') {
          _sql += 'type = 0';
        } else if (type === 'customtask') {
          _sql += 'type = 1';
        } else if (type === 'key') {
          _sql += 'type = 2';
        } else if (type === 'twitterRetweet') {
          _sql += 'type = 3';
        }

        if (_sql) {
          if (whereToken) {
            whereToken += ` AND ${_sql}`;
          } else {
            whereToken += `WHERE ${_sql}`;
          }

          if (token) {
            sql += ` AND ${_sql}`;
          } else {
            sql += ` WHERE ${_sql}`;
          }
        }
      } else if (filter === 'undone') {

        let _sql = await undoneResult();
        _sql = handleTypeQuery(`(${_sql})`);

        if (whereToken) {
          whereToken += ` AND ${_sql}`;
        } else {
          whereToken += `WHERE ${_sql}`;
        }

        if (token) {
          sql += ` AND ${_sql}`;
        } else {
          sql += ` WHERE ${_sql}`;
        }

      } else if (filter === 'completed') {

        let _sql = await completedResult();
        _sql = handleTypeQuery(`(${_sql})`);

        if (whereToken) {
          whereToken += ` AND ${_sql}`;
        } else {
          whereToken += `WHERE ${_sql}`;
        }

        if (token) {
          sql += ` AND ${_sql}`;
        } else {
          sql += ` WHERE ${_sql}`;
        }

      } else if (filter === 'received' && id) {

        let _sql = await receivedResult(id);
        _sql = handleTypeQuery(`(${_sql})`);

        if (whereToken) {
          whereToken += ` AND ${_sql}`;
        } else {
          whereToken += `WHERE ${_sql}`;
        }

        if (token) {
          sql += ` AND ${_sql}`;
        } else {
          sql += ` WHERE ${_sql}`;
        }

      } else if (filter === 'created' && id) {
        let _sql = `uid = ${id}`;
        _sql = handleTypeQuery(_sql);

        if (whereToken) {
          whereToken += ` AND ${_sql}`;
        } else {
          whereToken += `WHERE ${_sql}`;
        }

        if (token) {
          sql += ` AND ${_sql}`;
        } else {
          sql += ` WHERE ${_sql}`;
        }
      }

      sql += ';';
      const countResults = await mysqlQuest.query(sql);

      // 查询任务
      // [{}] [{}, {}]
      const sqlQuests = `SELECT id, uid, type, title, twitter_id, twitter_status, twitter_status_url, token_id, reward_people, reward_price, end, create_time FROM quests ${whereToken} ORDER BY ${orders} LIMIT ?, ?;`;
      const results = await mysqlQuest.query(sqlQuests, [ (page - 1) * size, Number(size) ]);
      this.logger.info('results', results);
      if (!results.length) {
        return {
          count: 0,
          list: [],
        };
      }

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
        results[0].avatar = resultsMatatakiUser[0].avatar || '';
        results[0].symbol = resultsMatatakiToken[0].symbol || '';
      } else {
        results.forEach((i: any, idx: number) => {
          i.username = resultsMatatakiUser[idx][0].nickname || resultsMatatakiUser[idx][0].username || '';
          i.avatar = resultsMatatakiUser[idx][0].avatar || '';
          i.symbol = resultsMatatakiToken[idx][0].symbol || '';
        });
      }

      // 查询已经领取的记录 计算剩余份数
      let sqlQuestsLogsCounts = '';
      results.forEach((i: any) => {
        sqlQuestsLogsCounts += `SELECT COUNT(1) as count FROM quests_logs WHERE qid = ${i.id};`;
      });
      const resultQuestsLogsCount = await mysqlQuest.query(sqlQuestsLogsCounts);
      // this.logger.info('resultQuestsLogsCount', resultQuestsLogsCount);

      if (results.length <= 1) {
        results[0].received = resultQuestsLogsCount[0].count;
      } else {
        resultQuestsLogsCount.forEach((i: any, idx: number) => {
          results[idx].received = i[0].count;
        });
      }


      // 查询 Twitter 信息
      // Twitter 任务 查询用户信息
      const screenNameArr = results.filter((i: any) => Number(i.type) === 0 && i.twitter_id);
      const screenNameArrs = screenNameArr.map((i: any) => i.twitter_id);
      const screenNameStr = screenNameArrs.join(',');

      this.logger.info('screenNameStr', screenNameStr);

      const usersTwitterResList: {} = {};
      const usersTwitterRes = await this.service.twitter.usersLookup(screenNameStr);
      if (usersTwitterRes.code === 0) {
        // 因为返回的搜索结果会去重 所以处理一下数据格式 screen_name: {}
        usersTwitterRes.data.forEach((i: any) => {
          if (!usersTwitterResList[i.screen_name]) {
            usersTwitterResList[i.screen_name] = {};
          }
          usersTwitterResList[i.screen_name] = {
            name: i.name,
            screen_name: i.screen_name,
            profile_image_url_https: i.profile_image_url_https,
          };
        });
      }
      const usersTwitter = Object.assign({}, usersTwitterResList);
      // this.logger.info('usersTwitter', usersTwitter);
      results.forEach((i: any) => {
        if (Number(i.type) === 0 && usersTwitter[i.twitter_id]) { // Twitter 任务 查询用户信息
          i = Object.assign(i, usersTwitter[i.twitter_id]);
        }
      });

      // 没有登陆不查询 Twitter 关注信息 领取信息 直接返回
      if (!id) {
        // 补充默认参数
        results.forEach((i: any) => {
          i.receive = false;
          i.following = false;
          i.apply = false;
        });

        return {
          count: countResults[0].count,
          list: results,
        };
      }


      // 查询是否已经领取
      let sqlQuestsLogs = '';
      results.forEach((i: any) => {
        sqlQuestsLogs += `SELECT * FROM quests_logs WHERE qid = ${i.id} AND uid = ${id} AND type = ${i.type};`;
      });
      const resultQuestsLogs = await mysqlQuest.query(sqlQuestsLogs);
      this.logger.info('resultQuestsLogs', resultQuestsLogs);

      if (!resultQuestsLogs.length) { // 没有领取记录
        results.forEach((i: any) => {
          i.receive = false;
        });
      } else if (resultQuestsLogs.length <= 1) { // 一条记录
        results[0].receive = true;
      } else { // 多条记录
        resultQuestsLogs.forEach((i: any, idx: number) => {
          if (i.length) { // 已经领取
            results[idx].receive = true;
          } else {
            results[idx].receive = false;
          }
        });
      }

      // 查询是否已经申请
      let sqlQuestsLogsCustomtask = '';
      results.forEach((i: any) => {
        sqlQuestsLogsCustomtask += `SELECT * FROM quests_logs_customtask WHERE qid = ${i.id} AND uid = ${id};`;
      });
      const resultQuestsLogsCustomtask = await mysqlQuest.query(sqlQuestsLogsCustomtask);
      this.logger.info('resultQuestsLogsCustomtask', resultQuestsLogsCustomtask);

      if (!resultQuestsLogsCustomtask.length) { // 没有领取记录
        results.forEach((i: any) => {
          i.apply = false;
        });
      } else if (resultQuestsLogsCustomtask.length <= 1) { // 一条记录
        results[0].apply = true;
      } else { // 多条记录
        resultQuestsLogsCustomtask.forEach((i: any, idx: number) => {
          if (i.length) { // 已经领取
            results[idx].apply = true;
          } else {
            results[idx].apply = false;
          }
        });
      }


      // 当前登陆用户是否关注任务的twitter用户

      // 查询当前账户绑定的twitter
      const sqlCurrentUserTwitter = 'SELECT u.id, ua.uid, ua.account FROM users u LEFT JOIN user_accounts ua ON u.id = ua.uid WHERE u.id = ? AND ua.platform = \'twitter\';';
      const currentUserTwitter = await mysqlMatataki.query(sqlCurrentUserTwitter, [ id ]);
      this.logger.info('currentUserTwitter', currentUserTwitter);

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
        this.logger.info('argumentsArr', argumentsArrDedupeFilter);

        // 准备查询语句
        const promiseArr: any[] = [];
        argumentsArrDedupeFilter.forEach((i: any) => {
          promiseArr.push(ctx.service.twitter.friendshipsShow(source_screen_name, (i.split(','))[1])); // a,b
        });

        // 开始查询twitter关系结果
        const result = await Promise.all(promiseArr);
        this.logger.info('result', result);

        // 处理关系结果格式 ===> [key: target_screen_name]: {}
        const relationshipList = {};
        result.forEach((i: any) => {
          this.logger.info('friendshipsShow result i ', i);
          // 处理 empty object
          const next = i.code === 0 ? i.data : { };
          this.logger.info('friendshipsShow result next ', next);

          if (!isEmpty(next)) {
            const screen_name: any = next.relationship.target.screen_name;
            if (!relationshipList[screen_name]) {
              relationshipList[screen_name] = {};
            }
            relationshipList[screen_name] = next;
          }
        });
        this.logger.info('relationshipList', relationshipList);

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

      const handleTwitterFollowers = async (screen_name: string, target: any[]) => {

        // 1: 1分钟内请求使用内存的记录
        // 2: 请求列表
        // 3：请求失败使用内容记录
        // 4: 没有内存记录请求失败换另一个代替 最后都失败使用默认状态

        let resultFriendsList: any[] = [];
        const oldValue = TwitterFollowersMap.get(screen_name);

        const requestFriendsList = async () => {
          // 查询关注过的人的信息
          const resFriendsList: any = await this.service.twitter.friendsList(screen_name);
          if (resFriendsList.code === 0) {
            const list = resFriendsList.data.map(i => i.users);
            this.logger.info('resFriendsList map after', list);
            resultFriendsList = list.flat(1);
          }
          this.logger.info('resultFriendsList', resultFriendsList);
          // [ undefined ]
          if (!resultFriendsList.length && !resultFriendsList[0]) {
            this.logger.error('resultFriendsList empty', resultFriendsList);
            resultFriendsList = [];

            // 3：请求失败使用内容记录
            if (oldValue && oldValue.friendsList.length && oldValue.friendsList[0]) {
              resultFriendsList = oldValue.friendsList;
            } else {
              // 4: 没有内存记录请求失败换另一个代替 最后都失败使用默认状态
              this.logger.info('relationship results', results);
              if (results.length === -1) { // 故意的
                await relationship(screen_name, results); // 传递 results 引用
                // 暂时取消 twitter api error 之后 多个方法 耗时太长
              }
            }
          } else {
            // 写入Map
            const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
            const currentUserVal = {
              friendsList: resultFriendsList,
              lastTime: time,
            };
            TwitterFollowersMap.set(screen_name, currentUserVal);
            this.logger.info('TwitterFollowersMap', TwitterFollowersMap);
          }
        };

        // 如果内存中有数据
        if (oldValue) {
          const nowTime = moment().format('YYYY-MM-DD HH:mm:ss');
          const m = moment(nowTime).diff(moment(oldValue.lastTime), 'minutes');
          this.logger.info('diff', m);

          if (m <= 3 && oldValue.friendsList.length && oldValue.friendsList[0]) { // 3分钟内请求使用内存的记录
            resultFriendsList = oldValue.friendsList;
          } else { // 请求列表
            await requestFriendsList();
          }
        } else {
          await requestFriendsList();
        }

        // 开始处理数据
        for (let i = 0; i < target.length; i++) {
          // 只处理 Twitter关注任务
          if (Number(target[i].type) === 0) {
            const findData = resultFriendsList.find((j: any) => !isEmpty(j) && j.screen_name === target[i].twitter_id);
            if (!isEmpty(findData)) {
              target[i].following = true;
            } else {
              // 如果是关注自己
              if (target[i].twitter_id === screen_name) {
                target[i].following = true;
              } else {
                target[i].following = false;
              }
            }
          } else {
            target[i].following = false;
          }
        }
      };

      // 绑定了 Twitter
      if (currentUserTwitter.length) {
        this.logger.info('TwitterFollowersMap', TwitterFollowersMap);
        // 查询Twitter关系
        await handleTwitterFollowers(currentUserTwitter[0].account, results);
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
  // 获取任务详情
  public async getQuestDetail({ qid }) {
    const { logger, ctx } = this;
    const { id } = ctx.user;

    logger.info('getQuestDetail', new Date());

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const mysqlMatataki = this.app.mysql.get('matataki');

    try {
      // 获取任务信息
      const sqlQuest = 'SELECT id, uid, type, twitter_id, title, content, twitter_status, twitter_status_url, token_id, reward_people, reward_price, end, create_time FROM quests WHERE id = ?;';
      const resultQuest = await mysqlQuest.query(sqlQuest, [ qid ]);
      this.logger.info('resultQuest', resultQuest);

      if (!resultQuest.length) {
        throw new Error('没有任务信息');
      }

      const result = resultQuest[0];

      // 获取用户信息
      const sqlUsers = 'SELECT id, username, nickname, avatar FROM users WHERE id = ?;';
      const resultUser = await mysqlMatataki.query(sqlUsers, [ result.uid ]);
      this.logger.info('resultUser', resultUser);

      result.username = resultUser[0].nickname || resultUser[0].username || '';
      result.avatar = resultUser[0].avatar;

      // 获取token信息
      const sqlTokens = 'SELECT id, name, symbol, decimals, logo FROM minetokens WHERE id = ?;';
      const resultTokens = await mysqlMatataki.query(sqlTokens, [ result.token_id ]);
      this.logger.info('resultTokens', resultTokens);

      result.name = resultTokens[0].name;
      result.symbol = resultTokens[0].symbol;
      result.decimals = resultTokens[0].decimals;
      result.logo = resultTokens[0].logo;

      // 获取已经领取的数量
      const sqlQuestsLogsCounts = 'SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;';
      const resultQuestsLogsCounts = await mysqlQuest.query(sqlQuestsLogsCounts, [ result.id ]);
      this.logger.info('resultQuestsLogsCounts', resultQuestsLogsCounts);

      result.received = resultQuestsLogsCounts[0].count;

      // 查询是否领取
      if (id) {
        const sqlQuestsLogs = 'SELECT * FROM quests_logs WHERE qid = ? AND uid = ? AND type = ?;';
        const resultQuestsLogs = await mysqlQuest.query(sqlQuestsLogs, [ qid, id, result.type ]);
        this.logger.info('resultQuestsLogs', resultQuestsLogs);

        // 自定义任务是否申请判断
        if (Number(result.type) === 1) {
          const sqlQuestsLogsCustomtask = 'SELECT * FROM quests_logs_customtask WHERE qid = ? AND uid = ?;';
          const resultQuestsLogsCustomtask = await mysqlQuest.query(sqlQuestsLogsCustomtask, [ qid, id ]);
          this.logger.info('resultQuestsLogsCustomtask', resultQuestsLogsCustomtask);

          if (resultQuestsLogsCustomtask.length) {
            result.apply = true;
          } else {
            result.apply = false;
          }
        }


        if (resultQuestsLogs.length) {
          result.receive = true;
        } else {
          result.receive = false;
        }

        // key 任务， 自己浏览会显示
        if (Number(result.type) === 2 && (Number(result.uid) === Number(id))) {
          const sql = 'SELECT `key` FROM quests WHERE id = ?;';
          const resultQuestsKey = await mysqlQuest.query(sql, [ result.id ]);
          this.logger.info('resultQuestsKey', resultQuestsKey);
          result.key = resultQuestsKey[0].key;
        }

      } else {
        result.receive = false;

        // 自定义任务是否申请判断
        if (Number(result.type) === 1) {
          result.apply = false;
        }
      }

      // twitter 关注任务
      if (result.type === 0) {
        // 获取Twitter信息
        const resultTwitterUserResList = {};
        const resultTwitterUserRes = await this.service.twitter.usersLookup(String(result.twitter_id));

        if (resultTwitterUserRes.code === 0) {
          // 因为返回的搜索结果会去重 所以处理一下数据格式 screen_name: {}
          resultTwitterUserRes.data.forEach((i: any) => {
            if (!resultTwitterUserResList[i.screen_name]) {
              resultTwitterUserResList[i.screen_name] = {};
            }
            resultTwitterUserResList[i.screen_name] = {
              name: i.name,
              screen_name: i.screen_name,
              profile_image_url_https: i.profile_image_url_https,
            };
          });
        }

        const resultTwitterUser = Object.assign({}, resultTwitterUserResList);
        this.logger.info('resultTwitterUser', resultTwitterUser);

        result.twitter_name = resultTwitterUser[result.twitter_id].name;
        result.twitter_screen_name = resultTwitterUser[result.twitter_id].screen_name;
        result.twitter_profile_image_url_https = resultTwitterUser[result.twitter_id].profile_image_url_https;
      } else if (result.type === 1) {
        //
      } else if (result.type === 2) {
        //
      } else if (result.type === 3) {
        //
      }


      return {
        code: 0,
        data: result,
      };
    } catch (e) {
      this.logger.error('getQuestDetail error: ', e);
      return {
        code: -1,
        message: e.toString(),
      };
    }
  }

  public async getQuestDetailList({ qid }) {
    const { logger } = this;
    logger.info('getQuestDetailList', new Date());

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const mysqlMatataki = this.app.mysql.get('matataki');

    try {

      const sql = 'SELECT * FROM quests WHERE id = ? LIMIT 0, 1;';
      const [ resultQuest ] = await mysqlQuest.query(sql, [ qid ]);
      this.logger.info('resultQuest', resultQuest);

      // 查询某个任务领取记录列表
      const sqlQueststLogs = 'SELECT ql.id, ql.qid, ql.uid, ql.type, ql.create_time, qtl.token_id, qtl.amount FROM quests_logs ql LEFT JOIN quests_transfer_logs qtl ON qtl.qlogid = ql.id WHERE ql.qid = ? AND ql.type = ?;';
      const result = await mysqlQuest.query(sqlQueststLogs, [ qid, resultQuest.type ]);
      this.logger.info('result', result, qid, resultQuest.type);

      // empty return
      if (!result.length) {
        return {
          code: 0,
          data: {
            count: 0,
            list: [],
          },
        };
      }

      // 补全用户数据和token数据
      let sqlUsers = '';
      result.forEach(i => {
        sqlUsers += `SELECT id, username, nickname, avatar FROM users WHERE id = ${i.uid};`;
      });
      const resultUsersArray = await mysqlMatataki.query(sqlUsers);
      const resultUsers = transformForOneArray(resultUsersArray);
      this.logger.info('resultUsers', resultUsers);

      // 同一个token 取第一个即可
      const sqlTokens = `SELECT id, name, symbol, decimals, logo FROM minetokens WHERE id = ${result[0].token_id};`;
      const resultTokens = await mysqlMatataki.query(sqlTokens);
      this.logger.info('resultTokens', resultTokens);

      result.forEach((i, idx) => {
        // 用户信息
        i.username = resultUsers[idx].nickname || resultUsers[idx].username || '';
        i.avatar = resultUsers[idx].avatar;

        // token 信息
        i.name = resultTokens[0].name;
        i.symbol = resultTokens[0].symbol;
        i.decimals = resultTokens[0].decimals;
        i.logo = resultTokens[0].logo;
      });

      // 统计count
      const sqlCounts = 'SELECT COUNT(1) AS count FROM quests_logs WHERE qid = ? AND type = ?;';
      const resultCounts = await mysqlQuest.query(sqlCounts, [ qid, resultQuest.type ]);
      this.logger.info('resultCounts', resultCounts);

      return {
        code: 0,
        data: {
          count: resultCounts[0].count,
          list: result,
        },
      };
    } catch (e) {
      this.logger.error('getQuestDetailList error: ', e);
      return {
        code: -1,
        message: e.toString(),
      };
    }
  }

  public async getQuestDetailApplyList({ qid }) {
    const { logger, ctx } = this;
    const { id } = ctx.user;

    logger.info('getQuestDetailApplyList', new Date());

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const mysqlMatataki = this.app.mysql.get('matataki');

    try {
      const sql = 'SELECT * FROM quests WHERE id = ? LIMIT 0, 1;';
      const [ resultQuest ] = await mysqlQuest.query(sql, [ qid ]);
      this.logger.info('resultQuest', resultQuest);

      if (String(resultQuest.type) !== '1') {
        throw new Error('暂时只支持查询自定义任务');
      }

      if (String(resultQuest.uid) !== String(id)) {
        throw new Error('只能自己查询申请列表');
      }

      // 查询某个任务领取记录列表
      const sqlQueststLogsCustomtask = 'SELECT qid, uid, remark, create_time FROM quests_logs_customtask WHERE qid = ?;';
      const result = await mysqlQuest.query(sqlQueststLogsCustomtask, [ qid ]);
      this.logger.info('result', result);

      // empty return
      if (!result.length) {
        return {
          code: 0,
          data: {
            count: 0,
            list: [],
          },
        };
      }

      // 补全用户数据
      let sqlUsers = '';
      result.forEach(i => {
        sqlUsers += `SELECT id, username, nickname, avatar FROM users WHERE id = ${i.uid};`;
      });
      const resultUsersArray = await mysqlMatataki.query(sqlUsers);
      const resultUsers = transformForOneArray(resultUsersArray);
      this.logger.info('resultUsers', resultUsers);

      result.forEach((i, idx) => {
        // 用户信息
        i.username = resultUsers[idx].nickname || resultUsers[idx].username || '';
        i.avatar = resultUsers[idx].avatar;
      });

      // 统计count
      const sqlCounts = 'SELECT COUNT(1) AS count FROM quests_logs_customtask WHERE qid = ?;';
      const resultCounts = await mysqlQuest.query(sqlCounts, [ qid ]);
      this.logger.info('resultCounts', resultCounts);

      return {
        code: 0,
        data: {
          count: resultCounts[0].count,
          list: result,
        },
      };
    } catch (e) {
      this.logger.error('getQuestDetailApplyList error: ', e);
      return {
        code: -1,
        message: e.toString(),
      };
    }
  }

  // 领取Twitter任务
  public async receiveTwitter(qid: string|number) {
    this.logger.info('receiveTwitter', new Date());

    const { ctx } = this;
    // 获取用户 uid
    const { id } = ctx.user;


    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const mysqlMatataki = this.app.mysql.get('matataki');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {

      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      // 查询任务列表 获取任务 type
      const resultQuest = await connQuest.get('quests', { id: qid });
      this.logger.info('resultQuest', resultQuest);
      if (!resultQuest) {
        throw new Error('任务不存在');
      }

      // 任务已结束
      if (Number(resultQuest.end) === 1) {
        throw new Error('任务已结束');
      }

      // 不能领取自己发布的任务
      if (String(resultQuest.uid) === String(id)) {
        throw new Error('不能领取自己发布的任务');
      }

      // 查询是否领取完了
      const questLogCount = await connQuest.query('SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;', [ qid ]);
      // this.logger.info('questLogCount', questLogCount);
      if (Number(questLogCount[0].count) >= Number(resultQuest.reward_people)) {
        throw new Error('已经领取完了');
      }

      // 判断是否满足条件
      const checkTwitter = async () => {
        // 查询当前用户是否绑定了twitter
        const sqlUser = 'SELECT u.id, ua.uid, ua.account FROM users u LEFT JOIN user_accounts ua ON u.id = ua.uid WHERE u.id = ? AND ua.platform = \'twitter\' LIMIT 0, 1;';
        const resultUser = await mysqlMatataki.query(sqlUser, [ id ]);
        // this.logger.info('resultUser', resultUser);

        // 判断是否绑定Twitter
        if (resultUser.length) {
          // 判断是否关注自己
          if (resultUser[0].account === resultQuest.twitter_id) {
            this.logger.info('别人发布的任务关注自己 直接领取');
          } else {
            const source_screen_name = resultUser[0].account;
            const target_screen_name = resultQuest.twitter_id;
            let userFriendship: any = {};
            const userFriendshipRes = await ctx.service.twitter.friendshipsShow(source_screen_name, target_screen_name);
            if (userFriendshipRes.code === 0) {
              userFriendship = userFriendshipRes.data;
            }
            this.logger.info('userFriendship', userFriendship);

            // 判断是否完成任务
            if (userFriendship.relationship.source.following) {
              this.logger.info('完成任务');
            } else {
              throw new Error('没有达成领取条件');
            }
          }
        } else {
          throw new Error('需要绑定Twitter账号');
        }
      };

      if (resultQuest.type === 0) { // Twitter 关注任务
        await checkTwitter();
      } else {
        throw new Error('领取不存在的任务类型');
      }

      // 防止重复领取
      const resultGetQuest = await connQuest.get('quests_logs', {
        qid,
        uid: id,
        type: resultQuest.type,
      });
      if (resultGetQuest) {
        throw new Error('已经领取过了');
      }

      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');

      // 领取奖励
      const rewardResult = await connQuest.insert('quests_logs', {
        qid,
        uid: id,
        type: resultQuest.type,
        create_time: time,
      });
      this.logger.info('rewardResult', rewardResult);

      // 发送奖励
      // 计算获取奖励
      const amount = this.processReward(resultQuest.reward_price, resultQuest.reward_people);
      await connQuest.insert('quests_transfer_logs', {
        qlogid: rewardResult.insertId,
        from_id: ctx.userQuest.id,
        to_id: id,
        token_id: resultQuest.token_id,
        amount,
        hash: '',
        create_time: time,
        update_time: time,
      });

      await connQuest.commit();

      return {
        code: 0,
      };
    } catch (e) {
      this.logger.error('receive error: ', e);
      await connQuest.rollback();
      return {
        code: -1,
        message: `receive error${e}`,
      };
    }
  }

  // 领取Key任务
  public async receiveKey({ qid, key }) {
    this.logger.info('receiveTwitter', key, new Date());

    const { ctx } = this;
    // 获取用户 uid
    const { id } = ctx.user;

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      // 查询任务列表 获取任务 type
      const resultQuest = await connQuest.get('quests', { id: qid });
      this.logger.info('resultQuest', resultQuest);
      if (!resultQuest) {
        throw new Error('任务不存在');
      }

      // 任务已结束
      if (Number(resultQuest.end) === 1) {
        throw new Error('任务已结束');
      }

      // 不能领取自己发布的任务
      if (String(resultQuest.uid) === String(id)) {
        throw new Error('不能领取自己发布的任务');
      }

      // 查询是否领取完了
      const questLogCount = await connQuest.query('SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;', [ qid ]);
      // this.logger.info('questLogCount', questLogCount);
      if (Number(questLogCount[0].count) >= Number(resultQuest.reward_people)) {
        throw new Error('已经领取完了');
      }

      // 判断是否满足条件
      const checkKey = () => {
        if (resultQuest.key !== key) {
          throw new Error('口令不正确');
        }
      };

      if (resultQuest.type === 2) {
        await checkKey();
      } else {
        throw new Error('领取不存在的任务类型');
      }

      // 防止重复领取
      const resultGetQuest = await connQuest.get('quests_logs', {
        qid,
        uid: id,
        type: resultQuest.type,
      });
      if (resultGetQuest) {
        throw new Error('已经领取过了');
      }

      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');

      // 领取奖励
      const rewardResult = await connQuest.insert('quests_logs', {
        qid,
        uid: id,
        type: resultQuest.type,
        create_time: time,
      });
      this.logger.info('rewardResult', rewardResult);

      // 发送奖励
      // 计算获取奖励
      const amount = this.processReward(resultQuest.reward_price, resultQuest.reward_people);
      await connQuest.insert('quests_transfer_logs', {
        qlogid: rewardResult.insertId,
        from_id: ctx.userQuest.id,
        to_id: id,
        token_id: resultQuest.token_id,
        amount,
        hash: '',
        create_time: time,
        update_time: time,
      });

      await connQuest.commit();

      return {
        code: 0,
      };
    } catch (e) {
      this.logger.error('receive error: ', e);
      await connQuest.rollback();
      return {
        code: -1,
        message: `receive error${e}`,
      };
    }
  }
  // 领取转推任务
  public async receiveRetweet({ qid }) {
    this.logger.info('receiveRetweet', new Date());

    const { ctx } = this;
    // 获取用户 uid
    const { id } = ctx.user;

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const mysqlMatataki = this.app.mysql.get('matataki');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      // 查询任务列表 获取任务 type
      const resultQuest = await connQuest.get('quests', { id: qid });
      this.logger.info('resultQuest', resultQuest);
      if (!resultQuest) {
        throw new Error('任务不存在');
      }

      // 任务已结束
      if (Number(resultQuest.end) === 1) {
        throw new Error('任务已结束');
      }

      // 不能领取自己发布的任务
      if (String(resultQuest.uid) === String(id)) {
        throw new Error('不能领取自己发布的任务');
      }

      // 查询是否领取完了
      const questLogCount = await connQuest.query('SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;', [ qid ]);
      // this.logger.info('questLogCount', questLogCount);
      if (Number(questLogCount[0].count) >= Number(resultQuest.reward_people)) {
        throw new Error('已经领取完了');
      }

      // 判断是否满足条件
      const check = async () => {

        // 查询当前用户是否绑定了twitter
        const sqlUser = 'SELECT u.id, ua.uid, ua.account FROM users u LEFT JOIN user_accounts ua ON u.id = ua.uid WHERE u.id = ? AND ua.platform = \'twitter\' LIMIT 0, 1;';
        const resultUser = await mysqlMatataki.query(sqlUser, [ id ]);
        this.logger.info('resultUser', resultUser);

        // 判断是否绑定Twitter
        let screen_name = '';
        const tweetId = resultQuest.twitter_status;
        if (resultUser.length) {
          screen_name = resultUser[0].account;
        } else {
          throw new Error('需要绑定Twitter账号');
        }


        const result = await ctx.service.twitter.statusesUserTimeline({ screen_name });
        this.logger.info('screen_name', screen_name, tweetId);

        if (result.code === 0) {

          const list = result.data.filter(i => (!isEmpty(i.retweeted_status) && i.text.includes('RT')));
          this.logger.info('list', list);
          const res = list.find(i => i.retweeted_status.id_str === tweetId);

          if (isEmpty(res)) {
            this.logger.info('没有转推');
            throw new Error('没有转推');
          } else {
            this.logger.info('已经转推了');
          }
        } else {
          throw new Error('没有转推, 无法获取用户推文。');
        }
      };

      if (resultQuest.type === 3) {
        await check();
      } else {
        throw new Error('领取不存在的任务类型');
      }

      // 防止重复领取
      const resultGetQuest = await connQuest.get('quests_logs', {
        qid,
        uid: id,
        type: resultQuest.type,
      });
      if (resultGetQuest) {
        throw new Error('已经领取过了');
      }

      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');

      // 领取奖励
      const rewardResult = await connQuest.insert('quests_logs', {
        qid,
        uid: id,
        type: resultQuest.type,
        create_time: time,
      });
      this.logger.info('rewardResult', rewardResult);

      // 发送奖励
      // 计算获取奖励
      const amount = this.processReward(resultQuest.reward_price, resultQuest.reward_people);
      await connQuest.insert('quests_transfer_logs', {
        qlogid: rewardResult.insertId,
        from_id: ctx.userQuest.id,
        to_id: id,
        token_id: resultQuest.token_id,
        amount,
        hash: '',
        create_time: time,
        update_time: time,
      });

      await connQuest.commit();

      return {
        code: 0,
      };
    } catch (e) {
      this.logger.error('receive error: ', e);
      await connQuest.rollback();
      return {
        code: -1,
        message: `receive error${e}`,
      };
    }
  }
  // 申请领取奖励
  public async apply(qid: string|number, remark: string) {
    this.logger.info('apply', new Date());

    const { ctx } = this;
    // 获取用户 uid
    const { id } = ctx.user;

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    // const mysqlMatataki = this.app.mysql.get('matataki');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
      // 查询任务列表 获取任务 type
      const resultQuest = await connQuest.get('quests', { id: qid });
      this.logger.info('resultQuest', resultQuest, id);
      if (!resultQuest) {
        throw new Error('任务不存在');
      }

      // 不能领取自己发布的任务
      if (String(resultQuest.uid) === String(id)) {
        throw new Error('不能申请领取自己发布的任务');
      }

      if (resultQuest.type === 1) { // Twitter 关注任务
        //
      } else {
        throw new Error('申请领取不存在的任务类型');
      }

      // 防止重复领取
      const resultGetQuest = await connQuest.get('quests_logs_customtask', {
        qid,
        uid: id,
      });
      if (resultGetQuest) {
        throw new Error('已经申请领取过了');
      }

      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      // 领取奖励
      const rewardResult = await connQuest.insert('quests_logs_customtask', {
        qid,
        uid: id,
        remark,
        create_time: time,
      });
      this.logger.info('rewardResult', rewardResult);

      await connQuest.commit();

      return {
        code: 0,
      };
    } catch (e) {
      this.logger.error('apply error: ', e);
      await connQuest.rollback();
      return {
        code: -1,
        message: `apply error${e}`,
      };
    }
  }
  public async applyAll() {
    this.logger.info('applyAll', new Date());

    const { ctx } = this;
    const { id } = ctx.user;

    if (id) {
      const mysqlQuest = this.app.mysql.get('quest');
      const sql = `SELECT DISTINCT q.id, q.uid, q.title, q.create_time
      FROM quests_logs_customtask qlc LEFT JOIN quests q ON qlc.qid = q.id
      WHERE q.type = 1 AND q.uid = ?`;
      const resultsApplyAll = await mysqlQuest.query(sql, [ id ]);

      this.logger.info('resultsApplyAll', resultsApplyAll);

      return {
        code: 0,
        data: {
          count: resultsApplyAll.length,
          list: resultsApplyAll,
        },
      };
    }
    return {
      code: 0,
      data: {
        count: 0,
        list: [],
      },
      message: '没有申请',
    };

  }
  // 申请同意
  public async applyAgree({ qid, uid }) {
    this.logger.info('applyAgree', new Date());

    const { ctx } = this;
    const { id } = ctx.user;

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    // const mysqlMatataki = this.app.mysql.get('matataki');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {

      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      // 查询任务列表 获取任务 type
      const resultQuest = await connQuest.get('quests', { id: qid });
      this.logger.info('resultQuest', resultQuest, id);
      if (!resultQuest) {
        throw new Error('任务不存在');
      }

      // 任务已结束
      if (Number(resultQuest.end) === 1) {
        throw new Error('任务已结束');
      }

      // 暂时 只能发布者操作任务
      if (String(resultQuest.uid) !== String(id)) {
        throw new Error('只能发布者操作任务');
      }
      // 不能领取自己发布的任务
      if (String(resultQuest.uid) === String(uid)) {
        throw new Error('不能领取自己发布的任务');
      }

      // 查询是否领取完了
      const questLogCount = await connQuest.query('SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;', [ qid ]);
      // this.logger.info('questLogCount', questLogCount);
      if (Number(questLogCount[0].count) >= Number(resultQuest.reward_people)) {
        throw new Error('已经领取完了');
      }

      if (resultQuest.type === 1) { // Twitter 关注任务
        //
      } else {
        throw new Error('申请领取不存在的任务类型');
      }

      // 防止重复领取
      const resultGetQuest = await connQuest.get('quests_logs', {
        qid,
        uid,
        type: resultQuest.type,
      });
      if (resultGetQuest) {
        throw new Error('已经申请领取过了');
      }

      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      // 领取奖励
      const rewardResult = await connQuest.insert('quests_logs', {
        qid,
        uid,
        type: resultQuest.type,
        create_time: time,
      });
      this.logger.info('rewardResult', rewardResult);

      // 发送奖励
      // 计算获取奖励
      const amount = this.processReward(resultQuest.reward_price, resultQuest.reward_people);
      await connQuest.insert('quests_transfer_logs', {
        qlogid: rewardResult.insertId,
        from_id: ctx.userQuest.id,
        to_id: uid,
        token_id: resultQuest.token_id,
        amount,
        hash: '',
        create_time: time,
        update_time: time,
      });

      // 删除记录
      await connQuest.delete('quests_logs_customtask', {
        qid,
        uid,
      });

      await connQuest.commit();

      return {
        code: 0,
      };
    } catch (e) {
      this.logger.error('applyAgree error: ', e);
      await connQuest.rollback();
      return {
        code: -1,
        message: `applyAgree error${e}`,
      };
    }
  }
  // 申请拒绝
  public async applyReject({ qid, uid }) {
    this.logger.info('applyReject', new Date());

    const { ctx } = this;
    const { id } = ctx.user;

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    // const mysqlMatataki = this.app.mysql.get('matataki');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
      // 查询任务列表 获取任务 type
      const resultQuest = await connQuest.get('quests', { id: qid });
      this.logger.info('resultQuest', resultQuest, id);
      if (!resultQuest) {
        throw new Error('任务不存在');
      }

      // 暂时 只能发布者操作任务
      if (String(resultQuest.uid) !== String(id)) {
        throw new Error('只能发布者操作任务');
      }

      if (resultQuest.type === 1) { // Twitter 关注任务
        //
      } else {
        throw new Error('申请领取不存在的任务类型');
      }

      // 删除记录
      await connQuest.delete('quests_logs_customtask', {
        qid,
        uid,
      });

      await connQuest.commit();

      return {
        code: 0,
      };
    } catch (e) {
      this.logger.error('applyReject error: ', e);
      await connQuest.rollback();
      return {
        code: -1,
        message: `applyReject error${e}`,
      };
    }
  }

  public async questCount({ type, token }) {
    const { logger, ctx } = this;
    const { id } = ctx.user;

    logger.info('questCount', token, new Date());

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    // const mysqlMatataki = this.app.mysql.get('matataki');

    // 处理 token 筛选
    const whereToken = token ? `WHERE token_id = ${token}` : '';

    // sql 全部任务
    const sqlAllQuests = `SELECT * FROM quests ${whereToken};`;
    //  sql 全部任务数量
    const sqlAllQuestsCount = 'SELECT COUNT(1) AS count FROM quests';
    //  sql 领取记录
    const sqlQuestsLogs = 'SELECT q.id, ql.qid, q.type, q.token_id FROM quests_logs ql LEFT JOIN quests q ON ql.qid = q.id';

    try {
      // 查询全部任务
      const resultsAllQuests = await mysqlQuest.query(sqlAllQuests);
      this.logger.info('resultsAllQuests', resultsAllQuests.length);

      // 查询全部任务数量
      const resultsQuests = resultsAllQuests.length;

      // handle type token sql query
      const handleTokenTypeSql = ({ sql, token, type, where = false }) => {
        let _sql: string = sql;
        const _where = where ? ' AND ' : ' WHERE ';
        const _token = token ? `token_id = ${token} AND ` : '';
        const _type = `type = ${type}`;
        _sql += `${_where}${_token}${_type}`;
        return `${_sql};`;
      };

      // 查询Twitter任务数量
      const sqlAllQuestsTwitterCount = handleTokenTypeSql({ sql: sqlAllQuestsCount, token, type: 0, where: false });
      const resultsAllQuestsTwitterCount = await mysqlQuest.query(sqlAllQuestsTwitterCount);
      const resultsQuestsTwitter = resultsAllQuestsTwitterCount[0].count;
      this.logger.info('resultsQuestsTwitter', resultsQuestsTwitter);

      // 查询自定义任务数量
      const sqlAllQuestsCustomtaskCount = handleTokenTypeSql({ sql: sqlAllQuestsCount, token, type: 1, where: false });
      const resultsAllQuestsCustomtaskCount = await mysqlQuest.query(sqlAllQuestsCustomtaskCount);
      const resultsQuestsCustomtask = resultsAllQuestsCustomtaskCount[0].count;
      this.logger.info('resultsQuestsCustomtask', resultsQuestsCustomtask);

      // 查询key任务数量
      const sqlAllQuestsKeyCount = handleTokenTypeSql({ sql: sqlAllQuestsCount, token, type: 2, where: false });
      const resultsAllQuestsKeyCount = await mysqlQuest.query(sqlAllQuestsKeyCount);
      const resultsQuestsKey = resultsAllQuestsKeyCount[0].count;
      this.logger.info('resultsQuestsKey', resultsQuestsKey);

      // 查询twitter转推任务数量
      const sqlAllQuestsRetweetCount = handleTokenTypeSql({ sql: sqlAllQuestsCount, token, type: 3, where: false });
      const resultsAllQuestsRetweetCount = await mysqlQuest.query(sqlAllQuestsRetweetCount);
      const resultsQuestsRetweet = resultsAllQuestsRetweetCount[0].count;
      this.logger.info('resultsQuestsRetweet', resultsQuestsRetweet);


      // -----

      // handle type sql query
      const handleTypeAndTokenSql = ({ sql, type, token, where = false }) => {
        let _sql: string = sql;
        const _where = where ? ' AND ' : ' WHERE ';
        const _token = token ? `token_id = ${token} AND ` : '';

        if (type === 'twitter') {
          _sql += `${_where}${_token}type = 0`;
        } else if (type === 'customtask') {
          _sql += `${_where}${_token}type = 1`;
        } else if (type === 'key') {
          _sql += `${_where}${_token}type = 2`;
        } else if (type === 'twitterRetweet') {
          _sql += `${_where}${_token}type = 3`;
        } else {
          if (token) {
            _sql += `${_where}token_id = ${token}`;
          }
        }
        return `${_sql};`;
      };
      const handleTypeAndTokenQuestLogsSql = ({ sql, type, token, where = false }) => {
        let _sql: string = sql;
        const _where = where ? ' AND ' : ' WHERE ';
        const _token = token ? `q.token_id = ${token} AND ` : '';

        if (type === 'twitter') {
          _sql += `${_where}${_token}q.type = 0`;
        } else if (type === 'customtask') {
          _sql += `${_where}${_token}q.type = 1`;
        } else if (type === 'key') {
          _sql += `${_where}${_token}q.type = 2`;
        } else if (type === 'twitterRetweet') {
          _sql += `${_where}${_token}q.type = 3`;
        }
        return `${_sql};`;
      };
      // 查询全部任务数量
      const sqlAll = handleTypeAndTokenSql({ sql: sqlAllQuestsCount, type, token, where: false });
      const resultsTypeAllQuestsCount = await mysqlQuest.query(sqlAll);
      const resultsTypeQuests = resultsTypeAllQuestsCount[0].count;
      // this.logger.info('resultsTypeQuests', resultsTypeQuests);

      // 查询领取记录做计算
      const sqlQLogs = handleTypeAndTokenQuestLogsSql({ sql: sqlQuestsLogs, type, token, where: false });
      const resultsQuestsLogs = await mysqlQuest.query(sqlQLogs);
      this.logger.info('resultsQuestsLogs', resultsQuestsLogs);

      // [ {qid: x}, {} ] ===> { x: count, y: count }
      const questsLogs = {};
      resultsQuestsLogs.forEach(i => {
        if (!questsLogs[i.qid]) {
          questsLogs[i.qid] = 0;
        }
        questsLogs[i.qid] = questsLogs[i.qid] += 1;
      });
      this.logger.info('questsLogs', questsLogs);

      // 计算待完成的 比对总量
      // 查询领取完毕的 用总量 - 完成量
      let completed = 0;
      resultsAllQuests.forEach(i => {
        if (questsLogs[i.id] >= Number(i.reward_people)) {
          completed += 1;
        }
      });

      this.logger.info('completed', completed);

      // 查询已完成
      const receiveFn = async id => {
        const _sql = 'SELECT COUNT(1) AS count FROM quests_logs ql LEFT JOIN quests q ON ql.qid = q.id WHERE ql.uid = ?';
        const _sqlResult = handleTypeAndTokenQuestLogsSql({ sql: _sql, type, token, where: true });
        const resultsQuestsLogs = await mysqlQuest.query(_sqlResult, [ id ]);
        this.logger.info('resultsQuestsLogs', resultsQuestsLogs);
        return resultsQuestsLogs[0].count;
      };

      // 我创建的
      const createFn = async id => {
        const _sql = 'SELECT COUNT(1) AS count FROM quests WHERE uid = ?';
        const _sqlResult = handleTypeAndTokenSql({ sql: _sql, type, token, where: true });
        const resultsQuestsCount = await mysqlQuest.query(_sqlResult, [ id ]);
        this.logger.info('resultsQuestsCount', resultsQuestsCount);
        return resultsQuestsCount[0].count;
      };

      if (id) {

        const received = await receiveFn(id);
        const created = await createFn(id);

        return {
          code: 0,
          data: {
            type_all: resultsQuests,
            type_twitter: resultsQuestsTwitter,
            type_customtask: resultsQuestsCustomtask,
            type_key: resultsQuestsKey,
            type_retweet: resultsQuestsRetweet,
            all: resultsTypeQuests,
            undone: Number(resultsTypeQuests) - Number(completed),
            completed,
            received,
            created,
          },
        };
      }

      return {
        code: 0,
        data: {
          type_all: resultsQuests,
          type_twitter: resultsQuestsTwitter,
          type_customtask: resultsQuestsCustomtask,
          type_key: resultsQuestsKey,
          type_retweet: resultsQuestsRetweet,
          all: resultsTypeQuests,
          undone: Number(resultsTypeQuests) - Number(completed),
          completed,
          received: 0,
          created: 0,
        },
      };
    } catch (e) {
      this.logger.error('questCount error: ', e);
      return {
        code: -1,
        message: e.toString(),
      };
    }
  }

  public async questAll() {
    const { logger, ctx } = this;
    const { id } = ctx.user;

    logger.info('questAll', new Date());

    const sql = `SELECT id, uid, type, twitter_id, title, \`end\`, create_time
    FROM quests WHERE uid = ?
    ORDER BY id DESC;`;
    const mysqlQuest = this.app.mysql.get('quest');

    try {
      const questLogCount = await mysqlQuest.query(sql, [ id ]);
      return {
        code: 0,
        data: {
          count: questLogCount.length,
          list: questLogCount,
        },
      };
    } catch (e) {
      this.logger.error('questAll error: ', e);
      return {
        code: -1,
        message: `questAll error${e}`,
      };
    }
  }

  public async getToken() {
    const { logger, ctx } = this;
    logger.info('getToken', new Date());
    try {
      // 获取托管用户的信息
      const result = await ctx.curl(`${this.config.mtkApi}/login/account`, {
        dataType: 'json',
        method: 'POST',
        contentType: 'json',
        data: {
          username: this.config.mtkUser.username,
          password: this.config.mtkUser.password,
        },
      });
      if (result.status === 200 && result.data.code === 0) {
        return result.data.data;
      }
      throw new Error('获取托管账户授权失败');
    } catch (e) {
      this.logger.error('getToken error: ', e);
      return '';
    }
  }

  public async getHostingInfo() {
    const { logger, ctx } = this;
    logger.info('getHostingInfo', new Date());

    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('没有token');
      }

      const resultUserStats = await ctx.curl(`${this.config.mtkApi}/user/stats`, {
        dataType: 'json',
        method: 'GET',
        contentType: 'json',
        headers: {
          'x-access-token': token,
        },
      });
      if (resultUserStats.status === 200 && resultUserStats.data.code === 0) {
        ctx.userQuest = {
          id: resultUserStats.data.data.id,
          token,
        };
        // this.logger.info('resultUserStats', resultUserStats);
      } else {
        throw new Error('获取托管账户信息失败');
      }
      // this.logger.info('userQuest', ctx.userQuest);
    } catch (e) {
      this.logger.error('getHostingInfo error: ', e);
      ctx.userQuest = {};
    }
  }
  // 待发放奖励列表
  public async pendingRewards() {

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const mysqlMatataki = this.app.mysql.get('matataki');

    try {
      const _sql = `SELECT qtl.id, qtl.to_id, qtl.token_id, qtl.amount, qtl.create_time, ql.qid
      FROM quests_transfer_logs qtl LEFT JOIN quests_logs ql ON qtl.qlogid = ql.id
      WHERE qtl.\`hash\` = '' ORDER BY qtl.create_time ASC;`;
      this.logger.info('pendingRewards _sql', _sql);
      const resultRewards = await mysqlQuest.query(_sql);
      // this.logger.info(resultRewards);

      // 获取用户信息
      let sqlUser = '';
      resultRewards.forEach((i: any) => {
        sqlUser += `SELECT username, nickname, avatar FROM users WHERE id = ${i.to_id};`;
      });
      const resultsMatatakiUser = await mysqlMatataki.query(sqlUser);
      const resultsMatatakiUserFlat = transformForOneArray(resultsMatatakiUser);
      // this.logger.info('resultsMatatakiUserFlat', resultsMatatakiUserFlat);
      resultRewards.forEach((i: any, idx: number) => {
        i.username = resultsMatatakiUserFlat[idx].nickname || resultsMatatakiUserFlat[idx].username || '';
        i.avatar = resultsMatatakiUserFlat[idx].avatar || '';
      });

      let sqlToken = '';
      resultRewards.forEach((i: any) => {
        sqlToken += `SELECT name, symbol, decimals, logo FROM minetokens WHERE id = ${i.token_id};`;
      });
      const resultsMatatakiToken = await mysqlMatataki.query(sqlToken);
      const resultsMatatakiTokenFlat = transformForOneArray(resultsMatatakiToken);
      // this.logger.info('resultsMatatakiTokenFlat', resultsMatatakiTokenFlat);
      resultRewards.forEach((i: any, idx: number) => {
        i.name = resultsMatatakiTokenFlat[idx].name || '';
        i.symbol = resultsMatatakiTokenFlat[idx].symbol || '';
        i.decimals = resultsMatatakiTokenFlat[idx].decimals || '';
        i.logo = resultsMatatakiTokenFlat[idx].logo || '';
      });

      return {
        code: 0,
        data: {
          count: resultRewards.length,
          list: resultRewards,
        },
      };
    } catch (e) {
      this.logger.error('pendingRewards error: ', e);
      return {
        code: -1,
      };
    }
  }
  // 结束任务
  public async questEnd({ qid }) {
    const { app, logger, ctx } = this;
    const { id } = ctx.user;

    logger.info('questEnd start', qid, id);

    // init
    const mysqlQuest = app.mysql.get('quest');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
      // 设置托管信息
      if (isEmpty(ctx.userQuest)) {
        await this.getHostingInfo();
      }

      if (!ctx.userQuest.id) {
        throw new Error('没有托管信息');
      }

      // 是不是自己的任务
      const resultQuest = await connQuest.get('quests', { id: qid, uid: id });
      console.log('resultQuest', resultQuest);

      if (isEmpty(resultQuest)) {
        throw new Error('没有找到相关任务');
      }

      if (Number(resultQuest.end) === 1) {
        throw new Error('不可重复操作');
      }

      // 更新
      const row = {
        id: resultQuest.id,
        end: 1,
      };
      const result = await connQuest.update('quests', row);
      const updateSuccess = result.affectedRows === 1;

      if (updateSuccess) {
        //
      } else {
        throw new Error('更新失败');
      }

      // 退钱
      const questLogCount = await connQuest.query('SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;', [ qid ]);
      logger.info('questLogCount', questLogCount);
      if (Number(questLogCount[0].count) >= Number(resultQuest.reward_people)) {
        logger.info('已经领取完了, 无需退还资产');
      } else {
        // 发送资产
        // 计算获取奖励
        // 计算剩余资产
        const processAssets = (amount: string, share: number, price: string) => {

          // 剩余资产 = 总资产/人数 * 剩余份额
          // 到账资产 = 剩余资产 - (总资产 * 千分之三)

          const BN = BigNumber.clone();
          BN.config({ DECIMAL_PLACES: 3 });
          const single = new BN(new BN(Number(amount))).multipliedBy(Number(share));
          const rate = 0.003; // 千分之三

          // 手续费
          const handlingFee = new BN(new BN(Number(price))).multipliedBy(Number(rate));
          return (new BigNumber(single).minus(handlingFee)).toString();
        };

        // 单份奖励
        const amount = this.processReward(resultQuest.reward_price, resultQuest.reward_people);
        // 剩余份额
        const remainingShare = Number(resultQuest.reward_people) - Number(questLogCount[0].count);
        // 剩余份额数量
        const shareAmount = processAssets(amount, remainingShare, resultQuest.reward_price);

        if (Number(shareAmount) > 0) {
          const time: string = moment().format('YYYY-MM-DD HH:mm:ss');

          console.log('id', id);

          await connQuest.insert('quests_end_transfer_logs', {
            qid: resultQuest.id,
            from_id: ctx.userQuest.id,
            to_id: id,
            token_id: resultQuest.token_id,
            amount: shareAmount,
            status: 0,
            create_time: time,
            update_time: time,
          });
        } else {
          // 剩余份额小于手续费，不进行操作
          logger.info('剩余份额小于手续费，不进行操作');
        }
      }

      await connQuest.commit();

      return {
        code: 0,
      };
    } catch (e) {
      logger.error('questEnd error: ', e.toString());
      await connQuest.rollback();
      return {
        code: -1,
        message: e.toString(),
      };
    }

  }

  // 发放奖励
  public async receiveTransfer() {

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
      // 获取所有需要处理的列表
      const resultTransfer = await connQuest.query('SELECT * FROM quests_transfer_logs WHERE hash = \'\' ORDER BY create_time ASC LIMIT 0, 1;');
      this.logger.info('resultTransfer', this.ctx.userQuest);

      if (!resultTransfer.length) {
        await connQuest.commit();
        return;
      }

      const token = await this.getToken();
      if (!token) {
        throw new Error('没有token');
      }

      // 获取最早的第一个 开始转账
      const resultUserTransfer = await this.ctx.curl(`${this.config.mtkApi}/minetoken/transfer`, {
        dataType: 'json',
        method: 'POST',
        // contentType: 'json',
        headers: {
          'x-access-token': token,
        },
        timeout: 30 * 1000,
        data: {
          amount: resultTransfer[0].amount * 10000,
          memo: 'Matataki Quest 任务奖励',
          to: resultTransfer[0].to_id,
          tokenId: resultTransfer[0].token_id,
        },
      });

      this.logger.info('resultUserTransfer', resultUserTransfer);
      // 插入 hash 更新时间
      if (resultUserTransfer.status === 200 && resultUserTransfer.data.code === 0) {
        const time: string = moment().format('YYYY-MM-DD HH:mm:ss');

        const row = {
          id: resultTransfer[0].id,
          hash: resultUserTransfer.data.data.tx_hash,
          update_time: time,
        };
        const result = await connQuest.update('quests_transfer_logs', row);
        const updateSuccess = result.affectedRows === 1;

        if (updateSuccess) {
          this.logger.info('发布奖励成功');
          await connQuest.commit();
        } else {
          throw new Error('发布奖励失败');
        }
      } else {
        throw new Error('转账失败');
      }

    } catch (error) {
      this.logger.error('receiveTransfer error: ', error.toString());
      await connQuest.rollback();
    }
  }
  public async endTransfer() {

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
      // 获取所有需要处理的列表
      const resultTransfer = await connQuest.query('SELECT * FROM quests_end_transfer_logs WHERE `hash` IS NULL AND `status` = 0 ORDER BY create_time ASC LIMIT 0, 1;');
      this.logger.info('resultTransfer', this.ctx.userQuest);

      if (!resultTransfer.length) {
        await connQuest.commit();
        return;
      }

      const token = await this.getToken();
      if (!token) {
        throw new Error('没有token');
      }

      // 获取最早的第一个 开始转账
      const resultUserTransfer = await this.ctx.curl(`${this.config.mtkApi}/minetoken/transfer`, {
        dataType: 'json',
        method: 'POST',
        // contentType: 'json',
        headers: {
          'x-access-token': token,
        },
        timeout: 30 * 1000,
        data: {
          amount: resultTransfer[0].amount * 10000,
          memo: 'Matataki Quest 任务奖励退回',
          to: resultTransfer[0].to_id,
          tokenId: resultTransfer[0].token_id,
        },
      });

      // const resultUserTransfer = {
      //   status: 0,
      //   data: {
      //     code: -1,
      //     data: {
      //       tx_hash: '',
      //     },
      //   },
      // };

      this.logger.info('resultUserTransfer', resultUserTransfer);
      // 更新 hash status
      let row = {};
      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');

      if (resultUserTransfer.status === 200 && resultUserTransfer.data.code === 0) {
        row = {
          id: resultTransfer[0].id,
          hash: resultUserTransfer.data.data.tx_hash,
          status: 1,
          update_time: time,
        };
      } else {
        row = {
          id: resultTransfer[0].id,
          status: 1,
          update_time: time,
        };
        this.logger.error('转账失败');
      }
      const result = await connQuest.update('quests_end_transfer_logs', row);
      const updateSuccess = result.affectedRows === 1;

      if (updateSuccess) {
        this.logger.info('奖励退回成功');
        await connQuest.commit();
      } else {
        throw new Error('奖励退回失败');
      }
    } catch (error) {
      this.logger.error('receiveTransfer error: ', error.toString());
      await connQuest.rollback();
    }
  }
}
