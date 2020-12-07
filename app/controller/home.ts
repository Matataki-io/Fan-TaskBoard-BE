import { Controller } from 'egg';

import { T } from '../utils/twitter';

export default class HomeController extends Controller {
  public async index() {
    const { ctx } = this;

    await new Promise((resolve: any) => {
      T.get('users/search', { q: 'XiaoTianIsMe', count: 2 }, function(error, data) {
        console.log('error', error);
        console.log('data', data);
        resolve(data);
      });
    });


    ctx.body = await ctx.service.test.sayHi('egg');
  }
}
