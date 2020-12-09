import { Service } from 'egg';

/**
 * Twitter Service
 */
export default class Token extends Service {
  public async getList(page, pagesize, search) {
    try {
      const searchSql = ' AND (LOWER(name) LIKE concat("%", :search, "%") OR LOWER(symbol) LIKE concat("%", :search, "%"))';
      const sql = `
        SELECT
          id, uid, name, symbol, decimals, logo, brief, contract_address, create_time
        FROM
          minetokens
        WHERE
          \`status\` = 1${search ? searchSql : ''}
        LIMIT
          :offset, :limit;

        SELECT
          COUNT(0) as count
        FROM
          minetokens
        WHERE
          \`status\` = 1${search ? searchSql : ''};
      `;
      const mysqlQuest = this.app.mysql.get('matataki');
      const result = await mysqlQuest.query(sql, {
        offset: (page - 1) * pagesize,
        limit: pagesize,
        search,
      });
      return {
        list: result[0],
        count: result[1][0],
      };
    } catch (e) {
      this.logger.error('[Get token list error]: ', e);
      return {
        list: [],
        count: 0,
      };
    }
  }
}
