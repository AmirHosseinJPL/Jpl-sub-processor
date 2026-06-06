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

/**
 * Expands an array of IPs and/or CIDR ranges into a flat list of individual IPs.
 * CIDR ranges are capped at 256 hosts (/24 or wider) to prevent memory exhaustion.
 */
function expandIPs(entries) {
  const result = [];
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    if (!trimmed.includes('/')) {
      result.push(trimmed);
      continue;
    }

    // CIDR expansion
    const [baseAddr, prefixStr] = trimmed.split('/');
    const prefix = parseInt(prefixStr, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      result.push(baseAddr); // fallback: treat as plain IP
      continue;
    }

    const hostBits = 32 - prefix;
    // Cap at /24 (256 hosts) to be safe; larger ranges only use first 256 hosts
    const count = Math.min(Math.pow(2, hostBits), 256);

    const parts = baseAddr.split('.').map(Number);
    const baseInt = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    const networkInt = (baseInt & (0xFFFFFFFF << hostBits)) >>> 0;

    for (let i = 0; i < count; i++) {
      const ipInt = (networkInt + i) >>> 0;
      const ip = [
        (ipInt >>> 24) & 0xFF,
        (ipInt >>> 16) & 0xFF,
        (ipInt >>> 8)  & 0xFF,
         ipInt         & 0xFF,
      ].join('.');
      result.push(ip);
    }
  }
  return result;
}

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

  const expandedIPs = (data.customIPs && data.customIPs.length > 0)
    ? expandIPs(data.customIPs)
    : [];

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

    if (expandedIPs.length > 0) {
      for (const ip of expandedIPs) {
        let patchedRaw = raw;
        if (protocol === 'vmess') {
          try {
            let vmessData = JSON.parse(atob(raw.replace('vmess://', '')));
            vmessData.add = ip;
            patchedRaw = 'vmess://' + btoa(JSON.stringify(vmessData));
          } catch (e) {}
        } else {
          try {
            const urlObj = new URL(raw);
            urlObj.hostname = ip;
            patchedRaw = urlObj.toString();
          } catch (e) {}
        }
        parsedConfigs.push({ name, host: ip, port, raw: patchedRaw });
      }
    } else {
      parsedConfigs.push({ name, host, port, raw });
    }
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
