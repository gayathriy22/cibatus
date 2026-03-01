/**
 * Backend API client. All table access goes through the server; no direct Supabase DB/Storage.
 */

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';
if (!BASE && typeof __DEV__ !== 'undefined' && __DEV__) {
  console.warn(
    'EXPO_PUBLIC_API_URL is not set; API calls will fail. Set it in .env to your backend URL.'
  );
}

async function getAccessToken() {
  const { supabase } = await import('./supabase');
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request(path, options = {}) {
  const token = await getAccessToken();
  if (!token) {
    return { data: null, error: 'Not authenticated', status: 401 };
  }
  const url = BASE ? `${BASE.replace(/\/$/, '')}${path}` : path;
  const headers = {
    Authorization: `Bearer ${token}`,
    ...(options.headers ?? {}),
  };
  if (
    options.body != null &&
    typeof options.body === 'object' &&
    !(options.body instanceof FormData)
  ) {
    headers['Content-Type'] = 'application/json';
  }
  const method = options.method ?? 'GET';
  const body =
    options.body instanceof FormData
      ? options.body
      : options.body != null
        ? JSON.stringify(options.body)
        : undefined;
  try {
    const res = await fetch(url, {
      ...options,
      method,
      headers,
      body,
    });
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        return {
          data: null,
          error: text || res.statusText,
          status: res.status,
        };
      }
    }
    if (!res.ok) {
      const obj = data ?? {};
      const err = obj.detail
        ? `${obj.error ?? 'Error'}: ${obj.detail}`
        : (obj.error ?? text) || res.statusText;
      return { data: null, error: err, status: res.status };
    }
    return { data, error: null, status: res.status };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { data: null, error: message, status: 0 };
  }
}

export async function apiGetProfile() {
  const { data, error } = await request('/api/profile');
  if (error) return null;
  return data;
}

export async function apiCreateProfile(auth_uid, payload) {
  const { data, error } = await request('/api/profile', {
    method: 'POST',
    body: payload,
  });
  if (error) return null;
  return data;
}

export async function apiDisconnectPlant(auth_uid) {
  const { error, status } = await request('/api/profile/disconnect-plant', {
    method: 'PATCH',
  });
  return status === 200 && !error;
}

export async function apiCreatePlant(plant_uid, plant_name, plant_img_uri) {
  const { data, error } = await request('/api/plants', {
    method: 'POST',
    body: { plant_uid, plant_name, plant_img_uri },
  });
  if (error) return null;
  return data;
}

export async function apiGetPlant(plant_uid) {
  const { data, error } = await request(
    `/api/plants/${encodeURIComponent(plant_uid)}`
  );
  if (error) return null;
  return data;
}

export async function apiInsertPlantCharacter(
  plant_uid,
  character_health,
  character_image_uri
) {
  const { data, error } = await request('/api/plants/character', {
    method: 'POST',
    body: { plant_uid, character_health, character_image_uri },
  });
  if (error) return null;
  return data;
}

export async function apiGetPlantCharacter(plant_uid) {
  const { data, error } = await request(
    `/api/plants/${encodeURIComponent(plant_uid)}/character`
  );
  if (error) return null;
  return data;
}

export async function apiAppendTimeHistory(
  user_id,
  daily_total,
  daily_pickups,
  date_time
) {
  const { data, error } = await request('/api/time-history', {
    method: 'POST',
    body: { daily_total, daily_pickups, date_time },
  });
  if (error) return null;
  return data;
}

export async function apiGetLatestTimeHistory(user_id) {
  const { data, error } = await request('/api/time-history/latest');
  if (error) return null;
  return data;
}

export async function apiGetTimeHistoryRange(user_id, days) {
  const { data, error } = await request(`/api/time-history?days=${days}`);
  if (error) return [];
  return data ?? [];
}

export async function apiUploadPlantImage(uri, fileName) {
  const token = await getAccessToken();
  if (!token || !BASE) return null;
  const formData = new FormData();
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    formData.append('file', blob, fileName);
  } catch (e) {
    console.error('apiUploadPlantImage fetch blob', e);
    return null;
  }
  const url = `${BASE.replace(/\/$/, '')}/api/upload/plant-image`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return json.publicUrl ?? null;
}
