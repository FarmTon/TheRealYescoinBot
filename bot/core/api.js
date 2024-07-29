const FormData = require('form-data');
const app = require('../config/app');
const logger = require('../utils/logger');
const sleep = require('../utils/sleep');
const _ = require('lodash');

class ApiRequest {
  constructor(sessionName) {
    this.session_name = sessionName;
  }

  async get(client) {
    try {
      client.defaults.headers['content-type'] = 'application/json';
      const response = await client.post(app.apiUrl + '/v2/user/getScore', JSON.stringify({}));
      return response.data;
    } catch (error) {
      const regex = /ENOTFOUND\s([^\s]+)/;
      const match = error.message.match(regex);
      logger.error(this.session_name + ' | Error while getting User Data: ' + 
                   (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED') || error.message.includes('getaddrinfo') 
                   ? 'The proxy server at ' + (match && match[1] ? match[1] : 'unknown address') + ' could not be found. Please check the proxy address and your network connection.'
                   : error.message));
      await sleep(3);
    }
  }

  async get_boost_data(client) {
    try {
      client.defaults.headers['content-type'] = 'application/json';
      const response = await client.post(app.apiUrl + '/v2/boosts/get', JSON.stringify({}));
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.error(this.session_name + ' | Error while getting Boost Data: ' + error.response.data.message);
      } else {
        logger.error(this.session_name + ' | Error while getting Boost Data: ' + error.message);
      }
    }
  }

  async upgrade_boost(client, data) {
    try {
      client.defaults.headers['content-type'] = 'application/json';
      const response = await client.post(app.apiUrl + '/v2/boosts/buy', JSON.stringify(data));
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.error(this.session_name + ' | Error while upgrading Boost: ' + error.response.data.message);
        logger.error(this.session_name + ' | Error while upgrading Boost: ' + error.message);
      }
    }
  }

  async send_taps(client, data) {
    try {
      client.defaults.headers['content-type'] = 'application/json';
      const response = await client.post(app.apiUrl + '/v2/click/clickEvent', JSON.stringify(data));
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.error(this.session_name + ' | Error while <b>sending taps:</b> ' + error.response.data.message);
      } else {
        logger.error(this.session_name + ' | Error while sending taps: ' + error.message);
      }
    }
  }

  async get_daily_reward(client) {
    try {
      client.defaults.headers['content-type'] = 'application/json';
      const response = await client.post(app.apiUrl + '/v2/tasks/getDailyReward', JSON.stringify({}));
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.error(this.session_name + ' | Error while <b>getting daily reward:</b> ' + error.response.data.message);
      } else {
        logger.error(this.session_name + ' | Error while getting daily reward: ' + error.message);
      }
    }
  }

  async claim_ads(client) {
    try {
      client.defaults.headers['content-type'] = 'application/json';
      const response = await client.post(app.apiUrl + '/v2/tasks/claimAdsgramAdReward', JSON.stringify({}));
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.error(this.session_name + ' | Error while <b>claiming ads:</b> ' + error.response.data.message);
      } else {
        logger.error(this.session_name + ' | Error while claiming ads: ' + error.message);
      }
    }
  }

  async claim_daily_reward(client) {
    try {
      const form = new FormData();
      form.append('viewCompletedAt', new Date().getTime());
      form.append('reference', _.random(1, 100));
      client.defaults.headers['content-type'] = 'boundary=' + form._boundary;
      const response = await client.post(app.apiUrl + '/v2/tasks/claimDailyReward', form);
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.error(this.session_name + ' | Error while <b>trying your luck on doubling coins:</b> ' + error.response.data.message);
      } else {
        logger.error(this.session_name + ' | Error while trying your luck on doubling coins: ' + error.message);
      }
    }
  }
}

module.exports = ApiRequest;
