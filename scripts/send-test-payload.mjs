#!/usr/bin/env zx

/**
 * https://shadowsocks.github.io/shadowsocks-manager/#/ssmgrapi
 */

import net from 'net'
import crypto from 'crypto'

const pack = (data, password) => {
  const message = JSON.stringify(data);
  const now = Date.now();
  const timeBuffer = Buffer.from('0' + now.toString(16), 'hex');
  const dataBuffer = Buffer.from(message);
  const length = dataBuffer.length + 4 + 6;
  const lengthBuffer = Buffer.from(('0000' + length.toString(16)).substr(-4), 'hex');
  const code = crypto.createHash('md5').update(now + message + password).digest('hex').substr(0, 8);
  const codeBuffer = Buffer.from(code, 'hex');
  return Buffer.concat([lengthBuffer, timeBuffer, dataBuffer, codeBuffer]);
};

const receiveData = async (receive, data) => {
  receive.data = Buffer.concat([receive.data, data]);
  return checkData(receive);
};

const checkData = async (receive) => {
  const buffer = receive.data;
  let length = 0;
  let data;
  if (buffer.length < 4) {
    return;
  }
  length = buffer[0] * 256 * 256 * 256 + buffer[1] * 256 * 256 + buffer[2] * 256 + buffer[3];
  if (buffer.length >= length + 4) {
    data = buffer.slice(4, length + 4);
    return JSON.parse(data.toString());
  } else {
    return undefined;
  }
};

const sendMessage = (data, options) => {
  if (options && options.host) {
    options.host = options.host.split(':')[0];
  }

  return new Promise((resolve, reject) => {
    const client = net.connect(options, () => {
      client.write(pack(data, options.password));
    });
    client.setTimeout(10 * 1000);
    const receive = {
      data: Buffer.from(''),
      socket: client,
    };
    client.on('data', data => {
      receiveData(receive, data).then(message => {
        if (!message) {
        } else if(message.code === 0) {
          resolve(message.data);
        } else {
          console.error(message);
          reject(new Error(`ssmgr[s] return an error code [${ options.host || host }:${ options.port || port }]`));
        }
        client.end();
      }).catch(err => {
        console.error(err);
        client.end();
      });
    });
    client.on('close', () => {
      reject(new Error(`ssmgr[s] connection close [${ options.host || host }:${ options.port || port }]`));
    });
    client.on('error', err => {
      console.error(err);
      reject(new Error(`connect to ssmgr[s] fail [${ options.host || host }:${ options.port || port }]`));
    });
    client.on('timeout', () => {
      console.error('timeout');
      reject(new Error(`connect to ssmgr[s] timeout [${ options.host || host }:${ options.port || port }]`));
      client.end();
    });
  });
};

const payload = JSON.parse(argv._[1])

if (payload.command === 'add' || payload.command === 'del') {
  payload.password = crypto.createHash('sha224')
    .update(payload.password, 'utf8')
    .digest('hex');
}

const response = await sendMessage(payload, {host: 'localhost', port: '4001', password: '123456'});
console.log(response);
