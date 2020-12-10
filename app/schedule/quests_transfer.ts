import { Subscription } from 'egg';

// 任务领取奖励 定时执行转账
class QuestsTransfer extends Subscription {
  // 通过 schedule 属性来设置定时任务的执行间隔等配置
  static get schedule() {
    return {
      interval: '60s', // 1 分钟间隔
      type: 'all', // 指定所有的 worker 都需要执行
    };
  }

  // subscribe 是真正定时任务执行时被运行的函数
  async subscribe() {
    this.ctx.service.quest.receiveTransfer();
  }
}

module.exports = QuestsTransfer;
