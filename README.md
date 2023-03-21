MQTT-c-pub-sub
==============

[![Build Status](https://travis-ci.org/nscooling/MQTT-c-pub-sub.svg?branch=master)](https://travis-ci.org/nscooling/MQTT-c-pub-sub)

This projects builds a simple (QoS0) MQTT client and server process.
The client will send messages to a MQTT broker (e.g. mosquito) and the server will display those messages.

The build assumes you have CMake installed.

to Build:
cd build
cmake ..
make

note on OSX need

cmake -G "Unix Makefiles" ..

[MQTT Chat Demo - mqtt.jsx.jp](https://mqtt.jsx.jp)
