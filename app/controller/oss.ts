import { Controller } from 'egg';
// import * as path from 'path';
import * as fs from 'mz/fs';
import * as moment from 'moment';
import * as md5 from 'crypto-js/md5';

export default class OssController extends Controller {
  public async upload() {
    const ctx = this.ctx;
    const file = ctx.request.files[0];

    this.logger.info('upload files %s', file);
    // 文件上OSS的路径
    // const name = 'nft-test/' + path.basename(file.filename);
    const time = moment().format('YYYY/MM/DD/');
    const filepathMd5 = md5(file.filepath).toString();
    const filetype = file.filename.split('.');
    const name = `${this.config.ossName}/${time}${filepathMd5}.${filetype[filetype.length - 1]}`;

    let result;
    try {
      result = await ctx.oss.put(name, file.filepath);
    } catch (e) {
      this.logger.error('upload image error %i', e);
      result = null; // 清空一下
    } finally {
      await fs.unlink(file.filepath);
    }

    if (result) {
      this.logger.info('get oss object: %j', result);
      // ctx.unsafeRedirect(result.url);
      ctx.body = {
        code: 0,
        data: `/${result.name}`,
        message: 'success',
      };
    } else {
      ctx.body = {
        code: -1,
        message: 'please select a file to upload！',
      };
    }
  }
}
