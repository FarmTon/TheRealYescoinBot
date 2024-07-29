const getMapping = function() {
  return [
    'log', 'start', 'map', '1.0.0', 'API_ID and API_HASH must be provided.', 'exit', 'parse', 'utf8',
    './logger', 'Action type', 'Action must be 1 or 2', '@inquirer/prompts', 'action', '</lb> sessions | <pi>',
    'process', 'isArray', 'API_ID', 'trim', 'apiHash', '60692AJxsET', '823110rdKsaE', 'split', 'Create session',
    '6730677XQPLdS', '2699400KqrBKK', 'exports', 'warning', 'match', 'opts', 'existsSync', 'value',
    '\n╔════╗╔╗      ╔═══╗             ╔╗ ╔╗   ╔╗                  \n║╔╗╔╗║║║      ║╔═╗║             ║║ ║╚╗╔╝║                  \n╚╝║║╚╝║╚═╗╔══╗║╚═╝║╔══╗╔══╗ ║║ ╚╗╚╝╔╝╔══╗╔══╗╔══╗╔╗╔═╗ \n  ║║  ║╔╗║║╔╗║║╔╗╔╝║╔╗║╚ ╗║ ║║  ╚╗╔╝ ║╔╗║║══╣║╔═╝║╔╗║╠╣║╔╗╗\n ╔╝╚╗ ║║║║║║═╣║║║╚╗║║═╣║╚╝╚╗║╚╗  ║║  ║║═╣╠══║║╚═╗║╚╝║║║║║║║\n ╚══╝ ╚╝╚╝╚══╝╚╝╚═╝╚══╝╚═══╝╚═╝  ╚╝  ╚══╝╚══╝╚══╝╚══╝╚╝╚╝╚╝\n© Freddy Bots               \n\n', 'telegram', 'message', './TldLogger', '</b></la> | Invalid session data. Create a new one.',
    'sessionString', '<la><b>', '../config/proxies', '--action <action>', '\nStart the bot', '../core/tapper', 'run', '568234iBpVcR', 'test', '</pi> proxies', 'What would you like to do:\n', 'all', 'addOption', 'commander', '<ye><u><b>WARNING</b></u></ye> <br />\n<b><bl>en:</bl></b> NOT FOR SALE\n<b><bl>ru:</bl></b> НЕ ДЛЯ ПРОДАЖИ\n<b><bl>es:</bl></b> NO VENTA\n<b><bl>fr:</bl></b> PAS À VENDRE\n<b><bl>it:</bl></b> NON PER VENDITA\n<b><bl>gh:</bl></b> YƐN TƆN\n\n<b>For updates and more bots join us:</b> \n<la>https://t.me/freddy_bots</la>\n', 'Freddy Bots', '.session', 'cwd', '\nCreate a new session for the bot', 'Detected <lb>', 'apiId', 'telegram/sessions', '../core/register', 'choices', '1FYmXNY', 'iterator', 'join', '9Gllazq', '</b></la> | Session is empty or expired. Create a new one.', 'next', 'Run bot', 'path', 'length', 'readdirSync', '3930632lLRQqD', 'info', '911666pmmtKL', 'error', 'sessions'
  ];
};

function getValue(key) {
  const mapping = getMapping();
  return mapping[key - 0x1a8];
}

(function(mappingFunc, expectedValue) {
  const mappedValues = mappingFunc();
  while (true) {
    try {
      const result = parseInt(getValue(0x1e8)) / 1 * (parseInt(getValue(0x1d7)) / 2) + 
                     -parseInt(getValue(0x1eb)) / 3 * (-parseInt(getValue(0x1bf)) / 4) + 
                     -parseInt(getValue(0x1c0)) / 5 + 
                     -parseInt(getValue(0x1c4)) / 6 + 
                     -parseInt(getValue(0x1a9)) / 7 + 
                     parseInt(getValue(0x1f2)) / 8 + 
                     parseInt(getValue(0x1c3)) / 9;
      if (result === expectedValue) break;
      else mappedValues.push(mappedValues.shift());
    } catch (error) {
      mappedValues.push(mappedValues.shift());
    }
  }
})(getMapping, 0x3e750);

