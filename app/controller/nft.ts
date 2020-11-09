import { Controller } from 'egg';
import { nftInterface } from '../../typings/index';

interface paginationInterface {
  page?: number,
  size?: number,
}

export default class NftController extends Controller {
  public async CreateNft() {
    const { ctx } = this;
    const { tokenId, account, logo, name, externalLink, description }: nftInterface = ctx.request.body;
    const result = await ctx.service.nft.CreateNft({ tokenId, account, logo, name, externalLink, description });
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
    const { page = 0, size = 20 }: paginationInterface = ctx.request.query;
    const result = await ctx.service.nft.getNft({ page, size });
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
