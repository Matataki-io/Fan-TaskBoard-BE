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

  router.post('/quest', passport.authorize, controller.quest.CreateQuest);
  router.get('/quest', controller.quest.getQuest);

  // 搜索twitter用户
  router.get('/users/search/twitter', controller.twitter.usersSearch);

};