const register = require(getValue(0x1e6)),
      logger = require(getValue(0x1b4)),
      { select } = require(getValue(0x1b7)),
      fs = require('fs'),
      path = require(getValue(0x1ef)),
      settings = require('../config/config'),
      proxies = require(getValue(0x1d2)),
      { program, Option } = require(getValue(0x1dd)),
      { TelegramClient } = require(getValue(0x1cc)),
      Tapper = require(getValue(0x1d5)),
      { StringSession } = require(getValue(0x1e5)),
      logger2 = require(getValue(0x1ce));

class Launcher {
  #start_text;
  constructor() {
    this.#start_text = getValue(0x1cb);
  }

  #printStartText() {
    logger.info(getValue(0x1e3) + this.#get_sessions().length + getValue(0x1b9) + 
                (this.#get_proxies() && Array.isArray(this.#get_proxies()) ? this.#get_proxies().length : 0) + 
                getValue(0x1d9));
    logger.paragraph(getValue(0x1de));
    console.log(this.#start_text);
  }

  async start() {
    let action;
    program.addOption(new Option(getValue(0x1d3), getValue(0x1b5)).choices(['1', '2'])).showHelpAfterError(true);
    program.parse();
    const options = program.opts();
    action = options ? parseInt(options.action) : null;

    if (!action) {
      this.#printStartText();
      let choice = '';
      while (true) {
        choice = await select({
          message: getValue(0x1da),
          choices: [
            { name: getValue(0x1c2), value: '1', description: getValue(0x1e2) },
            { name: getValue(0x1ee), value: '2', description: getValue(0x1d4) }
          ]
        });
        if (!choice.trim().match(/^[1-2]$/)) {
          logger.warning(getValue(0x1b6));
        } else {
          break;
        }
      }
      action = parseInt(choice.trim());
    }

    if (action === 1) {
      register.createSession();
    } else if (action === 2) {
      const tgClients = await this.#get_tg_clients();
      await this.#run_tasks(tgClients);
    }
  }

  async #get_tg_clients() {
    const sessions = this.#get_sessions();
    const tgClients = sessions.map(session => {
      try {
        const data = fs.readFileSync(path.join(process.cwd(), 'telegram/sessions', session + '.session'), 'utf8');
        if (!data) {
          logger.error('Detected <lb>' + session + '</b></la> | Session is empty or expired. Create a new one.');
          return;
        }
        const sessionData = JSON.parse(data);
        if (!settings.API_ID || !settings.API_HASH) {
          logger.error('API_ID and API_HASH must be provided.');
          process.exit(1);
        }
        if (!sessionData.sessionString || !sessionData.apiId || !sessionData.apiHash) {
          logger.error('Detected <lb>' + session + '</b></la> | Invalid session data. Create a new one.');
          process.exit(1);
        }
        if (!/^\d+$/.test(sessionData.apiId)) {
          logger.error('Detected <lb>' + session + '</b></la> | Invalid API ID.');
          process.exit(1);
        }
        const stringSession = new StringSession(sessionData.sessionString);
        const tgClient = new TelegramClient(stringSession, sessionData.apiId, sessionData.apiHash, {
          connectionRetries: 5,
          deviceModel: 'Test',
          appVersion: '1.0.0',
          systemVersion: '1.0.0',
          langCode: 'en',
          baseLogger: logger2
        });
        return { tg_client: tgClient, session_name: session };
      } catch (error) {
        logger.error('Detected <lb>' + session + '</b></la> | Error: ' + error.message);
      }
    });
    return tgClients;
  }

  #get_sessions() {
    const sessionsDir = path.join(process.cwd(), 'telegram/sessions');
    if (!fs.existsSync(sessionsDir)) return [];
    const sessions = fs.readdirSync(sessionsDir).map(file => {
      return file.endsWith('.session') ? file.split('.')[0] : null;
    });
    return sessions.filter(session => session !== null);
  }

  #get_proxies() {
    if (!settings.USE_PROXY_FROM_FILE) return null;
    return proxies;
  }

  async #run_tasks(clients) {
    const proxies = this.#get_proxies();
    let proxyIterator = proxies ? proxies[Symbol.iterator]() : null;
    const tasks = clients.map(async client => {
      const proxy = proxyIterator ? proxyIterator.next().value : null;
      try {
        await new Tapper(client).run(proxy);
      } catch (error) {
        logger.error('Error in task for tg_client: ' + error.message);
      }
    });
    await Promise.all(tasks);
  }
}

function startApp() {
  const launcher = new Launcher();
  module.exports = launcher;
}

startApp();
