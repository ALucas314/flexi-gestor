// 🚀 Servidor Express para Flexi Gestor
// Este arquivo configura e inicia o servidor backend com Express

import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

// Importar rotas
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import movementRoutes from './routes/movements';
import notificationRoutes from './routes/notifications';
import batchRoutes from './routes/batches';

// Criar instância do Express
const app = express();
const PORT = process.env.PORT || 3001;

// Criar instância do Prisma Client
export const prisma = new PrismaClient();

// ⚙️ Middlewares
app.use(cors()); // Permitir requisições de qualquer origem
app.use(express.json()); // Parser para JSON

// 📝 Log de requisições
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`);
  next();
});

// 🛣️ Rotas
app.use('/api/auth', authRoutes); // Rotas de autenticação
app.use('/api/products', productRoutes); // Rotas de produtos
app.use('/api/movements', movementRoutes); // Rotas de movimentações
app.use('/api/notifications', notificationRoutes); // Rotas de notificações
app.use('/api/batches', batchRoutes); // Rotas de lotes

// 🏠 Rota raiz
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 API Flexi Gestor está rodando!',
    version: '2.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      movements: '/api/movements',
      notifications: '/api/notifications',
      batches: '/api/batches'
    }
  });
});

// ❌ Tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: err.message 
  });
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Prisma conectado ao banco de dados SQLite`);
});

// 🔄 Cleanup ao encerrar
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('👋 Servidor encerrado');
  process.exit(0);
});

