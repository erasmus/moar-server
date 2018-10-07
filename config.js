const callbackURL =  process.env.GITHUB_CALLBACK_URL
  ? process.env.GITHUB_CALLBACK_URL
  : 'http://127.0.0.1:8080/github/callback'

exports.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN
  : 'http://localhost:3000'

exports.GITHUB_CONFIG = {
  clientKey: process.env.GITHUB_KEY,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL
}