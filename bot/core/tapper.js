const { default: axios } = require('axios');
const logger = require('../utils/logger');
const headers = require('./header');
const { Api } = require('./api');
const { SocksProxyAgent } = require('socks-proxy-agent');
const settings = require('../config/config');
const app = require('../config/app');
const user_agents = require('../config/userAgents');
const fs = require('fs');
const sleep = require('../utils/sleep');
const ApiRequest = require('./apiRequest');
const parser = require('../utils/parser');
const v4 = require('uuid');

class Tapper {
  constructor(sessionInfo) {
    this.session_name = sessionInfo.session_name;
    this.tg_client = sessionInfo.tg_client;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, 'user-agent': this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name);
  }

  #load_session_data() {
    try {
      const data = fs.readFileSync('session_user_agents.json', 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') return {};
      else throw error;
    }
  }

  #clean_tg_web_data(data) {
    let cleanedData = data.replace(/^tgWebAppData=/, '');
    cleanedData = cleanedData.replace(/&tgWebAppVersion=7\.4&tgWebAppPlatform=ios$/, '');
    cleanedData = cleanedData.replace(/&tgWebAppVersion=7\.4&tgWebAppPlatform=android$/, '');
    cleanedData = cleanedData.replace(/&tgWebAppVersion=7\.4&tgWebAppPlatform=ios&tgWebAppBotInline=1$/, '');
    cleanedData = cleanedData.replace(/&tgWebAppVersion=7\.4&tgWebAppPlatform=android&tgWebAppBotInline=1$/, '');
    return cleanedData;
  }

  #get_random_user_agent() {
    const index = Math.floor(Math.random() * user_agents.length);
    return user_agents[index];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) return this.session_user_agents[this.session_name];
    logger.info(this.session_name + ' | Generating new user agent...');
    const user_agent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = user_agent;
    this.#save_session_data(this.session_user_agents);
    return user_agent;
  }

  #save_session_data(data) {
    fs.writeFileSync('session_user_agents.json', JSON.stringify(data, null, 2));
  }

  #get_platform(userAgent) {
    const platforms = [
      { pattern: /iPhone/i, platform: 'ios' },
      { pattern: /Android/i, platform: 'android' },
      { pattern: /iPad/i, platform: 'ios' }
    ];
    for (const { pattern, platform } of platforms) {
      if (pattern.test(userAgent)) return platform;
    }
    return 'unknown';
  }

  #addSeconds(seconds) {
    let now = new Date();
    let futureTime = new Date(now.getTime() + seconds * 1000);
    return futureTime;
  }

  #compareWithCurrentTime(time) {
    let now = new Date();
    if (time > now) return true;
    else return time < now ? false : false;
  }

  #proxy_agent(proxy) {
    try {
      if (!proxy) return null;
      let proxyUrl;
      if (!proxy.password && !proxy.username) {
        proxyUrl = `socks://${proxy.ip}:${proxy.port}`;
      } else {
        proxyUrl = `socks://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new SocksProxyAgent(proxyUrl);
    } catch (error) {
      logger.error(this.session_name + ' | Proxy agent error: ' + error + ' | ' + JSON.stringify(proxy, null, 2));
      return null;
    }
  }

  async #get_tg_web_data() {
    try {
      await this.tg_client.connect();
      const platform = this.#get_platform(this.#get_user_agent());
      const peerEntity = await this.tg_client.getInputEntity(app.bot);
      const response = await this.tg_client.invoke(new Api.messages.GetHistory({ peer: 'freddy_bots', limit: 1 }));
      if (response.messages.length < 1) {
        await this.tg_client.invoke(new Api.channels.JoinChannel({ channel: 'freddy_bots' }));
      }
      const webDataResponse = await this.tg_client.invoke(new Api.messages.RequestWebView({
        peer: peerEntity,
        bot: peerEntity,
        platform,
        from_bot_menu: false,
        url: app.webviewUrl
      }));
      const webData = webDataResponse.url;
      const webDataHash = webData.split('#', 2)[1];
      const parsedData = parser.parse(decodeURIComponent(this.#clean_tg_web_data(webDataHash)));
      return parser.toJson(parsedData);
    } catch (error) {
      logger.error(this.session_name + ' | Error: ' + error);
      throw error;
    } finally {
      await sleep(1);
      logger.info(this.session_name + ' | Sleeping for 1 second...');
    }
  }

  #getItemById(items, id) {
    return items.find(item => item.id === id);
  }

  async #check_proxy(client, proxy) {
    try {
      client.defaults.headers['origin'] = 'httpbin.org';
      const response = await client.get('https://httpbin.org/ip');
      const ip = response.data.origin;
      logger.info(this.session_name + ' | Proxy IP: ' + ip);
      return true;
    } catch (error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        logger.error(this.session_name + ' | Unable to resolve the proxy address. The proxy server at ' + proxy.ip + ':' + proxy.port + ' could not be found. Please check the proxy address and your network connection.');
        logger.error(this.session_name + ' | No proxy will be used.');
        return false;
      } else {
        logger.error(this.session_name + ' | Proxy agent error: ' + proxy.ip + ':' + proxy.port + ' | ' + error.message);
        return false;
      }
    }
  }

  async run(proxy) {
    let client, lastRunTime = 0, nextRunTime, sessionId, lastClaimTime = 0, lastEnergyCheckTime = 0, energyCheckInterval = 0;
    if (settings.USE_PROXY_FROM_FILE && proxy) {
      client = axios.create({
        httpsAgent: this.#proxy_agent(proxy),
        headers: this.headers,
        withCredentials: true
      });
      const proxyCheck = await this.#check_proxy(client, proxy);
      if (!proxyCheck) {
        client = axios.create({ headers: this.headers, withCredentials: true });
      }
    } else {
      client = axios.create({ headers: this.headers, withCredentials: true });
    }
    while (true) {
      try {
        const currentTime = Date.now() / 1000;
        if (currentTime - lastRunTime >= 3600) {
          client.defaults.headers['host'] = app.host;
          const tgWebData = await this.#get_tg_web_data();
          client.defaults.headers['authorization'] = tgWebData;
          lastRunTime = currentTime;
          await sleep(2);
        }
        const userData = await this.api.get(client);
        const boostData = await this.api.get_boost_data(client);
        if (!userData) continue;
        if (currentTime - lastEnergyCheckTime >= 300) {
          sessionId = v4.v4();
          lastEnergyCheckTime = currentTime;
        }
        if (userData?.payload?.energyLeft > 0 && !this.#compareWithCurrentTime(energyCheckInterval)) {
          if (settings.RANDOM_TAPS_COUNT[0] > settings.RANDOM_TAPS_COUNT[1]) {
            logger.error(this.session_name + ' | Invalid Random Taps Count. RANDOM_TAPS_COUNT MIN must be less than RANDOM_TAPS_COUNT MAX. Example: RANDOM_TAPS_COUNT: [10, 20]');
            process.exit(1);
          }
          if (settings.RANDOM_TAPS_COUNT[0] > 1000 || settings.RANDOM_TAPS_COUNT[1] > 1000) {
            logger.error(this.session_name + ' | Invalid Random Taps Count. RANDOM_TAPS_COUNT MAX must be less than or equal to 1000. Example: RANDOM_TAPS_COUNT: [10, 1000]');
            process.exit(1);
          }
          let tapCount = _.random(settings.RANDOM_TAPS_COUNT[0], settings.RANDOM_TAPS_COUNT[1]);
          const tapCost = tapCount * userData?.payload?.goldPerClick;
          if (tapCost > userData?.payload?.energyLeft) {
            tapCount = Math.floor(userData?.payload?.energyLeft / userData?.payload?.goldPerClick);
          }
          if (tapCount >= 1) {
            const tapPayload = {
              count: tapCount,
              sessionId: sessionId,
              lastSessionActivityMs: new Date().getTime(),
              startSessionMs: currentTime * 1000,
              totalSessionClicks: energyCheckInterval + tapCount
            };
            const tapResponse = await this.api.send_taps(client, tapPayload);
            userData = await this.api.get_user_data(client);
            energyCheckInterval += tapCount;
            if (tapResponse?.status?.toLowerCase() == 'ok') {
              logger.info(this.session_name + ' | ✅ Successfully sent taps | (+' + tapCount * userData?.payload?.goldPerClick + '</gr>) |⚡Remaining Energy: <bl>' + userData?.payload?.energyLeft + '</bl> | 💰Total Balance: <lb>' + userData?.payload?.gold + '</lb>');
            } else {
              logger.error(this.session_name + ' | ❗️Failed to send taps');
            }
          } else {
            energyCheckInterval = this.#addSeconds(22560);
            logger.info(this.session_name + ' | ⏳ Not enough energy. We will try to tap again in 7 hours but ads claim will continue. ' + '💰Total Balance: <lb>' + userData?.payload?.gold + '</lb> |⚡Remaining Energy: <bl>' + userData?.payload?.energyLeft + '</bl>');
          }
        }
        if (!this.#compareWithCurrentTime(lastClaimTime)) {
          if (settings.SLEEP_BETWEEN_ADS < 30) {
            logger.warning(this.session_name + ' | SLEEP_BETWEEN_ADS should not be less than 30. Skipping ads claim');
          } else {
            const adClaimResponse = await this.api.claim_ads(client);
            if (adClaimResponse?.status?.toLowerCase() == 'ok') {
              logger.info(this.session_name + ' | ✅ Successfully claimed ads.');
            } else {
              logger.error(this.session_name + ' | ❗️Failed to claim ads');
            }
            userData = await this.api.get(client);
            logger.info(this.session_name + ' |⚡Remaining Energy: <bl>' + userData?.payload?.energyLeft + '</bl> | 💰Total Balance: <lb>' + userData?.payload?.gold + '</lb>');
            lastClaimTime = this.#addSeconds(settings.SLEEP_BETWEEN_ADS);
          }
        }
        await sleep(5);
        let boostItem = this.#getItemById(boostData?.payload, 'multiclick');
        if (settings.AUTO_UPGRADE_MULTICLICKS && userData?.payload?.gold < settings.MAX_MULTICLICKS_LEVEL) {
          if (userData?.payload?.gold >= boostItem?.updateCost) {
            const upgradePayload = { boost: 'multiclick' };
            const upgradeResponse = await this.api.upgrade_boost(client, upgradePayload);
            userData = await this.api.get(client);
            boostData = await this.api.get_boost_data(client);
            boostItem = this.#getItemById(boostData?.payload, 'multiclick');
            if (upgradeResponse?.status?.toLowerCase() == 'ok') {
              logger.info(this.session_name + ' | ✅ Successfully upgraded multiclick to level <lb>' + userData?.payload?.goldPerClick + '</lb>');
            }
          }
        }
        await sleep(3);
      } catch (error) {
        logger.error(this.session_name + ' | Error: ' + error);
      } finally {
        logger.info(this.session_name + ' | Sleeping for ' + settings.SLEEP_BETWEEN_TAP + ' seconds...');
        await sleep(settings.SLEEP_BETWEEN_TAP);
      }
    }
  }
}

module.exports = Tapper;
