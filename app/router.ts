import { Application } from 'egg';
import passport from './passport';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.home.index);

  // x-api-key: 0d647f060a9e4e01b490f28d678eae5c
  // x-viewer-address: 0x47732d065d1493c35b188f3febf62a4a89ff2be7
  // 创建 NFT
  router.post('/nft', controller.nft.CreateNft);
  // 查看所有 NFT
  router.get('/nft', controller.nft.getNft);
  // 查看 NFT 详情
  router.get('/nft/:id', controller.nft.getNftId);
  // logo 上传
  router.post('/image/logo', controller.oss.upload);

  // 创建任务
  router.post('/quest', passport.authorize, controller.quest.CreateQuest);
  // 获取所有任务
  router.get('/quest', passport.verify, controller.quest.getQuest);
  // 获取任务统计
  router.get('/quest/count', passport.verify, controller.quest.questCount);
  // 获取任务详情
  router.get('/quest/:id', passport.verify, controller.quest.getQuestDetail);
  // 获取任务详情列表
  router.get('/quest/:id/list', passport.verify, controller.quest.getQuestDetailList);
  // 领取奖励
  router.post('/receive', passport.authorize, controller.quest.receive);

  // 搜索twitter用户
  router.get('/users/search/twitter', controller.twitter.usersSearch);

  // 获取Fan票列表，支持分页和搜索。
  router.get('/token/list', controller.token.getList);

  // MTK API
  router.get('/user/stats', controller.mtk.userProfile);
  router.get('/account/list', controller.mtk.accountList);
  router.get('/token/tokenlist', controller.mtk.tokenTokenList);

  // test
  router.get('/test', controller.twitter.test);
  router.get('/testdb', controller.test.testDb);
  router.get('/testdbm', controller.test.testDbM);

};
