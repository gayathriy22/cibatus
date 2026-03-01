import {
  apiAppendTimeHistory,
  apiCreatePlant,
  apiCreateProfile,
  apiDisconnectPlant,
  apiGetLatestTimeHistory,
  apiGetPlant,
  apiGetPlantCharacter,
  apiGetProfile,
  apiGetTimeHistoryRange,
  apiInsertPlantCharacter,
} from './api';

export async function getUserProfile(auth_uid) {
  return apiGetProfile(auth_uid);
}

export async function createUserProfile(auth_uid, payload) {
  return apiCreateProfile(auth_uid, payload);
}

export async function createPlant(plant_uid, plant_name, plant_img_uri) {
  return apiCreatePlant(plant_uid, plant_name, plant_img_uri);
}

export async function appendTimeHistory(
  user_id,
  daily_total,
  daily_pickups,
  date_time
) {
  return apiAppendTimeHistory(user_id, daily_total, daily_pickups, date_time);
}

export async function getLatestTimeHistory(user_id) {
  return apiGetLatestTimeHistory(user_id);
}

export async function getTimeHistoryRange(user_id, days) {
  return apiGetTimeHistoryRange(user_id, days);
}

export async function getPlant(plant_uid) {
  return apiGetPlant(plant_uid);
}

export async function getPlantCharacter(plant_uid) {
  return apiGetPlantCharacter(plant_uid);
}

export async function insertPlantCharacter(
  plant_uid,
  character_health,
  character_image_uri
) {
  return apiInsertPlantCharacter(plant_uid, character_health, character_image_uri);
}

export async function disconnectPlant(auth_uid) {
  return apiDisconnectPlant(auth_uid);
}
