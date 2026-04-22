# 📋 ENADE Checklist

Aplicação web para acompanhamento de estudos para o ENADE, com checklist interativo, autenticação de usuários e painel administrativo.

---

## 🌐 Acesse o projeto

👉 https://enadequestoes.web.app/

---

## 🚀 Funcionalidades

* ✅ Login e cadastro com Firebase Auth
* 📊 Progresso individual salvo na nuvem
* 🧠 Checklist organizado por categorias
* ⚙️ Painel Admin para editar conteúdos
* 👥 Visualização de alunos e progresso
* ☁️ Deploy com Firebase Hosting

---

## 🛠️ Tecnologias

* HTML, CSS, JavaScript (Vanilla)
* Firebase (Auth + Firestore + Hosting)

---

## 📂 Estrutura

```bash
/public
  └── index.html
firebase.json
.firebaserc
```

---

## 🔥 Configuração

1. Instale o Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Faça login:

```bash
firebase login
```

3. Inicie o projeto:

```bash
firebase init
```

4. Rode localmente:

```bash
firebase serve
```

5. Deploy:

```bash
firebase deploy
```

---

## 👑 Admin

Defina emails admins no código:

```js
const ADMIN_EMAILS = ["admintop@admin.com"];
```

Usuários admins têm acesso ao painel de edição.

---

## ⚠️ Observações

* O primeiro acesso cria automaticamente o usuário no Firestore
* O progresso é salvo por usuário
* Alterações no admin reiniciam o progresso

---

## 📌 Status

🚧 Em desenvolvimento — melhorias contínuas em andamento.
