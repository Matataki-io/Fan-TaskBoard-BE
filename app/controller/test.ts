import { Controller } from 'egg';
export default class TestController extends Controller {
  public async testDb() {
    const { ctx } = this;
    ctx.body = await ctx.service.test.testDb();
  }
}
