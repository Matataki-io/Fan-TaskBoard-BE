// This file is created by egg-ts-helper@1.25.8
// Do not modify this file!!!!!!!!!

import 'egg';
type AnyClass = new (...args: any[]) => any;
type AnyFunc<T = any> = (...args: any[]) => T;
type CanExportFunc = AnyFunc<Promise<any>> | AnyFunc<IterableIterator<any>>;
type AutoInstanceType<T, U = T extends CanExportFunc ? T : T extends AnyFunc ? ReturnType<T> : T> = U extends AnyClass ? InstanceType<U> : U;
import ExportEthEvent from '../../../app/service/EthEvent';
import ExportTest from '../../../app/service/Test';
import ExportNft from '../../../app/service/nft';
import ExportQuest from '../../../app/service/quest';
import ExportToken from '../../../app/service/token';
import ExportTwitter from '../../../app/service/twitter';
import ExportTwitterBackup from '../../../app/service/twitterBackup';

declare module 'egg' {
  interface IService {
    ethEvent: AutoInstanceType<typeof ExportEthEvent>;
    test: AutoInstanceType<typeof ExportTest>;
    nft: AutoInstanceType<typeof ExportNft>;
    quest: AutoInstanceType<typeof ExportQuest>;
    token: AutoInstanceType<typeof ExportToken>;
    twitter: AutoInstanceType<typeof ExportTwitter>;
    twitterBackup: AutoInstanceType<typeof ExportTwitterBackup>;
  }
}
