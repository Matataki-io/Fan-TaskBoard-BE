import { Service } from 'egg';
import * as moment from 'moment';
import { questInterface, friendshipsProps } from '../../typings/index';
import { isEmpty } from 'lodash';
import BigNumber from 'bignumber.js';
import { transformForOneArray } from '../utils/index';

interface paginationInterface {
  page: number,
  size: number,
}

interface getQuestProps extends paginationInterface {
  account?: string
  sort?: string
  token?: string | number
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
  // 创建任务转账
  private async CreateQuestTransfer(type, reward_price, token_id): Promise<string> {
    const { ctx } = this;
    const token = ctx.header['x-access-token'];
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
    console.log('CreateQuest resultUserTransfer', resultUserTransfer, token);
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
    console.log('type, twitter_id, token_id, reward_people, reward_price', type, twitter_id, token_id, reward_people, reward_price);
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
        create_time: time,
        update_time: time,
      };

      const mysqlQuest = this.app.mysql.get('quest');
      const result = await mysqlQuest.insert('quests', data);
      const insertSuccess = result.affectedRows === 1;

      console.log('result', result);

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
    console.log('type, title, content, token_id, reward_people, reward_price', type, title, content, token_id, reward_people, reward_price);
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

      const hash = await this.CreateQuestTransfer(type, reward_price, token_id);
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
        create_time: time,
        update_time: time,
      };

      const mysqlQuest = this.app.mysql.get('quest');
      const result = await mysqlQuest.insert('quests', data);
      const insertSuccess = result.affectedRows === 1;

      console.log('result', result);

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

  public async getQuest({ page, size, sort, token, filter }: getQuestProps): Promise<questsListProps> {
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
      console.log('resultsQuestsLogs', resultsQuestsLogs);

      // [ {qid: x}, {} ] ===> { x: count, y: count }
      const questsLogs = {};
      resultsQuestsLogs.forEach(i => {
        if (!questsLogs[i.qid]) {
          questsLogs[i.qid] = 0;
        }
        questsLogs[i.qid] = questsLogs[i.qid] += 1;
      });
      console.log('questsLogs', questsLogs);

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
        // 不做处理
      } else if (filter === 'undone') {

        const _sql = await undoneResult();
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

        const _sql = await completedResult();
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

        const _sql = await receivedResult(id);
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
        if (whereToken) {
          whereToken += ` AND uid = ${id}`;
        } else {
          whereToken += `WHERE uid = ${id}`;
        }

        if (token) {
          sql += ` AND uid = ${id}`;
        } else {
          sql += ` WHERE uid = ${id}`;
        }
      }

      sql += ';';
      const countResults = await mysqlQuest.query(sql);

      // 查询任务
      // [{}] [{}, {}]
      const sqlQuests = `SELECT id, uid, type, title, twitter_id, token_id, reward_people, reward_price, create_time FROM quests ${whereToken} ORDER BY ${orders} LIMIT ?, ?;`;
      const results = await mysqlQuest.query(sqlQuests, [ (page - 1) * size, Number(size) ]);
      this.logger.info('results', results);

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
      // console.log('resultQuestsLogsCount', resultQuestsLogsCount);

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

      const usersTwitter = await this.service.twitter.usersLookup(screenNameStr);
      // console.log('usersTwitter', usersTwitter);
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
      console.log('resultQuestsLogs', resultQuestsLogs);

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
      console.log('resultQuestsLogsCustomtask', resultQuestsLogsCustomtask);

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
        console.log('argumentsArr', argumentsArrDedupeFilter);

        // 准备查询语句
        const promiseArr: any[] = [];
        argumentsArrDedupeFilter.forEach((i: any) => {
          promiseArr.push(ctx.service.twitter.friendshipsShow(source_screen_name, (i.split(','))[1])); // a,b
        });

        // 开始查询twitter关系结果
        const result: friendshipsProps[] = await Promise.all(promiseArr);
        console.log('result', result);

        // 处理关系结果格式 ===> [key: target_screen_name]: {}
        const relationshipList = {};
        result.forEach((i: friendshipsProps) => {
          // console.log('i ', i);
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

      const handleTwitterFollowers = async (screen_name: string, target: any[]) => {

        // 1: 1分钟内请求使用内存的记录
        // 2: 请求列表
        // 3：请求失败使用内容记录
        // 4: 没有内存记录请求失败换另一个代替 最后都失败使用默认状态

        let resultFriendsList: any[] = [];
        const oldValue = TwitterFollowersMap.get(screen_name);

        const requestFriendsList = async () => {
          // 查询关注过的人的信息
          resultFriendsList = await this.service.twitter.friendsList(screen_name);
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
              await relationship(screen_name, results); // 传递 results 引用
              return;
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
        console.log('TwitterFollowersMap', TwitterFollowersMap);
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

  public async getQuestDetail({ qid }) {
    const { logger, ctx } = this;
    const { id } = ctx.user;

    logger.info('getQuestDetail', new Date());

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const mysqlMatataki = this.app.mysql.get('matataki');

    try {
      // 获取任务信息
      const sqlQuest = 'SELECT id, uid, type, twitter_id, title, content, token_id, reward_people, reward_price, create_time FROM quests WHERE id = ?;';
      const resultQuest = await mysqlQuest.query(sqlQuest, [ qid ]);
      console.log('resultQuest', resultQuest);

      if (!resultQuest.length) {
        throw new Error('没有任务信息');
      }

      const result = resultQuest[0];

      // 获取用户信息
      const sqlUsers = 'SELECT id, username, nickname, avatar FROM users WHERE id = ?;';
      const resultUser = await mysqlMatataki.query(sqlUsers, [ result.uid ]);
      console.log('resultUser', resultUser);

      result.username = resultUser[0].nickname || resultUser[0].username || '';
      result.avatar = resultUser[0].avatar;

      // 获取token信息
      const sqlTokens = 'SELECT id, name, symbol, decimals, logo FROM minetokens WHERE id = ?;';
      const resultTokens = await mysqlMatataki.query(sqlTokens, [ result.token_id ]);
      console.log('resultTokens', resultTokens);

      result.name = resultTokens[0].name;
      result.symbol = resultTokens[0].symbol;
      result.decimals = resultTokens[0].decimals;
      result.logo = resultTokens[0].logo;

      // 获取已经领取的数量
      const sqlQuestsLogsCounts = 'SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;';
      const resultQuestsLogsCounts = await mysqlQuest.query(sqlQuestsLogsCounts, [ result.id ]);
      console.log('resultQuestsLogsCounts', resultQuestsLogsCounts);

      result.received = resultQuestsLogsCounts[0].count;

      // 查询是否领取
      if (id) {
        const sqlQuestsLogs = 'SELECT * FROM quests_logs WHERE qid = ? AND uid = ? AND type = ?;';
        const resultQuestsLogs = await mysqlQuest.query(sqlQuestsLogs, [ qid, id, result.type ]);
        console.log('resultQuestsLogs', resultQuestsLogs);

        // 自定义任务是否申请判断
        if (Number(result.type) === 1) {
          const sqlQuestsLogsCustomtask = 'SELECT * FROM quests_logs_customtask WHERE qid = ? AND uid = ?;';
          const resultQuestsLogsCustomtask = await mysqlQuest.query(sqlQuestsLogsCustomtask, [ qid, id ]);
          console.log('resultQuestsLogsCustomtask', resultQuestsLogsCustomtask);

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
        const resultTwitterUser = await this.service.twitter.usersLookup(String(result.twitter_id));
        console.log('resultTwitterUser', resultTwitterUser);
        result.twitter_name = resultTwitterUser[result.twitter_id].name;
        result.twitter_screen_name = resultTwitterUser[result.twitter_id].screen_name;
        result.twitter_profile_image_url_https = resultTwitterUser[result.twitter_id].profile_image_url_https;
      } else if (result.type === 1) {
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
      console.log('resultQuest', resultQuest);

      // 查询某个任务领取记录列表
      const sqlQueststLogs = 'SELECT ql.id, ql.qid, ql.uid, ql.type, ql.create_time, qtl.token_id, qtl.amount FROM quests_logs ql LEFT JOIN quests_transfer_logs qtl ON qtl.qlogid = ql.id WHERE ql.qid = ? AND ql.type = ?;';
      const result = await mysqlQuest.query(sqlQueststLogs, [ qid, resultQuest.type ]);
      console.log('result', result, qid, resultQuest.type);

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
      console.log('resultUsers', resultUsers);

      // 同一个token 取第一个即可
      const sqlTokens = `SELECT id, name, symbol, decimals, logo FROM minetokens WHERE id = ${result[0].token_id};`;
      const resultTokens = await mysqlMatataki.query(sqlTokens);
      console.log('resultTokens', resultTokens);

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
      console.log('resultCounts', resultCounts);

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
      console.log('resultQuest', resultQuest);

      if (String(resultQuest.type) !== '1') {
        throw new Error('暂时只支持查询自定义任务');
      }

      if (String(resultQuest.uid) !== String(id)) {
        throw new Error('只能自己查询申请列表');
      }

      // 查询某个任务领取记录列表
      const sqlQueststLogsCustomtask = 'SELECT qid, uid, create_time FROM quests_logs_customtask WHERE qid = ?;';
      const result = await mysqlQuest.query(sqlQueststLogsCustomtask, [ qid ]);
      console.log('result', result);

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
      console.log('resultUsers', resultUsers);

      result.forEach((i, idx) => {
        // 用户信息
        i.username = resultUsers[idx].nickname || resultUsers[idx].username || '';
        i.avatar = resultUsers[idx].avatar;
      });

      // 统计count
      const sqlCounts = 'SELECT COUNT(1) AS count FROM quests_logs_customtask WHERE qid = ?;';
      const resultCounts = await mysqlQuest.query(sqlCounts, [ qid ]);
      console.log('resultCounts', resultCounts);

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
      console.log('resultQuest', resultQuest);
      if (!resultQuest) {
        throw new Error('任务不存在');
      }

      // 不能领取自己发布的任务
      if (String(resultQuest.uid) === String(id)) {
        throw new Error('不能领取自己发布的任务');
      }

      // 查询是否领取完了
      const questLogCount = await connQuest.query('SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;', [ qid ]);
      // console.log('questLogCount', questLogCount);
      if (Number(questLogCount[0].count) >= Number(resultQuest.reward_people)) {
        throw new Error('已经领取完了');
      }

      // 判断是否满足条件
      const checkTwitter = async () => {
        // 查询当前用户是否绑定了twitter
        const sqlUser = 'SELECT u.id, ua.uid, ua.account FROM users u LEFT JOIN user_accounts ua ON u.id = ua.uid WHERE u.id = ? AND ua.platform = \'twitter\' LIMIT 0, 1;';
        const resultUser = await mysqlMatataki.query(sqlUser, [ id ]);
        // console.log('resultUser', resultUser);

        // 判断是否绑定Twitter
        if (resultUser.length) {
          // 判断是否关注自己
          if (resultUser[0].account === resultQuest.twitter_id) {
            console.log('别人发布的任务关注自己 直接领取');
          } else {
            const source_screen_name = resultUser[0].account;
            const target_screen_name = resultQuest.twitter_id;
            const userFriendship = await ctx.service.twitter.friendshipsShow(source_screen_name, target_screen_name);
            console.log('userFriendship', userFriendship);

            // 判断是否完成任务
            if (userFriendship.relationship.source.following) {
              console.log('完成任务');
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
      console.log('rewardResult', rewardResult);

      // 发送奖励
      // 计算获取奖励
      const processReward = (price: string, people: string) => {
        // console.log('1111', price, people)
        const BN = BigNumber.clone();
        BN.config({ DECIMAL_PLACES: 3 });
        const single = new BN(new BN(Number(price))).dividedBy(Number(people));
        return single.toString();
      };

      const amount = processReward(resultQuest.reward_price, resultQuest.reward_people);
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
  public async apply(qid: string|number) {
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
      console.log('resultQuest', resultQuest, id);
      if (!resultQuest) {
        throw new Error('任务不存在');
      }

      // 不能领取自己发布的任务
      if (String(resultQuest.uid) === String(id)) {
        throw new Error('不能申请领取自己发布的任务');
      }

      // 查询是否领取完了
      const questLogCount = await connQuest.query('SELECT COUNT(1) as count FROM quests_logs WHERE qid = ?;', [ qid ]);
      // console.log('questLogCount', questLogCount);
      if (Number(questLogCount[0].count) >= Number(resultQuest.reward_people)) {
        throw new Error('已经领取完了');
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
        create_time: time,
      });
      console.log('rewardResult', rewardResult);

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
      console.log('resultQuest', resultQuest, id);
      if (!resultQuest) {
        throw new Error('任务不存在');
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
      // console.log('questLogCount', questLogCount);
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
      console.log('rewardResult', rewardResult);

      // 发送奖励
      // 计算获取奖励
      const processReward = (price: string, people: string) => {
        // console.log('1111', price, people)
        const BN = BigNumber.clone();
        BN.config({ DECIMAL_PLACES: 3 });
        const single = new BN(new BN(Number(price))).dividedBy(Number(people));
        return single.toString();
      };

      const amount = processReward(resultQuest.reward_price, resultQuest.reward_people);
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
      console.log('resultQuest', resultQuest, id);
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

  public async questCount() {
    const { logger, ctx } = this;
    const { id } = ctx.user;

    logger.info('questCount', new Date());

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    // const mysqlMatataki = this.app.mysql.get('matataki');

    try {

      // 查询全部任务
      const resultsAllQuests = await mysqlQuest.query('SELECT * FROM quests;');
      console.log('resultsAllQuests', resultsAllQuests);

      // 查询全部任务数量
      const resultsAllQuestsCount = await mysqlQuest.query('SELECT COUNT(1) AS count FROM quests;');
      const resultsQuests = resultsAllQuestsCount[0].count;
      console.log('resultsQuests', resultsQuests);

      // 查询Twitter任务数量
      const resultsAllQuestsTwitterCount = await mysqlQuest.query('SELECT COUNT(1) AS count FROM quests WHERE type = 0;');
      const resultsQuestsTwitter = resultsAllQuestsTwitterCount[0].count;
      console.log('resultsQuestsTwitter', resultsQuestsTwitter);

      // 查询领取记录做计算
      const resultsQuestsLogs = await mysqlQuest.query('SELECT qid FROM quests_logs;');
      console.log('resultsQuestsLogs', resultsQuestsLogs);

      // [ {qid: x}, {} ] ===> { x: count, y: count }
      const questsLogs = {};
      resultsQuestsLogs.forEach(i => {
        if (!questsLogs[i.qid]) {
          questsLogs[i.qid] = 0;
        }
        questsLogs[i.qid] = questsLogs[i.qid] += 1;
      });
      console.log('questsLogs', questsLogs);

      // 计算待完成的 比对总量
      // 查询领取完毕的 用总量 - 完成量
      let completed = 0;
      resultsAllQuests.forEach(i => {
        if (questsLogs[i.id] >= Number(i.reward_people)) {
          completed += 1;
        }
      });

      console.log('completed', completed);

      // 查询已完成
      const receiveFn = async id => {
        const resultsQuestsLogs = await mysqlQuest.query('SELECT COUNT(1) AS count FROM quests_logs WHERE uid = ?;', [ id ]);
        console.log('resultsQuestsLogs', resultsQuestsLogs);
        return resultsQuestsLogs[0].count;
      };

      // 我创建的
      const createFn = async id => {
        const resultsQuestsCount = await mysqlQuest.query('SELECT COUNT(1) AS count FROM quests WHERE uid = ?;', [ id ]);
        console.log('resultsQuestsCount', resultsQuestsCount);
        return resultsQuestsCount[0].count;
      };

      if (id) {

        const received = await receiveFn(id);
        const created = await createFn(id);

        return {
          code: 0,
          data: {
            all: resultsQuests,
            undone: Number(resultsQuests) - Number(completed),
            completed,
            received,
            created,
            type_twitter: resultsQuestsTwitter,
          },
        };
      }

      return {
        code: 0,
        data: {
          all: resultsQuests,
          undone: Number(resultsQuests) - Number(completed),
          completed,
          received: 0,
          created: 0,
          type_twitter: resultsQuestsTwitter,
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
        // console.log('resultUserStats', resultUserStats);
      } else {
        throw new Error('获取托管账户信息失败');
      }
      // console.log('userQuest', ctx.userQuest);
    } catch (e) {
      this.logger.error('getHostingInfo error: ', e);
      ctx.userQuest = {};
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
      console.log('resultTransfer', this.ctx.userQuest);

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

      console.log('resultUserTransfer', resultUserTransfer);
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
          console.log('发布奖励成功');
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
}
