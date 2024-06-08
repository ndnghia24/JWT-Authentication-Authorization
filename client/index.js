const express = require('express');
const expressHbs = require("express-handlebars");
const bodyParser = require('body-parser');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { updateAccessToken } = require('./controllers/authController');

const app = express();

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Cookie parser middleware
app.use(cookieParser());

// Handlebars middleware
app.use(express.static(__dirname + "/html"));
app.engine(
  "hbs",
  expressHbs.engine({
    layoutsDir: __dirname + "/views/layouts",
    defaultLayout: "main",
    extname: "hbs",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
    },
  })
);
app.set('view engine', 'hbs');
app.set('views', './views');

// Static folder
app.use(express.static('public'));

app.get('/', updateAccessToken, async (req, res) => {
  try {
    res.redirect('/users');
  } catch (error) {
    console.error(error);
    res.send('Error fetching users');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  // Implement login logic here

  // get access token and refresh token from the server
  axios.post('http://localhost:8000/auth/login', { username, password })
    .then(response => {
      const { accessToken, refreshToken } = response.data;
      // Store in cookies
      res.cookie('accessToken', accessToken);
      res.cookie('refreshToken', refreshToken);
      // Redirect to users list
      res.redirect('/users');
    })
    .catch(error => {
      console.error(error);
      res.send('Error logging in');
    });
});

app.get('/users', updateAccessToken, async (req, res) => {
  try {
    // Attach access token to the request
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;
    const decoded = jwt.verify(refreshToken, "mysecretkeyrefresh");
    let username = decoded.username;
    let isAdmin = decoded.isAdmin;
    if (isAdmin) {
      username = username + " (Admin)";
    } else {
      username = username + " (User)";
    }
    console.log(username);
    const response = await axios.get('http://localhost:8000/user', {
      headers: {
        token: `Bearer ${accessToken}`
      }
    });
    const users = response.data;
    res.render('users', { username, users });
  } catch (error) {
    console.error(error);
    if (error.response.status === 403) {
      res.redirect('/users');
    }
    res.send('Error fetching users');
  }
});

app.post('/delete-user', updateAccessToken, async (req, res) => {
  const { _id } = req.body;
  try {
    const accessToken = req.cookies.accessToken;
    const response = await axios.delete(`http://localhost:8000/user/${_id}`, {
      headers: {
        token: `Bearer ${accessToken}`,
      }
    });
    console.log(response.data);
    if (response.data.clearCookies) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
    }
    res.redirect('/users');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting user');
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});