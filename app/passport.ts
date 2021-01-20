import * as jwt from 'jwt-simple';

export default {
  // 验证登录，未登录抛异常
  async authorize(ctx, next) {
    const token = ctx.cookies.get('access-token');

    // 没有authorization token信息
    if (token === undefined) {
      ctx.status = 401;
      ctx.body = { code: 401, message: '未授权' };
      return;
    }

    ctx.user = {};
    ctx.user.isAuthenticated = false;

    // 校验 token， 解密， 验证token的可用性 ，检索里面的用户
    try {
      const decoded = jwt.decode(token, ctx.app.config.jwtTokenSecret);

      if (decoded.exp <= Date.now()) {
        ctx.throw(401, 'invaid access_token: expired');
      }

      ctx.user.username = decoded.iss;
      ctx.user.id = decoded.id;
      ctx.user.isAuthenticated = true;
      ctx.user.platform = decoded.platform;
    } catch (err) {
      // ctx.throw(401, 'The token is error.', err);
      ctx.status = 401;
      ctx.body = { code: 401, message: '未授权' };
      return;
    }

    await next();
  },
  // 验证登录token，未登录不抛异常
  async verify(ctx, next) {
    const token = ctx.cookies.get('access-token');

    ctx.user = {};
    ctx.user.isAuthenticated = false;

    // 校验 token， 解密， 验证token的可用性 ，检索里面的用户
    if (token !== undefined && token !== 'undefined' && token) {
      try {
        const decoded = jwt.decode(token, ctx.app.config.jwtTokenSecret);

        if (decoded.exp > Date.now()) {
          ctx.user.username = decoded.iss;
          ctx.user.id = decoded.id;
          ctx.user.isAuthenticated = true;
          ctx.user.platform = decoded.platform;
        }
      } catch (err) {
        console.log(err);
      }
    }

    await next();
  },
};
