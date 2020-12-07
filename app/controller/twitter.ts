import { Controller } from 'egg';


export default class HomeController extends Controller {
  public async usersSearch() {
    const { ctx } = this;
    const { q, count = 5 } = ctx.request.query;
    if (q) {
      ctx.body = await ctx.service.twitter.usersSearch({ q, count });
    } else {
      ctx.body = {
        code: -1,
        message: 'please input search content',
      };
    }

  }
}
