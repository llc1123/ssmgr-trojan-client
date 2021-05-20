FROM node:alpine

RUN npm -g i ssmgr-trojan-client@1.4.1
ENV LISTEN_ADDR="0.0.0.0:4001" KEY=""

CMD ssmgr-trojan-client -l ${LISTEN_ADDR} -k ${KEY:-$(hostname)}
