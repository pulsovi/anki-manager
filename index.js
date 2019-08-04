// jshint esversion:8
const find_process = require('find-process');
const netstat = require('node-netstat');
const child_process = require('child_process');

const cache = {
  port: null,
};

function getPort(pid) {
  return new Promise((resolve, reject) => {
    var ntret = netstat({
      filter: {
        pid,
        state: 'LISTENING'
      }
    }, stat => {
      resolve(stat.local.port);
    });
  });
}

function toCache(keyName, keyValue) {
  cache[keyName] = keyValue;
  return keyValue;
}

class AnkiManager {
  async getPid() {
    if (!await this.isRunning()) {
      await this.start();
    }
    return (await find_process('name', 'anki'))
      .filter(ps => ps.name === 'anki.exe')[0]
      .pid;
  }

  async getPort() {
    if (cache.port !== null) return cache.port;
    return toCache('port', await getPort(await this.getPid()));
  }

  async isRunning() {
    var process_list = await find_process('name', 'anki');
    return process_list.filter(ps => ps.name === 'anki.exe').length > 0;
  }

  start() {
    return new Promise((resolve, reject) => {
      var anki = child_process.spawn(
        `"C:\\Program Files\\Anki\\anki.exe"`, {
          stdio: ['ignore', 'pipe', 'ignore'],
          shell: true
        }
      );
      anki.stdout.setEncoding('utf8');
      anki.stdout.on('data', chunk => {
        if (chunk === 'anki:ready') {
          anki.stdout.destroy();
          anki.unref();
          anki = null;
          resolve();
        }
      });
    });
  }
}

module.exports = new AnkiManager();
