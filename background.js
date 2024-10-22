// Array para armazenar URLs de terceiros
let thirdPartyRequests = [];
let canvasFingerprintingDetected = [];

// Função para lidar com requisições feitas pelo navegador
const detectarConexoesDeTerceiraParte = requestDetails => {
  try {
    // Verifica se a requisição possui uma URL de origem válida
    if (!requestDetails.originUrl) return; // Se não houver URL de origem, interrompe o processamento

    // Cria objetos URL para a URL de origem e para a URL da requisição
    let sourceUrl = new URL(requestDetails.originUrl);
    let targetUrl = new URL(requestDetails.url);

    // Verifica se a requisição é de terceiros, comparando os hostnames
    if (sourceUrl.hostname !== targetUrl.hostname) {
      console.log("%cConexão a domínio de terceira parte detectada:", 'color: purple;', requestDetails.url);
      thirdPartyRequests.push(requestDetails.url); // Armazena a URL de terceiro detectada
    }

    // Map para monitorar cookies e identificar sincronização
    const cookiesTracker = new Map();

    // Itera pelos headers da requisição procurando pelo header 'cookie'
    for (const header of requestDetails.requestHeaders) {
      if (header.name.toLowerCase() === 'cookie') {
        // Divide os cookies em pares nome-valor e armazena no Map
        const cookies = header.value.split(';');
        for (const cookie of cookies) {
          const [key, val] = cookie.split('=').map(part => part.trim());
          if (cookiesTracker.has(val)) {
            cookiesTracker.get(val).push(requestDetails.originUrl);
          } else {
            cookiesTracker.set(val, [requestDetails.originUrl]);
          }
        }
      }
    }

    // Verifica se algum valor de cookie foi sincronizado entre múltiplas URLs
    for (const [value, urls] of cookiesTracker) {
      if (urls.length > 1) {
        console.log(`%cPossível sincronização do valor ${value} entre as URLs: ${urls.join(", ")}`, 'color: orange;');
      }
    }

  } catch (error) {
    console.error("%cErro ao processar a requisição:", 'color: red;', error);
  }
};

// Função para obter todas as chaves do LocalStorage de uma aba específica
const detectarArmazenamentoLocal = async tabId => {
  try {
    const scriptToExecute = `[...Array(localStorage.length).keys()].map(index => localStorage.key(index));`;
    const keys = await browser.tabs.executeScript(tabId, { code: scriptToExecute });

    if (browser.runtime.lastError) {
      console.error("%cErro ao acessar o LocalStorage:", 'color: red;', browser.runtime.lastError);
      return { storageAvailable: false };
    }

    const allKeys = keys.flat();
    const hasStorage = allKeys.length > 0;
    console.log(`%c[LocalStorage] ${hasStorage ? "Chaves encontradas" : "Nenhuma chave encontrada"}`, 'color: blue;');

    return { storageAvailable: hasStorage, keys: allKeys };
  
  } catch (err) {
    console.error("%cErro ao obter as chaves do LocalStorage:", 'color: red;', err);
    return { storageAvailable: false };
  }
};

// Função para calcular a pontuação de privacidade de uma página
async function calculoPontuacaoSeguranca(tabId, tabUrl) {
  try {
    const domain = new URL(tabUrl).hostname;
    const uniquethirdPartyRequests = [...new Set(thirdPartyRequests)];
    const cookies = await browser.cookies.getAll({ url: tabUrl });
    const thirdPartyCookies = cookies.filter(cookie => cookie.domain !== domain);
    const firstPartyCookies = cookies.filter(cookie => cookie.domain === domain);
    const localStorageData = await detectarArmazenamentoLocal(tabId);

    const WEIGHTS = {
      thirdPartyUrls: 0.25,
      thirdPartyCookies: 3,
      firstPartyCookies: 1,
      localStorage: 1.5,
      canvasFingerprinting: 5
    };
  
    let score = 0;
    score += WEIGHTS.thirdPartyUrls * uniquethirdPartyRequests.length;
    score += WEIGHTS.thirdPartyCookies * thirdPartyCookies.length;
    score += WEIGHTS.firstPartyCookies * firstPartyCookies.length;
    score += WEIGHTS.localStorage * (localStorageData.storageAvailable ? localStorageData.keys.length : 0);
    score += WEIGHTS.canvasFingerprinting * canvasFingerprintingDetected.length;
  
    const scaledScore = (score / 500) * 100;
    const invertedScore = 100 - scaledScore;
  
    return invertedScore;
  } catch (err) {
    console.error("%cErro ao calcular pontuação de privacidade:", 'color: red;', err);
    return 0;
  }
}

