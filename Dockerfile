FROM ghcr.io/jobscale/node-aws
USER root
RUN apt-get update && apt-get install -y mosquitto
COPY listen.conf /etc/mosquitto/conf.d/listen.conf

WORKDIR /home/node
USER node
COPY --chown=node:staff docker-entry.sh /
COPY --chown=node:staff package.json .
RUN npm i --omit=dev
COPY --chown=node:staff docs docs
COPY --chown=node:staff app app
COPY --chown=node:staff index.js index.js
EXPOSE 3000
EXPOSE 1883
EXPOSE 12470
CMD ["/docker-entry.sh"]
