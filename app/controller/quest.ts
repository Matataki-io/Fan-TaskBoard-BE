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

export default class QuestController extends Controller {
  public async CreateQuest() {
    const { ctx } = this;
    const { type, title = '', content = '', twitter_id, token_id, reward_people, reward_price }: questInterface = ctx.request.body;
    if (Number(type) === 0) {
      // twitter
      const result = await ctx.service.quest.CreateQuestTwitter({ type, twitter_id, token_id, reward_people, reward_price });
      const resultFormat = {
        code: 0,
        message: 'success',
      };
      ctx.body = Object.assign(resultFormat, result);
    } else if (Number(type) === 1) {
      // 自定义任务
      const result = await ctx.service.quest.CreateQuestCustomTask({ type, title, content, token_id, reward_people, reward_price });
      const resultFormat = {
        code: 0,
        message: 'success',
      };
      ctx.body = Object.assign(resultFormat, result);
    } else {
      ctx.body = {
        code: -1,
        message: 'faild',
      };
    }

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
    const result = await ctx.service.quest.getQuestDetail({ qid: id });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async getQuestDetailList() {
    const { ctx } = this;
    const { id } = ctx.params;
    const result = await ctx.service.quest.getQuestDetailList({ qid: id });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async getQuestDetailApplyList() {
    const { ctx } = this;
    const { id } = ctx.params;
    const result = await ctx.service.quest.getQuestDetailApplyList({ qid: id });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async receive() {
    const { ctx } = this;
    const { qid } = ctx.request.body;
    const result = await ctx.service.quest.receiveTwitter(qid);
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async apply() {
    const { ctx } = this;
    const { qid, remark } = ctx.request.body;

    const result = await ctx.service.quest.apply(qid, remark);
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async applyAgree() {
    const { ctx } = this;
    const { qid, uid } = ctx.request.body;
    const result = await ctx.service.quest.applyAgree({ qid, uid });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async applyReject() {
    const { ctx } = this;
    const { qid, uid } = ctx.request.body;

    const result = await ctx.service.quest.applyReject({ qid, uid });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
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
