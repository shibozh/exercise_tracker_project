const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());


let user_list = [];
let user_log = [];

// 检查user是否已在list中
function isUserInArray(array, username) {
  return array.find(user => user.username === username) !== undefined;
}

// 生成唯一的字符串 ID
function generateUniqueId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function formatDate(dateStr) {
  // 检查日期格式是否为 yyyy-mm-dd
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  let date;

  if (dateStr && regex.test(dateStr)) {
      date = new Date(dateStr);
  } else {
      date = new Date(); // 当前日期
  }

  return date.toDateString(); // "Mon Jan 01 1990" 格式
}


app.post('/api/users', (req, res) => {
  const username = req.body['username'];
  if (isUserInArray(user_list, username)) {
    res.json(user_obj);
  } else {
    const _id = generateUniqueId()
    user_obj = {username: username, _id: _id};
    user_list.push(user_obj);
    res.json(user_obj);

    // 给新用户创建他的log
    const log_obj = {
      username: username,
      count: 0,
      _id: _id,
      log: []
    }
    user_log.push(log_obj);
  }
})

app.get('/api/users', (req, res) => {
  res.json(user_list);
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params['_id'];
  const description = req.body['description'];
  const duration = parseInt(req.body['duration']);
  const date = req.body['date'];
  const formatted_date = formatDate(date)
  const user = user_list.find(user => user._id === _id);
  const exercises_obj = {
    username: user.username,
    description: description,
    duration: duration,
    date: formatted_date,
    _id: _id
  }
  res.json(exercises_obj);

  // update用户的log
  let log = user_log.find(log => log._id === _id);
  log.count += 1;
  log.log.push(
    {
      description: description,
      duration: duration,
      date: formatted_date,
    }
  )
})

app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params['_id'];
  const log = user_log.find(log => log._id === _id);
  const fromDate = req.query.from ? new Date(req.query.from) : null;
  const toDate = req.query.to ? new Date(req.query.to) : null;
  const limit = req.query.limit ? parseInt(req.query.limit) : log.log.length;

  let filteredLogs = log.log;

  if (fromDate) {
    filteredLogs = filteredLogs.filter(entry => new Date(entry.date) >= fromDate);
  }

  if (toDate) {
    filteredLogs = filteredLogs.filter(entry => new Date(entry.date) <= toDate);
  }

  if (limit) {
    filteredLogs = filteredLogs.slice(0, limit);
  }

  const responseLog = {
    username: log.username,
    count: filteredLogs.length,
    _id: log._id,
    log: filteredLogs
  };

  res.json(responseLog);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
