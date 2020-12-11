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
