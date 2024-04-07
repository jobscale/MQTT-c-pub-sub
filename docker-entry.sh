#!/usr/bin/env bash
set -eu

checkStatus() {
  while true
  do
    sleep 0.2
    echo -n ' check'
    nc -vz -w 1 127.0.0.1 1883 2>&1 || continue
    nc -vz -w 1 127.0.0.1 8883 2>&1 || continue
    nc -vz -w 1 127.0.0.1 12470 2>&1 || continue
    break
  done
}

main() {
  mosquitto -v -d -c /etc/mosquitto/conf.d/listen.conf

  checkStatus

  mosquitto_pub -d -h 127.0.0.1 -p 1883 \
  -t "topic/start" -m "hello world"

  npm start
}

main
