#include <Arduino_RouterBridge.h>

void blink_led_once(bool /*unused*/) {
  // UNO Q built-in LED is active-low.
  digitalWrite(LED_BUILTIN, LOW);
  delay(200);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(200);
  digitalWrite(LED_BUILTIN, LOW);
  delay(200);
  digitalWrite(LED_BUILTIN, HIGH);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);

  Bridge.begin();
  Bridge.provide("blink_led_once", blink_led_once);
  Serial.println("Bridge initialized");
}

void loop() {
  delay(50);
}
