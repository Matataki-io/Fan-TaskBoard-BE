// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportHome from '../../../app/controller/home';
import ExportMtk from '../../../app/controller/mtk';
import ExportNft from '../../../app/controller/nft';
import ExportOss from '../../../app/controller/oss';
import ExportQuest from '../../../app/controller/quest';
import ExportToken from '../../../app/controller/token';
import ExportTwitter from '../../../app/controller/twitter';

declare module 'egg' {
  interface IController {
    home: ExportHome;
    mtk: ExportMtk;
    nft: ExportNft;
    oss: ExportOss;
    quest: ExportQuest;
    token: ExportToken;
    twitter: ExportTwitter;
  }
}
