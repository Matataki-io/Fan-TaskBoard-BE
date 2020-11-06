import { Application } from 'egg';

export default (app: Application) => {
  const { controller, router } = app;

  router.get('/', controller.home.index);

  // x-api-key: 0d647f060a9e4e01b490f28d678eae5c
  // x-viewer-address: 0x47732d065d1493c35b188f3febf62a4a89ff2be7
  // 创建NFT
  router.post('/nft', controller.nft.CreateNft);
  router.get('/nft', controller.nft.getNft);
  router.get('/nft/:id', controller.nft.getNftId);
};
