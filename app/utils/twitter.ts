export const twitterConfig = ({ consumer_key, consumer_secret, access_token_key, access_token_secret }) => {
  return {
    consumer_key,
    consumer_secret,
    access_token_key,
    access_token_secret,
    timeout_ms: 10 * 1000, // optional HTTP request timeout to apply to all requests.
    // strictSSL: true, // optional - requires SSL certificates to be valid.
    request_options: {
      proxy: 'http://127.0.0.1:1087',
      // proxy: 'https://api.twitter.com',
    },
  };
};
