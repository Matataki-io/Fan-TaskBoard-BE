// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportHome from '../../../app/controller/home';
import ExportNft from '../../../app/controller/nft';
import ExportOss from '../../../app/controller/oss';
import ExportQuest from '../../../app/controller/quest';
import ExportTwitter from '../../../app/controller/twitter';

declare module 'egg' {
  interface IController {
    home: ExportHome;
    nft: ExportNft;
    oss: ExportOss;
    quest: ExportQuest;
    twitter: ExportTwitter;
  }
}
