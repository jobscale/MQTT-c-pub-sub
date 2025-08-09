FROM node:lts-bookworm
USER root
ENV DEBIAN_FRONTEND noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends sudo netcat-openbsd mosquitto mosquitto-clients \
 && apt-get clean && rm -fr /var/lib/apt/lists/*
RUN usermod -aG sudo node && echo '%sudo ALL=(ALL:ALL) NOPASSWD:ALL' > /etc/sudoers.d/40-users

COPY listen.conf /etc/mosquitto/conf.d/listen.conf
WORKDIR /etc/mosquitto/certs
USER root
RUN chown mosquitto:staff .
USER mosquitto
COPY --chown=mosquitto:staff ssl-keygen-ca-server.sh .
RUN ./ssl-keygen-ca-server.sh

WORKDIR /home/node
USER node
COPY --chown=node:staff package.json .
RUN npm i --omit=dev
COPY --chown=node:staff docker-entry.sh .
COPY --chown=node:staff docs docs
COPY --chown=node:staff app app
COPY --chown=node:staff index.js .
USER root
EXPOSE 3000
EXPOSE 1883
EXPOSE 12470
CMD ["./docker-entry.sh"]
