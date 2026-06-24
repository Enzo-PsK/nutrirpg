# ⚔️ NutriRPG

> **Gamificação da Nutrição e Gestão de Hábitos Alimentares**

Aplicação multiplataforma (Mobile + Web) que combina mecânicas de RPG com monitorização nutricional para incentivar hábitos saudáveis.

---

## 📁 Estrutura do Projeto

```
nutrirpg/
├── backend/            # API REST (Node.js + Express)
├── frontend-mobile/    # App Mobile (React Native)
├── frontend-web/       # Portal Web Admin (React.js)
└── database/           # Schema PostgreSQL
```

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js v18+
- PostgreSQL 14+
- npm ou yarn

### 1. Base de Dados

```bash
# Criar a base de dados
createdb nutrirpg

# Aplicar o schema
psql -d nutrirpg -f database/schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # Editar com as suas credenciais
npm install
npm run dev                  # Inicia em http://localhost:3000
```

### 3. Frontend Mobile

```bash
cd frontend-mobile
npm install
npx expo start               # Abre o Expo Go
```

### 4. Frontend Web (Admin)

```bash
cd frontend-web
npm install
npm start                    # Abre em http://localhost:3001
```

---

## 🎮 Funcionalidades

| Módulo | Descrição |
|--------|-----------|
| **Autenticação** | Registo/login com JWT (7 dias) |
| **Personagem RPG** | Nível, XP, barra de progressão |
| **Hidratação** | Meta diária automática (35 ml/kg), registo rápido |
| **Dispensa** | CRUD de alimentos, alertas de stock baixo |
| **Receitas** | Sugestão por ingredientes disponíveis |
| **Portal Web** | Dashboard do nutricionista com histórico XP |

---

## 🎯 Motor de XP

| Ação | XP |
|------|----|
| Beber água | +10 |
| Comer fruta | +25 |
| Comer vegetais | +20 |
| Plano alimentar completo | +50 |
| Meta de hidratação atingida | +30 |
| Login diário | +15 |

**Fórmula de nível:** `threshold(n) = floor(100 × n^1.5)`

---

## 🧪 Testes

```bash
cd backend
npm test             # 8 testes unitários (Jest)
```

---

## 🛠️ Stack Tecnológica

- **Backend:** Node.js, Express, Sequelize ORM
- **Base de Dados:** PostgreSQL
- **Mobile:** React Native (Expo)
- **Web:** React.js
- **Estado:** Redux Toolkit
- **Auth:** JWT (jsonwebtoken) + bcryptjs
- **Testes:** Jest + Supertest

---

## 👤 Autor

**Enzo Borges** (2200408)  
Licenciatura em Engenharia Informática  
Projeto de Engenharia Informática — 2025/2026  
Orientador: Paulo Pombinho de Matos
