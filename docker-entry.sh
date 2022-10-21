sudo mosquitto -v -d -c /etc/mosquitto/conf.d/listen.conf

sleep 0.01
nc -vz -w 1 127.0.0.1 1883
nc -vz -w 1 127.0.0.1 8883
nc -vz -w 1 127.0.0.1 12470

mosquitto_pub -d -h 127.0.0.1 -p 8883 \
--cafile /etc/mosquitto/certs/ca.crt \
-t "topic/start" -m "hello world"

npm start
