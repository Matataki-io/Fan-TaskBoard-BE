import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;
  const domainWhiteList: string[] = [];

  // override config from framework / plugin
  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1604646854915_2627';

  config.security = {
    domainWhiteList,
    csrf: {
      enable: false,
    },
  };
  config.proxy = true;
  config.cors = {
    origin: ctx => {
      if (domainWhiteList.includes(ctx.request.header.origin)) {
        return ctx.request.header.origin;
      }
    },
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH,OPTIONS',
    credentials: true,
  };

  // add your egg config in here
  config.middleware = [];

  // add your special config in here
  const bizConfig = {
    sourceUrl: `https://github.com/eggjs/examples/tree/master/${appInfo.name}`,
  };

  // the return config will combines to EggAppConfig
  return {
    ...config,
    ...bizConfig,
  };
};
