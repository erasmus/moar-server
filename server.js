const express = require('express')
const http = require('http')
const passport = require('passport')
const session = require('express-session')
const pgp = require('pg-promise')(/*options*/)
const db = pgp('postgres://erasmus@localhost:5432/moar')
const cors = require('cors')
const socketio = require('socket.io')
const { Strategy: GithubStrategy } = require('passport-github')
const dotenv = require('dotenv').config()

const GITHUB_CONFIG = {
  clientID: process.env.GITHUB_KEY,
  clientSecret: process.env.GITHUB_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL
}

// Create the server and allow express and sockets to run on the same port
const app = express()
const server = http.createServer(app)
const io = socketio(server)

// Allows the application to accept JSON and use passport
app.use(express.json())
app.use(passport.initialize())

// Set up cors to allow us to accept requests from our client
app.use(cors({
  origin: 'http://localhost:3000'
})) 

// saveUninitialized: true allows us to attach the socket id
// to the session before we have authenticated with Github  
app.use(session({ 
  secret: 'KeyboardKittens', 
  resave: true, 
  saveUninitialized: true 
}))

// allows us to save the user into the session
passport.serializeUser((user, cb) => cb(null, user))
passport.deserializeUser((obj, cb) => cb(null, obj))

// Basic setup with passport and Github
passport.use(new GithubStrategy(
  GITHUB_CONFIG, 
  (accessToken, refreshToken, profile, cb) => {
    console.log(profile.id);
    // save the user right here to a database if you want
    db.one('INSERT INTO github_users VALUES($1);', profile.id)
      .then(function (data) {
        console.log('DATA:', data.value)
      })
      .catch(function (error) {
        console.log('ERROR:', error)
      })


    const user = {   
        name: profile.username,
        photo: profile.photos[0].value.replace(/_normal/, '')
    }
    cb(null, user)
  })
)

// Middleware that triggers the PassportJs authentication process
const githubAuth = passport.authenticate('github')

// This custom middleware picks off the socket id (that was put on req.query)
// and stores it in the session so we can send back the right info to the 
// right socket
const addSocketIdToSession = (req, res, next) => {
  req.session.socketId = req.query.socketId
  next()
}

// This is endpoint triggered by the popup on the client which starts the whole
// authentication process
app.get('/github', addSocketIdToSession, githubAuth)

// This is the endpoint that Github sends the user information to. 
// The githubAuth middleware attaches the user to req.user and then
// the user info is sent to the client via the socket id that is in the 
// session. 
app.get('/github/callback', githubAuth, (req, res) => {
  io.in(req.session.socketId).emit('user', req.user)
  res.end()
})

server.listen(8080, () => {
  console.log('listening...')
})