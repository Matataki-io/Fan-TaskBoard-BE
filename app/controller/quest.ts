import { Controller } from 'egg';
import { questInterface } from '../../typings/index';

interface paginationInterface {
  page?: number,
  size?: number,
}

interface myNftInterface extends paginationInterface {
  account?: string,
}

export default class QuestController extends Controller {
  public async CreateQuest() {
    const { ctx } = this;
    const { type, twitter_id, token_id, reward_people, reward_price }: questInterface = ctx.request.body;
    const result = await ctx.service.quest.CreateQuest({ type, twitter_id, token_id, reward_people, reward_price });
    if (result.code === 0) {
      ctx.body = {
        code: 0,
        message: 'success',
      };
    } else {
      ctx.body = result;
    }
  }
  public async getQuest() {
    const { ctx } = this;
    const { page = 1, size = 20, account = '' }: myNftInterface = ctx.request.query;
    const result = await ctx.service.quest.getQuest({ page, size, account });
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
