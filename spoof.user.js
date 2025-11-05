// ==UserScript==
// @name         spoofer universal de erros
// @namespace    http://tampermonkey.net/
// @version      1
// @description  intercepta requisições de rede para forçar erros
// @match        https://digite-um-endereço.aqui
// 
// mude  o endereço apartir de @match para outro site.
// 
// @run-at       document-start 
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // ----------------------------------------------------------------------
    // tipos de erro (mude só esta linha!)
    // ----------------------------------------------------------------------
    // opções: 'none', 'network', '400', '401', '403', '404', '429', '500', etc.
    const MOCK_ERROR_TYPE = '500'; 
    // ----------------------------------------------------------------------
    
    // desligado
    if (MOCK_ERROR_TYPE === 'NONE') {
        console.log("[spoofer] desligado");
        return; 
    }

    const originalFetch = window.fetch;
    const OriginalXMLHttpRequest = window.XMLHttpRequest;
    const status_code = parseInt(MOCK_ERROR_TYPE) || 0; 
    const isNetworkError = MOCK_ERROR_TYPE === 'NETWORK';


    // === intercepta 'fetch' ===
    if (typeof originalFetch !== 'undefined') {
        window.fetch = function(url, options) {
            console.warn(`[fetch] requisição interceptada para: ${url} erro: ${MOCK_ERROR_TYPE}`);

            if (isNetworkError) {
                return new Promise((_, reject) => {
                    reject(new TypeError('failed to fetch (network error spoofed)')); 
                });
            }

            const error_response = {
                status: status_code,
                statusText: `spoofed http error ${status_code}`,
                ok: false,
                json: () => Promise.resolve({ error: `código ${status_code} forçado` }),
                text: () => Promise.resolve(`erro http ${status_code} simulado`),
                headers: new Headers()
            };

            return Promise.resolve(error_response);
        };
    }

    // === intercepta 'xmlhttprequest' ===
    if (typeof OriginalXMLHttpRequest !== 'undefined') {
        window.XMLHttpRequest = function() {
            const xhr = new OriginalXMLHttpRequest();
            
            xhr.send = function() {
                console.warn(`[xhr] requisição interceptada, erro: ${MOCK_ERROR_TYPE}.`);

                setTimeout(() => {
                    if (xhr.onreadystatechange) {
                        Object.defineProperty(xhr, 'readyState', { value: 4 });
                        Object.defineProperty(xhr, 'status', { value: isNetworkError ? 0 : status_code });

                        if (xhr.onerror) xhr.onerror();
                        if (!isNetworkError && xhr.onload) xhr.onload();
                    }
                }, 10);
            };
            return xhr;
        };
    }
    
    // sucesso
    console.log(`[spoofer] sucesso, cenário de teste: ${MOCK_ERROR_TYPE}.`);

})();
