import { Service } from 'egg';
import * as moment from 'moment';
import { questInterface, friendshipsProps } from '../../typings/index';
import { isEmpty } from 'lodash';
import BigNumber from 'bignumber.js';

interface paginationInterface {
  page: number,
  size: number,
}

interface myNftInterface extends paginationInterface {
  account: string,
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
    this.logger.info('create quest submit', new Date());
    const { ctx } = this;
    const { id } = ctx.user;

    try {

      // 判断参数
      const questData = { type, twitter_id, token_id, reward_people, reward_price };
      const typeList = [ 0 ];
      if (!typeList.includes(Number(questData.type))) {
        throw new Error('请选择任务类型');
      }

      for (const key in questData) {
        // 忽略type
        if (key !== 'type' && !questData[key].trim()) {
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
          memo: 'Matataki Quest 任务创建奖池',
          to: ctx.userQuest.id,
          tokenId: token_id,
        },
      });
      console.log('CreateQuest resultUserTransfer', resultUserTransfer, token);
      if (resultUserTransfer.status === 200 && resultUserTransfer.data.code === 0) {
        //
      } else {
        throw new Error('支付失败');
      }

      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      const data: questInterface = {
        uid: id,
        type,
        twitter_id,
        token_id,
        reward_people,
        reward_price,
        hash: resultUserTransfer.data.data.tx_hash,
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
      // [{}] [{}, {}]
      const results = await mysqlQuest.select('quests', data);
      console.log('results', results);

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
      const screenNameArr = results.map((i: any) => i.type === 0 && i.twitter_id);
      const screenNameStr = screenNameArr.join(',');

      const usersTwitter = await this.service.twitter.usersLookup(screenNameStr);
      // console.log('usersTwitter', usersTwitter);

      results.forEach((i: any) => {
        if (i.type === 0) { // Twitter 任务 查询用户信息
          i = Object.assign(i, usersTwitter[i.twitter_id]);
        }
      });

      // 没有登陆不查询 Twitter 关注信息 领取信息 直接返回
      if (!id) {

        // 补充默认参数
        results.forEach((i: any) => {
          i.receive = false;
          i.following = false;
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
    this.logger.info('receive', new Date());

    const { ctx } = this;
    // 获取用户 uid
    const { id } = ctx.user;

    // 设置托管信息
    if (isEmpty(ctx.userQuest)) {
      await this.getHostingInfo();
    }

    if (!ctx.userQuest.id) {
      throw new Error('没有托管信息');
    }

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const mysqlMatataki = this.app.mysql.get('matataki');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
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
      if (resultQuest.type === 0) { // Twitter 关注任务
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

    const token = await this.getToken();
    if (!token) {
      throw new Error('没有token');
    }

    // init mysql
    const mysqlQuest = this.app.mysql.get('quest');
    const connQuest = await mysqlQuest.beginTransaction(); // 初始化事务

    try {
      // 获取所有需要处理的列表
      const resultTransfer = await connQuest.query('SELECT * FROM quests_transfer_logs WHERE hash = \'\' ORDER BY create_time ASC LIMIT 0, 1;');
      console.log('resultTransfer', this.ctx.userQuest);

      if (!resultTransfer.length) {
        return;
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
