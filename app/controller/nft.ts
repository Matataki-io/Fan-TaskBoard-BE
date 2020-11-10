import { Controller } from 'egg';
import { nftInterface } from '../../typings/index';

interface paginationInterface {
  page?: number,
  size?: number,
}

interface myNftInterface extends paginationInterface {
  account?: string,
}

export default class NftController extends Controller {
  public async CreateNft() {
    const { ctx } = this;
    const { account, logo, name, externalLink, description }: nftInterface = ctx.request.body;
    const result = await ctx.service.nft.CreateNft({ account, logo, name, externalLink, description });
    if (result.code === 0) {
      ctx.body = {
        code: 0,
        message: 'success',
      };
    } else {
      ctx.body = result;
    }
  }
  public async getNft() {
    const { ctx } = this;
    const { page = 1, size = 20, account = '' }: myNftInterface = ctx.request.query;
    const result = await ctx.service.nft.getNft({ page, size, account });
    ctx.body = {
      code: 0,
      message: 'success',
      data: result,
    };
  }
  public async getNftId() {
    const { ctx } = this;
    const { id } = ctx.params;
    const result = await ctx.service.nft.getNftId({ id });
    if (result.code === 0) {
      ctx.body = {
        code: 0,
        message: 'success',
        data: result.data,
      };
    } else {
      ctx.body = result;
    }
  }
}
