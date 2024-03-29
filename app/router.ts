import { Application } from 'egg';
import passport from './passport';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.home.index);
  // 创建任务
  router.post('/quest', passport.authorize, controller.quest.CreateQuest);
  // 获取所有任务
  router.get('/quest', passport.verify, controller.quest.getQuest);
  // 获取任务统计
  router.get('/quest/count', passport.verify, controller.quest.questCount);
  // 获取自己的所有任务
  router.get('/quest/all', passport.authorize, controller.quest.questAll);
  // 结束任务
  router.put('/quest/end', passport.authorize, controller.quest.questEnd);
  // 更新任务
  router.put('/quest/:id', passport.authorize, controller.quest.UpdateQuest);
  // 获取任务详情
  router.get('/quest/:id', passport.verify, controller.quest.getQuestDetail);
  // 获取任务详情列表
  router.get('/quest/:id/list', passport.verify, controller.quest.getQuestDetailList);
  // 获取任务详情申请列表
  router.get('/apply/:id/list', passport.verify, controller.quest.getQuestDetailApplyList);
  // 领取奖励
  router.post('/receive', passport.authorize, controller.quest.receive);
  // 领取奖励 key
  router.post('/receive/key', passport.authorize, controller.quest.receiveKey);

  // 申请
  router.post('/apply', passport.authorize, controller.quest.apply);
  // 申请同意
  router.post('/apply/agree', passport.authorize, controller.quest.applyAgree);
  // 申请拒绝
  router.delete('/apply/reject', passport.authorize, controller.quest.applyReject);
  // 全部任务的申请
  router.get('/apply/all', passport.verify, controller.quest.applyAll);

  // 转推
  // 验证 推 是否存在
  router.get('/statuses/showId', passport.authorize, controller.quest.statusesShowId);
  // 领取奖励 转推
  router.post('/receive/retweet', passport.authorize, controller.quest.receiveRetweet);

  // 搜索twitter用户
  router.get('/users/search/twitter', controller.twitter.usersSearch);

  // 获取Fan票列表，支持分页和搜索。
  router.get('/token/list', controller.token.getList);

  // 待发放奖励
  router.get('/pendingRewards', controller.quest.pendingRewards);

  // MTK API
  router.get('/user/stats', controller.mtk.userProfile);
  router.get('/account/list', controller.mtk.accountList);
  router.get('/token/tokenlist', controller.mtk.tokenTokenList);

  // set cookie
  router.post('/cookie', controller.cookie.index);
  router.put('/cookie', controller.cookie.remove);

  // test
  router.get('/test', controller.twitter.test);
  router.get('/testRetweet', controller.quest.retweetStatus);
  router.get('/testdb', controller.test.testDb);
  router.get('/testdbm', controller.test.testDbM);

};
