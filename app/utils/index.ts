import { isArray } from 'lodash';

/**
 * sql查询结果的数据格式化 [ {} ] ===> [ [{}], [{}], [{}] ]
 * @param arr 需要处理的数组
 */
export const sqlResultTransformArray = (arr: any[]) => {
  if (isArray(arr[0])) {
    return arr;
  }
  return arr.map(i => [ i ]);
};

/**
 * 数据格式化 [ [{}], [{}], [{}] ] ===> [ {} ]
 * @param arr 需要处理的数组
 */
export const transformForOneArray = (arr: any[]) => {
  if (isArray(arr[0])) {
    return [].concat(...arr);
  }
  return arr;
};

/**
 * 小数处理
 * @param amount 需要处理的数据
 * @param deciimal 保留的小数位
 * @return 金额
 */
export const decimalProcessing = (amount: string, deciimal = 4) => {
  const idx = amount.indexOf('.');
  if (~idx) {
    // 位数 + 小数点 + 位置
    const _amount = amount.substring(0, deciimal + 1 + idx);
    return _amount;
  }
  return amount;
};
