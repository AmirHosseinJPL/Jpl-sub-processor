const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    try {
      if (request.method === "POST" && url.pathname === "/api/prepare") {
        return await handlePrepare(request);
      }
      if (request.method === "POST" && url.pathname === "/api/create") {
        return await handleCreate(request, env, url.origin);
      }
      if (request.method === "GET" && url.pathname.startsWith("/sub/")) {
        return await handleSub(request, env, url.pathname);
      }
      
      return new Response("JPL Backend is active 🚀", { headers: CORS_HEADERS });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }
  }
};

async function handlePrepare(request) {
  const data = await request.json();
  let rawText = "";

  if (data.subUrl) {
    const res = await fetch(data.subUrl, { headers: { "User-Agent": "v2ray" } });
    if (!res.ok) throw new Error("Fetch failed");
    rawText = await res.text();
    try {
      if (!rawText.includes("://")) rawText = atob(rawText);
    } catch (e) {}
  } else if (data.rawConfigs) {
    rawText = data.rawConfigs;
  }

  let configs = rawText.split('\n').filter(line => line.trim() !== '');
  let parsedConfigs = [];

  for (let raw of configs) {
    raw = raw.trim();
    if (!raw.includes("://")) continue;

    const protocol = raw.split("://")[0].toLowerCase();
    
    if (data.protocols && data.protocols.length > 0) {
       if (!data.protocols.includes(protocol)) continue;
    }

    let host = "", port = "443", name = "Unknown";
    
    try {
       if (protocol === 'vmess') {
         const vmessData = JSON.parse(atob(raw.replace('vmess://', '')));
         host = vmessData.add || vmessData.sni || vmessData.host;
         port = vmessData.port || "443";
         name = decodeURIComponent(vmessData.ps || "vmess");
       } else {
         const urlObj = new URL(raw);
         host = urlObj.hostname;
         port = urlObj.port || "443";
         name = decodeURIComponent(urlObj.hash.replace('#', '')) || protocol;
       }
    } catch (e) {
       host = "error-parsing";
    }

    if (data.customIPs && data.customIPs.length > 0) {
       const randomIp = data.customIPs[Math.floor(Math.random() * data.customIPs.length)];
       if (protocol === 'vmess') {
         try {
            let vmessData = JSON.parse(atob(raw.replace('vmess://', '')));
            vmessData.add = randomIp; 
            raw = 'vmess://' + btoa(JSON.stringify(vmessData));
         } catch(e){}
       } else {
         try {
           const urlObj = new URL(raw);
           urlObj.hostname = randomIp;
           raw = urlObj.toString();
         } catch(e){}
       }
    }

    parsedConfigs.push({ name, host, port, raw });
  }

  return new Response(JSON.stringify({ configs: parsedConfigs }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

async function handleCreate(request, env, origin) {
  const data = await request.json();
  let finalRaw = "";
  
  for (let i = 0; i < data.finalConfigs.length; i++) {
    let raw = data.finalConfigs[i];
    
    if (data.renamePrefix) {
       const prefix = data.renamePrefix + " " + (i + 1);
       if (raw.startsWith('vmess://')) {
         try {
           let vmessData = JSON.parse(atob(raw.replace('vmess://', '')));
           vmessData.ps = prefix;
           raw = 'vmess://' + btoa(JSON.stringify(vmessData));
         } catch(e){}
       } else {
         try {
           const urlObj = new URL(raw);
           urlObj.hash = encodeURIComponent(prefix);
           raw = urlObj.toString();
         } catch(e){}
       }
    }
    finalRaw += raw + "\n";
  }

  const id = Math.random().toString(36).substring(2, 10);
  const subLink = origin + "/sub/" + id;
  const ttl = data.ttl || 86400;
  const base64Configs = btoa(finalRaw);

  if (!env.JPL_KV) {
      throw new Error("KV namespace 'JPL_KV' is missing");
  }

  await env.JPL_KV.put(id, base64Configs, { expirationTtl: ttl });

  return new Response(JSON.stringify({
    id,
    subLink,
    rawConfigs: finalRaw,
    count: data.finalConfigs.length,
    originalCount: data.originalCount,
    expiresIn: ttl
  }), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}

async function handleSub(request, env, pathname) {
  const id = pathname.split("/sub/")[1];
  if (!id) return new Response("Invalid ID", { status: 400, headers: CORS_HEADERS });

  if (!env.JPL_KV) return new Response("KV not configured", { status: 500, headers: CORS_HEADERS });

  const data = await env.JPL_KV.get(id);
  if (!data) return new Response("Not found or expired", { status: 404, headers: CORS_HEADERS });

  return new Response(data, {
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "text/plain; charset=utf-8"
    }
  });
}
