// 🧹 Script para Limpar Banco de Dados
// Este script deleta todos os dados do banco de dados

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('🧹 Iniciando limpeza do banco de dados...');
    
    // Deletar todos os dados (na ordem correta devido às relações)
    console.log('🗑️ Deletando notificações...');
    const notificationsResult = await prisma.notification.deleteMany();
    console.log(`✅ ${notificationsResult.count} notificações deletadas`);
    
    console.log('🗑️ Deletando movimentações...');
    const movementsResult = await prisma.movement.deleteMany();
    console.log(`✅ ${movementsResult.count} movimentações deletadas`);
    
    console.log('🗑️ Deletando lotes...');
    const batchesResult = await prisma.batch.deleteMany();
    console.log(`✅ ${batchesResult.count} lotes deletados`);
    
    console.log('🗑️ Deletando produtos...');
    const productsResult = await prisma.product.deleteMany();
    console.log(`✅ ${productsResult.count} produtos deletados`);
    
    console.log('🗑️ Deletando usuários...');
    const usersResult = await prisma.user.deleteMany();
    console.log(`✅ ${usersResult.count} usuários deletados`);
    
    console.log('');
    console.log('✨ Banco de dados limpo com sucesso!');
    console.log('📊 Resumo:');
    console.log(`   - ${notificationsResult.count} notificações`);
    console.log(`   - ${movementsResult.count} movimentações`);
    console.log(`   - ${batchesResult.count} lotes`);
    console.log(`   - ${productsResult.count} produtos`);
    console.log(`   - ${usersResult.count} usuários`);
    console.log('');
    console.log('💡 Você pode criar novos usuários e dados agora!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

clearDatabase();