// Função para injetar o script de fingerprinting
const injectCanvasFingerprintingScript = tabId => {
  browser.tabs.executeScript(tabId, { file: "detectCanvasFingerprint.js" })
    .then(() => {
      console.log("[Background] Script de canvas fingerprinting injetado na aba:", tabId);
    })
    .catch(err => console.error("[Background] Erro ao injetar script de canvas fingerprinting:", err));
};

// Listener para monitorar requisições de cabeçalho
browser.webRequest.onBeforeSendHeaders.addListener(
  detectarConexoesDeTerceiraParte,
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Listener para injetar o script de Canvas Fingerprinting
// Listener para injetar o script de Canvas Fingerprinting
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && /^http/.test(tab.url)) {
    console.log(`[Injeção de Script] Tentando injetar script de Canvas Fingerprinting na aba com URL: ${tab.url}`);
    browser.tabs.executeScript(tabId, {
      file: "detectCanvasFingerprint.js"
    }).then(() => {
      console.log("[Injeção de Script] Script de Canvas Fingerprinting injetado com sucesso.");
    }).catch((error) => {
      console.error("[Erro] Falha ao injetar script de Canvas Fingerprinting:", error);
    });
  }
});


// Listener para lidar com mensagens recebidas pelo runtime
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Mensagem recebida no background.js:", message); // Adicione este log para depurar
  switch(message.action) {

    case "getThirdPartyUrls":
      const distinctUrls = [...new Set(thirdPartyRequests)];
      console.log("Enviando URLs de terceiros detectadas:", distinctUrls);
      sendResponse({ urls: distinctUrls });
      setTimeout(() => {
        thirdPartyRequests = [];
      }, 100); // Limpa o array após um curto período para garantir que a resposta foi enviada
      break;

    case "getCookieCount":
      console.log("%c[COOKIES] Contagem de cookies para o domínio:", 'color: green;', message.domain);
      if (!isCookieStorageEnabled()) {
        console.log("Armazenamento de cookies não habilitado");
        sendResponse({ error: "O armazenamento de cookies não está habilitado" });
      } else {
        getCookieCount(message.domain).then(cookieCount => sendResponse({ cookieCount }));
      }
      return true;

    case "checkLocalStorage":
      console.log("%c[LocalStorage] Verificando LocalStorage para tabId:", 'color: green;', message.tabId);
      detectarArmazenamentoLocal(message.tabId).then(localStorageInfo => sendResponse(localStorageInfo));
      return true;

    case "getPrivacyScore":
      console.log("Calculando pontuação de privacidade para tabUrl:", message.tabUrl);
      calculoPontuacaoSeguranca(message.tabId, message.tabUrl).then(privacyScore => {
        console.log("Pontuação de privacidade calculada:", privacyScore);
        sendResponse({ privacyScore });
      });
      return true;

    case "canvasFingerprintDetected":
      console.log(`[Background] Canvas fingerprinting detectado via ${message.method} em ${message.url}`);
      sendResponse({ status: "detected" });
      canvasFingerprintingDetected.push({ method: message.method, url: message.url });
      break;

    case "getCanvasFingerprintData":
      console.log("[Background] Enviando dados de fingerprint para popup");
      sendResponse({ data: canvasFingerprintingDetected });
      break;

    default:
      console.error("Ação desconhecida recebida:", message.action);
  }
});
