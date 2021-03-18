import { Controller } from 'egg';


export default class HomeController extends Controller {
  public async usersSearch() {
    const { ctx } = this;
    const { q, count = 5 } = ctx.request.query;
    if (q) {
      const res = await ctx.service.twitter.usersSearch({ q, count });
      if (res.code === 0) {
        const list = res.data.map((i: any) => ({
          id: i.id,
          id_str: i.id_str,
          name: i.name,
          screen_name: i.screen_name,
          profile_image_url_https: i.profile_image_url_https,
        }));
        ctx.body = {
          code: 0,
          data: list,
          message: 'success',
        };
      } else {
        ctx.body = res;
      }
    } else {
      ctx.body = {
        code: -1,
        message: 'please input search content',
      };
    }
  }
  public async test() {
    const { ctx } = this;
    ctx.body = await ctx.service.twitter.test1();
  }
}
