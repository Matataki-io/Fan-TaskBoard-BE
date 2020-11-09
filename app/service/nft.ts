import { Service } from 'egg';
import * as moment from 'moment';
import { nftInterface } from '../../typings/index';

interface paginationInterface {
  page: number,
  size: number,
}
interface tokenIdInterface {
  id: string,
}

/**
 * Nft Service
 */
export default class Nft extends Service {
  public async CreateNft({ tokenId, account, logo, name, externalLink, description }: nftInterface) {
    try {
      this.logger.info('create nfts', new Date());
      const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
      const data: nftInterface = {
        tokenId,
        account,
        signature: '',
        logo,
        name,
        externalLink,
        description,
        status: 1,
        create_time: time,
        update_time: time,
      };
      const result = await this.app.mysql.insert('nfts', data);
      const insertSuccess = result.affectedRows === 1;
      console.log('insertSuccess', insertSuccess);
      return {
        code: 0,
      };
    } catch (e) {
      this.logger.error('create nft error: ', e);
      return {
        code: -1,
        message: `create nft error ${e}`,
      };
    }
  }

  public async getNft({ page, size }: paginationInterface) {
    try {
      this.logger.info('get nfts', new Date());
      const results = await this.app.mysql.select('nfts', {
        columns: [ 'tokenId', 'account', 'transactionHash', 'tx', 'logo', 'name', 'externalLink', 'description' ],
        orders: [[ 'create_time', 'desc' ], [ 'tokenId', 'desc' ]], // 排序方式
        limit: Number(size), // 返回数据量
        offset: (page - 1) * size, // 数据偏移量
      });
      const countResults = await this.app.mysql.query('SELECT COUNT(1) as count from nfts;');
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
        columns: [ 'tokenId', 'account', 'transactionHash', 'tx', 'logo', 'name', 'externalLink', 'description', 'create_time' ],
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
