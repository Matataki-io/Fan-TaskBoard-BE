import { Service } from 'egg';
import { ethers } from 'ethers';
import * as MatatakiNFT from '../abi/MatatakiNFT.json';
import * as moment from 'moment';


interface updateInterface {
  tokenId: string,
  account: string,
  transactionHash: string,
  tx: string
}

/**
 * EthEvent Service
 */
export default class EthEvent extends Service {

  private async update({ tokenId, account, transactionHash, tx }: updateInterface) {
    const time: string = moment().format('YYYY-MM-DD HH:mm:ss');

    // 修改数据，将会根据主键 ID 查找，并更新
    const row = {
      tokenId,
      account,
      transactionHash,
      tx,
      status: 0,
      update_time: time,
    };
    const options = {
      where: {
        tokenId,
        account,
      },
    };
    const result = await this.app.mysql.update('nfts', row, options);


    // 判断更新成功
    const updateSuccess = result.affectedRows === 1;
    console.log('updateSuccess', updateSuccess);
  }

  public async index() {
    this.logger.info('eth event start...', new Date());

    try {
      // const provider = ethers.getDefaultProvider('rinkeby');
      const provider = new ethers.providers.JsonRpcProvider('https://eth-rinkeby.alchemyapi.io/v2/SLFdIfubZlDvaKjRv-rP3Ie0msesJydB');
      const contract = new ethers.Contract(this.config.MatatakiNFTAddress, MatatakiNFT, provider);

      // const contractName = await contract.name();
      // console.log('current name', contractName);

      contract.on('Transfer', (address, to, tokenId, event) => {

        this.update({ tokenId: tokenId.toString(), account: to, transactionHash: event.transactionHash, tx: JSON.stringify(event) });

        console.log(address);
        console.log(to);
        console.log(tokenId);
        console.log(tokenId.toString());
        // 查看后面的事件触发器  Event Emitter 了解事件对象的属性
        console.log(event);
        console.log(event.blockNumber);
      });
    } catch (e) {
      console.log('eth event error', e);
    }
  }
}
