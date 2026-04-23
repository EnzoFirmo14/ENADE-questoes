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

## 📖 Guias de Configuração

- **[SETUP.md](SETUP.md)** - Guia completo de configuração (recomendado lê primeiro!)
- **[scripts/README.md](scripts/README.md)** - Documentação de scripts automatizados

---

## 🚀 Início Rápido

## 📂 Estrutura

```bash
/public
  └── index.html
firebase.json
.firebaserc
```

---

## 🔥 Configuração

### 1. Configurar Variáveis de Ambiente

⚠️ **IMPORTANTE**: Nunca exponha dados sensíveis no repositório. Use arquivo `.env`.

1. Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

2. Edite `.env` com seus dados reais do Firebase:

```bash
VITE_FIREBASE_API_KEY=sua_chave_aqui
VITE_FIREBASE_AUTH_DOMAIN=seu_dominio.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu_projeto_id
VITE_FIREBASE_STORAGE_BUCKET=seu_storage.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
VITE_FIREBASE_APP_ID=seu_app_id

VITE_ADMIN_EMAILS=seu-email@exemplo.com,outro-admin@exemplo.com
```

3. O arquivo `.env` **não será commitado** (está no `.gitignore`).

### 2. Injetar Variáveis de Ambiente

Para o navegador ter acesso às variáveis de ambiente, você tem duas opções:

#### Opção A: Desenvolvedores Locais (Recomendado)

Crie um arquivo `public/env-loader.html` ou injete via script no `index.html`:

```html
<script>
  // Carregar variáveis de ambiente durante desenvolvimento
  // Isso será substituído pelo Firebase durante deploy
  window.__ENV__ = {
    VITE_FIREBASE_API_KEY: 'sua_chave_local',
    VITE_FIREBASE_AUTH_DOMAIN: 'seu_dominio.firebaseapp.com',
    // ... outras variáveis
  };
</script>
```

#### Opção B: Firebase Functions (Produção)

Durante o deploy no Firebase, configure as variáveis de ambiente:

```bash
firebase deploy --only functions
```

Ou via Firebase Console: Project Settings → Environment Variables

#### Opção C: Build com Vite (Recomendado para produção)

Se usar Vite, instale:

```bash
npm install -D vite
```

Crie `vite.config.js`:

```javascript
export default {
  define: {
    __ENV__: JSON.stringify(process.env)
  }
};
```

Execute:

```bash
npm run build
firebase deploy
```

### 3. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 4. Fazer Login

```bash
firebase login
```

### 5. Iniciar o Projeto

```bash
firebase init
```

### 6. Executar Localmente

```bash
firebase serve
```

### 7. Fazer Deploy

```bash
firebase deploy
```

---

## 👑 Admin

Defina emails de admin no arquivo `.env`:

```bash
VITE_ADMIN_EMAILS=admintop@admin.com,outro-admin@exemplo.com
```

Separe múltiplos emails com vírgula (sem espaços).

Usuários com esses emails têm acesso automático ao painel de edição.

---

## ⚠️ Observações

* O primeiro acesso cria automaticamente o usuário no Firestore
* O progresso é salvo por usuário
* Alterações no admin reiniciam o progresso

---

## 📌 Status

🚧 Em desenvolvimento — melhorias contínuas em andamento.
