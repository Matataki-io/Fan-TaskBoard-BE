import { Controller } from 'egg';
import { questInterface } from '../../typings/index';

interface paginationInterface {
  page?: number,
  size?: number,
}

interface getQuestProps extends paginationInterface {
  account?: string
  sort?: string
  token?: string | number
  filter?: string
}

interface receiveProps {
  qid: number,
}

export default class QuestController extends Controller {
  public async CreateQuest() {
    const { ctx } = this;
    const { type, twitter_id, token_id, reward_people, reward_price }: questInterface = ctx.request.body;
    const result = await ctx.service.quest.CreateQuest({ type, twitter_id, token_id, reward_people, reward_price });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async getQuest() {
    const { ctx } = this;
    const { page = 1, size = 20, account = '', sort = 'new', token = '', filter = '' }: getQuestProps = ctx.request.query;
    const result = await ctx.service.quest.getQuest({ page, size, account, sort, token, filter });
    ctx.body = {
      code: 0,
      message: 'success',
      data: result,
    };
  }
  public async getQuestDetail() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { type } = ctx.request.query;
    const result = await ctx.service.quest.getQuestDetail({ qid: id, type });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async getQuestDetailList() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { type } = ctx.request.query;
    const result = await ctx.service.quest.getQuestDetailList({ qid: id, type });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async receive() {
    const { ctx } = this;
    const { qid }: receiveProps = ctx.request.body;
    const result = await ctx.service.quest.receive(qid);
    if (result.code === 0) {
      ctx.body = {
        code: 0,
        message: 'success',
      };
    } else {
      ctx.body = result;
    }
  }
  public async questCount() {
    const { ctx } = this;
    const result = await ctx.service.quest.questCount();
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
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
