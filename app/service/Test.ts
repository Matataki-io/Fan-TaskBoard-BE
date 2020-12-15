import { Service } from 'egg';

/**
 * Test Service
 */
export default class Test extends Service {

  /**
   * sayHi to you
   * @param name - your name
   */
  public async sayHi(name: string) {
    return `hi, ${name}`;
  }
  public async testDb() {
    const mysqlQuest = this.app.mysql.get('quest');

    const result = await mysqlQuest.query('SELECT * FROM quests;');
    this.logger.info('test db', result);
    return result;
  }
}
