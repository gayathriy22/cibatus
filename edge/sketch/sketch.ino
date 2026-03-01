#include <Arduino_Modulino.h>
#include <Arduino_RouterBridge.h>

ModulinoThermo thermo;

// Digital output used to drive the MOSFET gate.
static const uint8_t PURE_PUMP_PIN = 7;
static const uint8_t LIGHT_NUTRIENT_PUMP_PIN = 8;

bool _run_pure_pump(int durationMs) {
  digitalWrite(PURE_PUMP_PIN, HIGH);
  delay(durationMs);
  digitalWrite(PURE_PUMP_PIN, LOW);
  return true;
}

bool _run_light_nutrient_pump(int durationMs) {
  digitalWrite(LIGHT_NUTRIENT_PUMP_PIN, HIGH);
  delay(durationMs);
  digitalWrite(LIGHT_NUTRIENT_PUMP_PIN, LOW);
  return true;
}

bool run_pump(int durationMs, int pumpIndex) {
  // Scale the duration based on temperature
  float celsius = thermo.getTemperature();
  if (celsius > 24) {
    durationMs = durationMs * 1.5;
  }

  switch (pumpIndex) {
    case 0:
      return _run_pure_pump(durationMs);
    case 1:
      return _run_light_nutrient_pump(durationMs);
    default:
      return false;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(PURE_PUMP_PIN, OUTPUT);
  pinMode(LIGHT_NUTRIENT_PUMP_PIN, OUTPUT);
  digitalWrite(PURE_PUMP_PIN, LOW);
  digitalWrite(LIGHT_NUTRIENT_PUMP_PIN, LOW);

  Bridge.begin();
  Bridge.provide("run_pump", run_pump);

  // Set up temp modulino
  Modulino.begin(Wire1);
  thermo.begin();
}

void loop() {
  delay(50);
}
