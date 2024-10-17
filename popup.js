// Manipulador de resposta da pontuação de privacidade
function handlePrivacyScoreResponse(message) {
  const privacyScoreElement = document.getElementById("privacy-score");
  if (message && message.privacyScore) {
    const score = message.privacyScore.toFixed(2);
    privacyScoreElement.textContent = `Privacy Score: ${score}`;
    privacyScoreElement.className = score < 30 ? "red" : score <= 70 ? "yellow" : "green";
  } else {
    privacyScoreElement.textContent = "Não foi possível recuperar a pontuação de privacidade.";
    privacyScoreElement.style.color = "black";
  }
}

// Manipulador de resposta das URLs de terceiros
function handleUrlsResponse(message) {
  console.log("handleUrlsResponse chamado com a mensagem:", message); // Log para depuração
  const urlsList = document.getElementById("urls-list");
  urlsList.textContent = "";

  if (message && message.urls) {
    let urlsForFile = "";

    message.urls.forEach(url => {
      const parsedUrl = new URL(url).hostname;
      const listItem = document.createElement('li');
      listItem.textContent = parsedUrl;
      urlsList.appendChild(listItem);
      urlsForFile += `${url}\n\n`;
    });

    const blob = new Blob([urlsForFile], { type: "text/plain;charset=utf-8" });
    const blobURL = window.URL.createObjectURL(blob);
    const tempLink = document.createElement('a');
    tempLink.href = blobURL;
    tempLink.download = 'urls.txt';
    document.body.appendChild(tempLink);  // Adiciona temporariamente o link ao documento
    tempLink.click();                     // Clica programaticamente no link para acionar o download
    document.body.removeChild(tempLink);  // Remove o link do documento
  } else {
    const p = document.createElement('p');
    p.textContent = "Não foi possível recuperar as URLs de Terceiros.";
    urlsList.appendChild(p);
  }
}

// Manipulador de resposta do LocalStorage
function handleLocalStorageResponse(message) {
  const LSstatus = document.getElementById("localStorage-status");
  const LSdata = document.getElementById("localStorage-data");

  if (LSstatus) {
    LSstatus.textContent = message.storageAvailable ? `${message.keys.length} key(s) found in Local Storage!` : "LocalStorage: No keys were found.";
  }

  if (LSdata) {
    LSdata.innerHTML = '';
    if (message.storageAvailable && message.keys) {
      message.keys.forEach(key => {
        const listItem = document.createElement('li');
        listItem.textContent = key;
        LSdata.appendChild(listItem);
      });
    } else {
      const messageElement = document.createElement('p');
      messageElement.textContent = "Nenhuma instância de LocalStorage encontrada nesta página.";
      LSdata.appendChild(messageElement);
    }
  }
}

// Conta e categoriza cookies
function countCookies(cookies, domain) {
  const firstPartyCookies = cookies.filter(cookie => cookie.domain === domain);
  const thirdPartyCookies = cookies.filter(cookie => cookie.domain !== domain);
  const sessionCookies = cookies.filter(cookie => typeof cookie.expirationDate === "undefined");
  const persistentCookies = cookies.filter(cookie => typeof cookie.expirationDate !== "undefined");

  document.getElementById("session-count").textContent = `Number of Session Cookies: ${sessionCookies.length}`;
  document.getElementById("persistent-count").textContent = `Number of Persistent Cookies: ${persistentCookies.length}`;
  document.getElementById("first-party-count").textContent = `Number of First-Party Cookies: ${firstPartyCookies.length}`;
  document.getElementById("third-party-count").textContent = `Number of Third-Party Cookies: ${thirdPartyCookies.length}`;
  document.getElementById("total-count").textContent = `Total Cookies: ${cookies.length}`;
}

// Detecta sincronização de cookies
function detectSyncronism(cookies) {
  const cookieMap = new Map();

  cookies.forEach(cookie => {
    if (cookieMap.has(cookie.value)) {
      cookieMap.get(cookie.value).push(cookie.domain);
    } else {
      cookieMap.set(cookie.value, [cookie.domain]);
    }
  });

  for (const [value, domains] of cookieMap.entries()) {
    if (domains.length > 1) {
      document.getElementById("sync-cookies-status").textContent = `Possible syncing of ${value} between these domains: ${domains.join(", ")}`;
    }
    else {
      document.getElementById("sync-cookies-status").textContent = "No syncing detected.";
    }''
  }
}

// Limpa os logs da interface
function clearLogs() {
  document.getElementById("urls-list").textContent = "";
  document.getElementById("first-party-count").textContent = "";
  document.getElementById("third-party-count").textContent = "";
  document.getElementById("session-count").textContent = "";
  document.getElementById("persistent-count").textContent = "";
  document.getElementById("total-count").textContent = "";
  document.getElementById("localStorage-status").textContent = "";
  document.getElementById("localStorage-data").textContent = "";
  document.getElementById("sync-cookies-status").textContent = "";
}

// Manipulador de evento principal
document.addEventListener('DOMContentLoaded', function() {
  browser.tabs.query({ active: true, currentWindow: true }).then(async (tabs) => {
    const tab = tabs[0];

    try {
      const url = new URL(tab.url);
      document.getElementById("tab-domain").textContent = `Current domain: ${url.hostname}`;

      browser.runtime.sendMessage({ action: "getPrivacyScore", tabId: tab.id, tabUrl: tab.url })
        .then(handlePrivacyScoreResponse)
        .catch(handleError);

      document.getElementById("get-urls").addEventListener('click', function() {
        browser.runtime.sendMessage({ action: "getThirdPartyUrls" })
          .then(handleUrlsResponse)
          .catch(handleError);
      });

      document.getElementById("check-localStorage").addEventListener('click', function() {
        browser.runtime.sendMessage({ action: "checkLocalStorage", tabId: tab.id })
          .then(handleLocalStorageResponse)
          .catch(handleError);
      });

      document.getElementById("check-cookies").addEventListener('click', async function() {
        const cookies = await browser.cookies.getAll({ url: url.href });
        countCookies(cookies, url.hostname);
      });

      document.getElementById("sync-cookies").addEventListener('click', async function() {
        console.log("Botão Detect Cookies Syncing foi clicado");
        const cookies = await browser.cookies.getAll({ url: url.href });
        detectSyncronism(cookies);
      });

      document.getElementById("clear").addEventListener('click', clearLogs);

    } catch (error) {
      console.error("URL inválida:", tab.url);
    }
  });

  function handleError(error) {
    console.error(`Erro: ${error}`);
  }
});