import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};

  config.mysql = {
    clients: {
      quest: {
        host: '',
        port: '3306',
        user: '',
        password: '',
        database: '',
        // ssl: {},
        charset: 'utf8mb4',
      },
      matataki: {
        host: '',
        port: '3306',
        user: '',
        password: '',
        database: '',
        ssl: {},
        multipleStatements: true,
        charset: 'utf8mb4',
      },
    },
    default: {
      multipleStatements: true,
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
  };

  // mulitpart
  config.multipart = {
    mode: 'file',
    tmpdir: './uploads',
  };
  // OSS Config
  config.oss = {
    client: {
      accessKeyId: '',
      accessKeySecret: '',
      bucket: '',
      endpoint: '',
      timeout: '60s',
    },
  };
  // OSS Name Prefix
  config.ossName = 'nft';
  // Matataki NFT Address
  config.MatatakiNFTAddress = '';
  // JWT Secret
  config.jwtTokenSecret = '';

  // Twitter Config
  config.twitter = {
    consumer_key: '',
    consumer_secret: '',
    access_token_key: '',
    access_token_secret: '',
  };
  // Matataki Api Url
  config.mtkApi = '';
  // Matataki Managed User Accounts
  config.mtkUser = {
    username: '',
    password: '',
  };

  return config;
};
