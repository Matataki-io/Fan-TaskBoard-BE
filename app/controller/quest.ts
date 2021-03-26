import { Controller } from 'egg';
import { questInterface } from '../../typings/index';
import { isEmpty } from 'lodash';

interface paginationInterface {
  page?: number,
  size?: number,
}

interface getQuestProps extends paginationInterface {
  account?: string
  sort?: string
  token?: string | number
  type?: string
  filter?: string
}

export default class QuestController extends Controller {
  public async CreateQuest() {
    const { ctx } = this;
    const { type, title = '', content = '', key = '', twitter_id, twitter_status, twitter_status_url, token_id, reward_people, reward_price }: questInterface = ctx.request.body;
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
    } else if (Number(type) === 2) {
      // 解谜任务
      const result = await ctx.service.quest.CreateQuestKey({ type, title, content, key, token_id, reward_people, reward_price });
      const resultFormat = {
        code: 0,
        message: 'success',
      };
      ctx.body = Object.assign(resultFormat, result);
    } else if (Number(type) === 3) {
      // 转推任务
      const result = await ctx.service.quest.CreateQuestRetweet({ type, twitter_status, twitter_status_url, token_id, reward_people, reward_price });
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
  public async UpdateQuest() {
    const { ctx } = this;
    const { id } = ctx.params;
    const { type, title = '', content = '', key = '' } = ctx.request.body;
    const result = await ctx.service.quest.UpdateQuest({ qid: id, type, title: title.trim(), content: content.trim(), key: key.trim() });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async getQuest() {
    const { ctx } = this;
    const { page = 1, size = 20, account = '', sort = 'new', token = '', type = '', filter = '' }: getQuestProps = ctx.request.query;
    const result = await ctx.service.quest.getQuest({ page, size, account, sort, token, type, filter });
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
  public async receiveKey() {
    const { ctx } = this;
    const { qid, key } = ctx.request.body;
    const result = await ctx.service.quest.receiveKey({ qid, key });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async receiveRetweet() {
    const { ctx } = this;
    const { qid } = ctx.request.body;
    const result = await ctx.service.quest.receiveRetweet({ qid });
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
  public async applyAll() {
    const { ctx } = this;
    const result = await ctx.service.quest.applyAll();
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
    const { type = '', token = '' } = ctx.request.query;
    const result = await ctx.service.quest.questCount({ type, token });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async questAll() {
    const { ctx } = this;
    const result = await ctx.service.quest.questAll();
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async questEnd() {
    const { ctx } = this;
    const { qid } = ctx.request.body;
    const result = await ctx.service.quest.questEnd({ qid });
    const resultFormat = {
      code: 0,
      message: 'success',
    };
    ctx.body = Object.assign(resultFormat, result);
  }
  public async pendingRewards() {
    const { ctx } = this;
    const result = await ctx.service.quest.pendingRewards();
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
  public async retweetStatus() {
    const { ctx } = this;
    const { screen_name, tweetId } = ctx.request.query;
    const result = await ctx.service.twitter.statusesUserTimeline({ screen_name });

    console.log('screen_name', screen_name, tweetId);

    if (result.code === 0) {

      const list = result.data.filter(i => (!isEmpty(i.retweeted_status) && i.text.includes('RT')));
      // console.log('list', list);

      const res = list.find(i => i.retweeted_status.id_str === tweetId);

      if (isEmpty(res)) {
        console.log('没有转推');
      } else {
        console.log('已经转推了');
      }

      ctx.body = {
        code: 0,
        message: 'success',
        data: list,
      };
    } else {
      ctx.body = result;
    }
  }
  public async statusesShowId() {
    const { id } = this.ctx.request.query;
    this.ctx.body = await this.service.twitter.statusesShowId({ id: String(id) });
  }
}
