// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportCookie from '../../../app/controller/cookie';
import ExportHome from '../../../app/controller/home';
import ExportMtk from '../../../app/controller/mtk';
import ExportNft from '../../../app/controller/nft';
import ExportOss from '../../../app/controller/oss';
import ExportQuest from '../../../app/controller/quest';
import ExportTest from '../../../app/controller/test';
import ExportToken from '../../../app/controller/token';
import ExportTwitter from '../../../app/controller/twitter';

declare module 'egg' {
  interface IController {
    cookie: ExportCookie;
    home: ExportHome;
    mtk: ExportMtk;
    nft: ExportNft;
    oss: ExportOss;
    quest: ExportQuest;
    test: ExportTest;
    token: ExportToken;
    twitter: ExportTwitter;
  }
}
