# TecHacker_Roteiro3
Alluno: Matheus Raffaelle Nery Castellucci

# 1.Introdução
Este projeto consiste no desenvolvimento de uma extensão de navegador para detectar ataques e violações de privacidade em clientes web. A extensão foi criada em JavaScript e é compatível com o navegador Firefox, utilizando diversas APIs nativas do navegador para realizar suas funcionalidades.

# 2. Tutorial de uso do projeto
Para utilizar a extensão, siga os passos abaixo:

0. Clone o repositório.

1. Instale o Browser Firefox.

2. Abra o navegador e acesse o endereço `about:debugging`.

3. Clique em `This Firefox` e em seguida em `Load Temporary Add-on...`.

4. Selecione o arquivo `manifest.json` deste repositório.

Após seguir esses passos, a extensão será carregada e estará pronta para uso. Para visualizar os logs gerados pela extensão, vá novamente à página `about:debugging`, clique em "Inspect" ao lado da extensão e, na nova janela, selecione a aba "Console".

# 3. Funcionalidades

## 3.1. Conexões com Domínios de tereira parte
A extensão monitora as conexões com domínios de terceiros realizadas pela página atual. Ela utiliza a API `webRequest` para rastrear essas requisições. A interface popup da extensão exibe um resumo das conexões, mostrando apenas os links dessas requisições. No entanto, ao clicar no botão "Get Third-Party URLs", um arquivo `urls.txt` contendo a lista completa das conexões será baixado.

## 3.2. Cookies
A extensão monitora e categoriza os cookies em duas classes:

- Cookies de Primeira Parte: pertencentes ao domínio visitado.
- Cookies de Terceiros: pertencentes a domínios diferentes.

Além disso, ela distingue entre cookies de sessão (que expiram ao fechar o navegador) e cookies persistentes (que permanecem após o fechamento). Esses dados são exibidos na interface, mostrando o número total de cookies e a contagem por categoria.

## 3.3. Armazenamento Local
A extensão verifica o uso de armazenamento local (localStorage) em cada página acessada, utilizando um script de conteúdo para monitorar os dados armazenados localmente no navegador.

## 3.4. Sincronismo de Cookies
A sincronização de cookies é uma prática utilizada por empresas de publicidade para compartilhar informações sobre os usuários entre diferentes sites. Isso permite acompanhar a atividade de navegação e aprimorar a segmentação de anúncios. A extensão detecta quando esses cookies são sincronizados entre diferentes domínios para construção de perfis de usuário.

## 3.5. Privacy Score
A extensão também calcula um "Privacy Score" para cada domínio visitado. Esse score fornece ao usuário uma visão clara sobre o nível de rastreamento e coleta de dados que está ocorrendo em cada site, facilitando a compreensão das práticas de privacidade.

## 3.6. Canvas Fingerprinting
A extensão também vasculha o site atrás de elementos `<Canvas>` e verifica se o site está tentando fazer fingerprinting do usuário.


# 4. Referências Utilizadas
- https://developer.mozilla.org/pt-BR/docs/Mozilla/Add-ons/WebExtensions/Your_second_WebExtension
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Work_with_the_Cookies_API
- https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest
- https://developer.mozilla.org/pt-BR/docs/Mozilla/Add-ons/WebExtensions/API/cookies

