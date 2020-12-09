import { Controller } from 'egg';

interface getListQueryInterface {
  page: number | string,
  pagesize: number | string,
  search?: string
}


export default class TokenController extends Controller {

  public async getList() {
    const { ctx } = this;
    const { page = 1, pagesize = 20, search }: getListQueryInterface = (ctx.request.query as any);
    const result = await ctx.service.token.getList(Number(page), Number(pagesize), search);
    ctx.body = {
      code: 0,
      message: 'success',
      data: result,
    };
  }
}
