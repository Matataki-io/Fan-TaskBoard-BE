import { Controller } from 'egg';
import * as ms from 'ms';

export default class CookieController extends Controller {
  public async index() {
    const { ctx, app } = this;
    this.logger.info('app', app.config.env);
    const { accessToken } = ctx.request.body;
    this.logger.info('accessToken', accessToken);

    try {
      ctx.cookies.set('access-token', accessToken, {
        sameSite: 'none',
        secure: app.config.env === 'prod',
        maxAge: ms('7d'),
      });

      ctx.body = {
        code: 0,
        data: accessToken,
      };
    } catch (error) {
      this.logger.error('set cookie', error);
      ctx.body = {
        code: 0,
        data: accessToken,
        error: error.toString(),
      };
    }
  }
  public async remove() {
    const { ctx, app } = this;
    ctx.cookies.set('access-token', null, {
      sameSite: 'none',
      secure: app.config.env === 'prod',
    });
    ctx.status = 204;
  }
}
