import { Controller } from 'egg';
import * as ms from 'ms';

export default class CookieController extends Controller {
  public async index() {
    const { ctx } = this;
    const { accessToken } = ctx.request.body;
    console.log('accessToken', accessToken);

    ctx.cookies.set('access-token', accessToken, {
      sameSite: 'none',
      maxAge: ms('7d'),
    });

    ctx.body = {
      code: 0,
      data: accessToken,
    };
  }
  public async remove() {
    const ctx = this.ctx;
    ctx.cookies.set('access-token', null);
    ctx.status = 204;
  }
}
