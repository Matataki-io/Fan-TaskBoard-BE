import { Service } from 'egg';
import * as moment from 'moment';
import { nftInterface } from '../../typings/index';

interface paginationInterface {
  page: number,
  size: number,
}

interface myNftInterface extends paginationInterface {
  account: string,
}

interface tokenIdInterface {
  id: string,
}

/**
 * Nft Service
 */
export default class Nft extends Service {
  public async CreateNft({ account, logo, name, externalLink, description }: nftInterface) {
    try {
      this.logger.info('create nfts submit', new Date());

      const nftSubmitResult = await this.app.mysql.select('nftsSubmit', {
        where: { account },
        columns: [ 'account' ],
      });
      this.logger.info('nftSubmitResult', nftSubmitResult);

      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');

      // 更新
      if (nftSubmitResult.length) {
        const row = {
          logo,
          name,
          externalLink,
          description,
          update_time: time,
        };

        const options = {
          where: {
            account,
          },
        };

        const result = await this.app.mysql.update('nftsSubmit', row, options);
        const updateSuccess = result.affectedRows === 1;

        if (updateSuccess) {
          return { code: 0 };
        }
        throw new Error(`update faild ${result}`);
      } else { // 插入
        const data: nftInterface = {
          account,
          logo,
          name,
          externalLink,
          description,
          create_time: time,
          update_time: time,
        };

        const result = await this.app.mysql.insert('nftsSubmit', data);
        const insertSuccess = result.affectedRows === 1;

        if (insertSuccess) {
          return { code: 0 };
        }
        throw new Error(`insert faild ${result}`);
      }
    } catch (e) {
      this.logger.error('create nft error: ', e);
      return {
        code: -1,
        message: `create nft error ${e}`,
      };
    }
  }

  public async getNft({ page, size, account }: myNftInterface) {
    try {
      this.logger.info('get nfts', new Date());
      let data: any = {
        columns: [ 'tokenId', 'account', 'transactionHash', 'logo', 'name', 'externalLink', 'description' ],
        orders: [[ 'create_time', 'desc' ], [ 'tokenId', 'desc' ]], // 排序方式
        limit: Number(size), // 返回数据量
        offset: (page - 1) * size, // 数据偏移量
      };

      if (account) {
        data = { ...data, where: { account } };
      }
      const results = await this.app.mysql.select('nfts', data);

      let sql = 'SELECT COUNT(1) as count from nfts';
      if (account) {
        sql += ` WHERE account = '${account}'`;
      }
      sql += ';';
      const countResults = await this.app.mysql.query(sql);
      return {
        count: countResults[0].count,
        list: results,
      };
    } catch (e) {
      this.logger.error('get nft error: ', e);
      return {
        count: 0,
        list: [],
      };
    }
  }
  public async getNftId({ id }: tokenIdInterface) {
    try {
      this.logger.info('get nfts', new Date());
      const results = await this.app.mysql.select('nfts', {
        where: { tokenId: id },
        columns: [ 'tokenId', 'account', 'transactionHash', 'logo', 'name', 'externalLink', 'description', 'create_time' ],
      });
      return {
        code: 0,
        data: results[0] || {},
      };
    } catch (e) {
      this.logger.error('get nft id error: ', id, e);
      return {
        code: -1,
        message: `get nft id error ${id} ${e}`,
      };
    }
  }
}
