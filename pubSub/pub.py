import random, time, json
from datetime import datetime, timezone
from paho.mqtt import client as mqtt_client

broker = '127.0.0.1'
port = 1883
topic = "hello/mqtt"
# generate client ID with pub prefix randomly
client_id = f'py-publisher-{random.randint(0, 1000)}-{random.randint(0, 1000)}'

def connect_mqtt():
  def on_connect(client, userdata, flags, rc):
    if rc == 0:
      print("Connected to MQTT Broker!")
    else:
      print("Failed to connect, return code %d\n", rc)

  client = mqtt_client.Client(client_id)
  client.on_connect = on_connect
  client.connect(broker, port)
  return client

def publish(client):
  msg_count = 0
  while True:
    time.sleep(1)
    payload = {
      'time': datetime.now(timezone.utc).isoformat(),
      'message': f"hello {client_id}",
      'id': msg_count
    }
    msg = json.dumps(payload)
    result = client.publish(topic, msg)
    # result: [0, 1]
    status = result[0]
    if status == 0:
      print(f"Send `{msg}` to topic `{topic}`")
    else:
      print(f"Failed to send message to topic {topic}")
    msg_count += 1

def run():
  client = connect_mqtt()
  client.loop_start()
  publish(client)

if __name__ == '__main__':
  run()
