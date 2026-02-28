#include <Arduino_RouterBridge.h>

// Digital output used to drive the MOSFET gate.
static const uint8_t MOSFET_PIN = 8;

bool pulse_mosfet(bool should_pulse) {
  if (!should_pulse) {
    return false;
  }

  digitalWrite(MOSFET_PIN, HIGH);
  delay(1000);
  digitalWrite(MOSFET_PIN, LOW);
  return true;
}

void setup() {
  Serial.begin(115200);
  pinMode(MOSFET_PIN, OUTPUT);
  digitalWrite(MOSFET_PIN, LOW);

  Bridge.begin();
  Bridge.provide("pulse_mosfet", pulse_mosfet);
  Serial.println("Bridge initialized");
}

void loop() {
  delay(50);
}
