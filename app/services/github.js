import config from 'config';
import request from 'request';

const clientId = config.get('github.clientId');
const clientSecret = config.get('github.clientSecret');
const appName = config.get('github.appName');

const API_TOKEN = 'https://github.com/login/oauth/access_token';
const API_GET_USER = 'https://api.github.com/user';
const API_USERS = `${API_GET_USER}s`;
const API_REPOS = 'https://api.github.com/repos';

const getToken = (code) => {
  return new Promise((resolve, reject) => {
    console.log(`${API_TOKEN}?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`);
    request.post(
      `${API_TOKEN}?client_id=${clientId}&client_secret=${clientSecret}&code=${code}`,
      (err, httpResponse, body) => {
        if (err) {
          console.log(err);
          reject(false);
        }
        if (body) {
          resolve(body);
        } else {
          reject(false);
        }
      }
    );
  });
};

const getUser = (token) => {
  return new Promise((resolve, reject) => {
    request.get(`${API_GET_USER}?access_token=${token}`, {
      headers: {
        'User-Agent': appName
      }
    }, (err, httpResponse, body) => {
      if (httpResponse.statusCode === 200 && body) {
        resolve(body);
      } else {
        reject(false);
      }
    });
  });
};

const getUserRepos = (token) => {

};

const getRepos = (login, token, page = 1) => {
  return new Promise((resolve, reject) => {
    request.get(`${API_USERS}/${login}/repos?page=${page}&access_token=${token}`, {
      headers: {
        'User-Agent': appName
      }
    }, (err, httpResponse, body) => {
      if (httpResponse.statusCode === 200 && body) {
        resolve(JSON.parse(body));
      } else {
        reject(false);
      }
    });
  });
};

const getMultiRepos = (login, token, pages = 3) => {
  const promiseList = new Array(pages).fill(0).map((item, index) => {
    return getRepos(login, token, index + 1);
  });
  return Promise.all(promiseList).then((datas) => {
    let results = [];
    datas.forEach(data => results = [...results, ...data]);
    return Promise.resolve(results);
  });
};

const getReposYearlyCommits = (fullname, token) => {
  return new Promise((resolve, reject) => {
    request.get(`${API_REPOS}/${fullname}/stats/commit_activity?access_token=${token}`, {
      headers: {
        'User-Agent': appName
      }
    }, (err, httpResponse, body) => {
      if (httpResponse.statusCode === 200 && body) {
        resolve(JSON.parse(body));
      } else {
        reject(false);
      }
    });
  });
};

const getAllReposYearlyCommits = (repos, token) => {
  const promiseList = repos.map((item, index) => {
    return getReposYearlyCommits(item.fullname || item.full_name, token);
  });
  return Promise.all(promiseList);
};

const getReposLanguages = (fullname, token) => {
  return new Promise((resolve, reject) => {
    request.get(`${API_REPOS}/${fullname}/languages?access_token=${token}`, {
      headers: {
        'User-Agent': appName
      }
    }, (err, httpResponse, body) => {
      if (httpResponse.statusCode === 200 && body) {
        const languages = JSON.parse(body);
        let total = 0;
        let result = {};
        Object.keys(languages).forEach(key => total += languages[key]);
        Object.keys(languages).forEach(key => result[key] = languages[key] / total);
        resolve(result);
      } else {
        resolve({});
      }
    });
  });
};

const getAllReposLanguages = (repos, token) => {
  const promiseList = repos.map((item, index) => {
    return getReposLanguages(item.fullname || item.full_name, token);
  });
  return Promise.all(promiseList);
};

export default {
  getToken,
  getUser,
  getUserRepos,
  getRepos,
  getMultiRepos,
  getAllReposYearlyCommits,
  getReposLanguages,
  getAllReposLanguages
}
