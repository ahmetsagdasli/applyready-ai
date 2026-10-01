import apiClient from './client.js';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// formData: FormData (cvText, jobText, targetPosition, language, style, cvFile?)
// token: opsiyonel - varsa backend sonucu kaydeder.
// AI pipeline 6 ardisik OpenAI cagrisi yapar (~25-40sn); bu yuzden global 15sn
// timeout yetmez, bu istege ozel 120sn timeout veriyoruz.
export async function createAnalyzedApplication(formData, token) {
  const { data } = await apiClient.post('/applications/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...authHeaders(token) },
    timeout: 120000,
  });
  return data;
}

// Streaming varyant: ?stream=1 ile SSE. onProgress({ step, total, label })
// her adimda cagrilir; nihai sonuc cozulur. Hata sekli axios'unkine benzer
// tutulur ({ response: { data, status } }) ki mevcut limit/hata yonetimi calissin.
export async function createAnalyzedApplicationStream(formData, token, onProgress) {
  const res = await fetch('/api/applications/analyze?stream=1', {
    method: 'POST',
    // Content-Type'i ELLE verme; tarayici multipart boundary'yi kendi koyar.
    headers: { ...authHeaders(token) },
    body: formData,
  });

  const ctype = res.headers.get('content-type') || '';

  // Stream baslamadan donen hata (or. 400 validation, 402 limit) → JSON.
  if (!res.ok || !ctype.includes('text/event-stream')) {
    let data = null;
    try {
      data = await res.json();
    } catch {
      /* JSON degilse yut */
    }
    const err = new Error(data?.message || 'Analiz baslatilamadi.');
    err.response = { data: data || {}, status: res.status };
    throw err;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalResult = null;

  const handleBlock = (block) => {
    let event = 'message';
    let dataStr = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
    }
    if (!dataStr) return;
    let payload;
    try {
      payload = JSON.parse(dataStr);
    } catch {
      return;
    }
    if (event === 'progress') onProgress?.(payload);
    else if (event === 'result') finalResult = payload;
    else if (event === 'error') {
      const err = new Error(payload.message || 'Analiz sirasinda bir hata olustu.');
      err.response = { data: payload, status: 500 };
      throw err;
    }
  };

  // SSE event'leri \n\n ile ayrilir.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      handleBlock(block);
    }
  }

  if (!finalResult) throw new Error('Analiz tamamlanamadi (sonuc alinamadi).');
  return finalResult;
}

// Gorev 1 — gap cevaplariyla CV/on yazi/LinkedIn'i yeniden uretir.
// payload: { parsedCv, jobAnalysis, matchResult, targetPosition, language, style,
//            applicationId?, gapAnswers: [{keyword, answer, hasIt}] }
export async function refineApplication(payload, token) {
  const { data } = await apiClient.post('/applications/refine', payload, {
    headers: authHeaders(token),
    timeout: 120000,
  });
  return data;
}

export async function listApplications(token) {
  const { data } = await apiClient.get('/applications', {
    headers: authHeaders(token),
  });
  return data.applications;
}

export async function getApplication(id, token) {
  const { data } = await apiClient.get(`/applications/${id}`, {
    headers: authHeaders(token),
  });
  return data.application;
}

export async function updateApplication(id, updates, token) {
  const { data } = await apiClient.put(`/applications/${id}`, updates, {
    headers: authHeaders(token),
  });
  return data.application;
}

export async function deleteApplication(id, token) {
  const { data } = await apiClient.delete(`/applications/${id}`, {
    headers: authHeaders(token),
  });
  return data;
}
