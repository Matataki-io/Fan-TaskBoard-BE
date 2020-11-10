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
    const nftSubmitResult = await this.app.mysql.select('nftsSubmit', {
      where: { account },
      columns: [ 'logo', 'name', 'externalLink', 'description' ],
    });

    this.logger.info('eth event nftSubmitResult', nftSubmitResult);

    if (!nftSubmitResult.length) return;

    const time: string = moment().format('YYYY-MM-DD HH:mm:ss');
    const { logo, name, externalLink, description } = nftSubmitResult[0];

    const row = {
      tokenId,
      account,
      transactionHash,
      tx,
      signature: '',
      logo,
      name,
      externalLink,
      description,
      create_time: time,
      update_time: time,
    };
    const result = await this.app.mysql.insert('nfts', row);

    const updateSuccess = result.affectedRows === 1;
    if (updateSuccess) {
      this.logger.info('updateSuccess', updateSuccess);
    } else {
      this.logger.error('updateFaild', updateSuccess);
    }

  }

  public async index() {
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
