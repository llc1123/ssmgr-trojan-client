FROM node:alpine

RUN npm -g i ssmgr-trojan-client
ENV LISTEN_ADDR="0.0.0.0:4001" \
    KEY="" \
    DB_TYPE="redis" \
    DB_ADDR="localhost:6379" \
    DB_NAME="" \
    DB_USER="" \
    DB_PASSWORD=""

CMD [ "ssmgr-trojan-client", \
      "-l", "$LISTEN_ADDR", \
      "-k", "$KEY", \
      "--db-type", "$DB_TYPE", \
      "--db-address", "$DB_ADDR", \
      "--db-name", "$DB_NAME", \
      "--db-user", "$DB_USER", \
      "--db-password", "$DB_PASSWORD" ]