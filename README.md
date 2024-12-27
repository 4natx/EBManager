
<h1 align="center">EB Manager</h1>

<div align="center">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![GitHub Issues](https://img.shields.io/github/issues/4natx/EBManager.svg)](https://github.com/4natx/EBManager/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/4natx/EBManager.svg)](https://github.com/4natx/EBManager/pulls)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](/LICENCE)

</div>


<p align="center"> 🤖 Um bot criado para gerenciar grupos de EB's.
    <br> 
</p>

## 📝 Conteúdo

- ["EB Manager"?](#about)
- [Como Funciona](#working)
- [Como Usar](#usage)
- [Criando seu próprio bot](#getting_started)
- [Programas Utilizados](#built_using)
- [Créditos](#authors)

## 🧐 "EB Manager"? <a name = "about"></a>

Sim, **EB Manager** é um projeto que eu venho trabalhando há alguns meses inicialmente para gerenciar grupos no roblox, depois de um tempo fazendo o bot percebi que ele seria perfeito e ideal para utilizar em alguns servidores de RolePlaying no roblox do gênero Exército Brasileiro, mais conhecido como EB's.

## 💭 Como funciona <a name = "working"></a>

O bot tem vários comandos, contendo comandos de moderação do grupo, moderação in-game, xp e outros.

*O bot escrito nas linguagens JavaScript e TypeScript.*

## 🎈 Como usar <a name = "usage"></a>

O bot utiliza "Slash Commands", que são os comandos utilizando "/"

Um Exemplo de uso de comando seria o exilar.

```
/exile <nome do jogador>
```

O bot usará a conta fornecida no **ROBLOX_COOKIE** para exilar o jogador do grupo.

## 🏁 Criando seu próprio bot <a name = "getting_started"></a>

Aqui abaixo estarei deixando disponível um guia para você poder criar o seu próprio bot.

### Pré-Requisitos

Você precisa ter o [Node.js](https://nodejs.org) para iniciar.
### Configuração

No arquivo **"dotenv"** haverá 4 variáveis, sendo elas:
- **DISCORD_TOKEN** : Colocar o Token do Bot do Discord, caso não tenha criado ainda no [Portal de Desenvolvedores Discord](https://discord.com/developers/applications) você poderá criar um.
- **ROBLOX_API_KEY** : Colocar a API do Jogo caso queira utilizar os comandos in-game, onde você pode adquiri-la no [Creator Hub](https://create.roblox.com/dashboard/credentials?activeTab=ApiKeysTab), caso não queira, poderá ignorar.
- **VERIFICATION_PROVIDER_API_KEY** : Colocar a APIKEY do BloxLink, para adquiri-la você deve acessar o site do [BloxLink](https://blox.link/) e entrar em sua conta, após entrar, você irá acessar o [BloxLink Developer API](https://blox.link/dashboard/user/developer).

- **ROBLOX_COOKIE** : Colocar o cookie da conta do roblox que irá gerenciar o grupo, ela precisará ficar com um cargo com todas as permissões.

Após terminar de preencher o arquivo **"dotenv"** renomeie ele para **.env**

Após a configuração do arquivo dotenv você irá acessar o arquivo **config.ts**. Nele você encontrará a variável **config** que conterá *groupIds* e *permissions*.

- **groupIds** : Você irá colocar o id do grupo.
- **permissions** : Você irá colocar o id dos cargos com permissão para acessar certo comando.

Para conseguir o id dos cargos, você precisará ter modo desenvolvedor ativado em sua conta discord.

### Instalação

#### Aviso: os comandos abaixo serão utilizados somente no Windows.

Após a instalação do programa você irá utilizar o seguinte comando:

```
rd build /s /q & cls & npx tsc --project ./
```

Após executar o comando para construir o projeto, utilize o comando a seguir:

```
node build/index.js
```

Ao utilizar o comando, o bot provavelmente ficará online.

## ⛏️ Programas Utilizados <a name = "built_using"></a>

- [VS Code](https://visualstudio.microsoft.com/vs/community/) - IDE principal utilizada para a criação do bot
- [Node.js](https://nodejs.org/) - Programa utilizado para os pacotes e inicialização e testes do bot
- [Replit](https://replit.com/) - Site alternativo utilizado para testes com o bot

## ✍️ Créditos <a name = "authors"></a>

- [@4Natx](https://github.com/4natx) - Programador
