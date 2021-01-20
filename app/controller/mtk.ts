import { Controller } from 'egg';
export default class MTKController extends Controller {
  public async accountList() {
    const { ctx } = this;
    const token = ctx.cookies.get('access-token');

    if (!token) {
      throw new Error('没有令牌');
    }

    try {
      const result = await ctx.curl(`${this.config.mtkApi}/account/list`, {
        dataType: 'json',
        method: 'GET',
        contentType: 'json',
        headers: {
          'x-access-token': token,
        },
        timeout: 30 * 1000,
      });

      ctx.body = result.data;
    } catch (error) {
      ctx.body = error;
    }
  }
  public async userProfile() {
    const { ctx } = this;
    const token = ctx.cookies.get('access-token');

    try {

      if (!token) {
        throw new Error('没有令牌');
      }

      const result = await ctx.curl(`${this.config.mtkApi}/user/stats`, {
        dataType: 'json',
        method: 'GET',
        contentType: 'json',
        headers: {
          'x-access-token': token,
        },
        timeout: 30 * 1000,
      });

      ctx.body = result.data;
    } catch (error) {
      ctx.body = error;
    }
  }
  public async tokenTokenList() {
    const { ctx } = this;
    const token = ctx.cookies.get('access-token');
    const { pagesize, order } = ctx.request.query;

    if (!token) {
      throw new Error('没有令牌');
    }

    try {
      const result = await ctx.curl(`${this.config.mtkApi}/token/tokenlist?pagesize=${pagesize}&order=${order}`, {
        dataType: 'json',
        method: 'GET',
        contentType: 'json',
        headers: {
          'x-access-token': token,
        },
        timeout: 30 * 1000,
      });

      ctx.body = result.data;
    } catch (error) {
      ctx.body = error;
    }
  }
}
