#include <Arduino_RouterBridge.h>

// Digital output used to drive the MOSFET gate.
static const uint8_t PURE_PUMP_PIN = 7;
static const uint8_t LIGHT_NUTRIENT_PUMP_PIN = 8;

bool run_pure_pump(int durationMs) {
  digitalWrite(PURE_PUMP_PIN, HIGH);
  delay(durationMs);
  digitalWrite(PURE_PUMP_PIN, LOW);
  return true;
}

bool run_light_nutrient_pump(int durationMs) {
  digitalWrite(LIGHT_NUTRIENT_PUMP_PIN, HIGH);
  delay(durationMs);
  digitalWrite(LIGHT_NUTRIENT_PUMP_PIN, LOW);
  return true;
}

void setup() {
  Serial.begin(115200);
  pinMode(PURE_PUMP_PIN, OUTPUT);
  pinMode(LIGHT_NUTRIENT_PUMP_PIN, OUTPUT);
  digitalWrite(PURE_PUMP_PIN, LOW);
  digitalWrite(LIGHT_NUTRIENT_PUMP_PIN, LOW);

  Bridge.begin();
  Bridge.provide("run_pure_pump", run_pure_pump);
  Bridge.provide("run_light_nutrient_pump", run_light_nutrient_pump);
  Serial.println("Bridge initialized");
}

void loop() {
  delay(50);
}
