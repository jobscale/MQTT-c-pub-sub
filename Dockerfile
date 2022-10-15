FROM ghcr.io/jobscale/node-aws
WORKDIR /home/node
RUN sudo apt update && sudo apt install -y mosquitto
RUN sudo mkdir /run/mosquitto
COPY listen.conf /etc/mosquitto/conf.d/listen.conf
COPY --chown=node:staff docker-entry.sh /
COPY --chown=node:staff package.json .
RUN npm i --omit=dev
COPY --chown=node:staff docs docs
EXPOSE 3000
EXPOSE 1883
EXPOSE 12470
CMD ["/docker-entry.sh"]
