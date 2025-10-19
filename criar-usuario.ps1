# 🚀 Script para criar usuário administrador no Flexi Gestor
Write-Host "🔐 Criando usuário administrador..." -ForegroundColor Cyan

# Aguardar servidor iniciar
Start-Sleep -Seconds 3

# Criar usuário via API
$body = @{
    username = "admin"
    email = "admin@flexi.com"
    password = "admin123"
    name = "Administrador"
    role = "admin"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ Usuário criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 Email: admin@flexi.com" -ForegroundColor Yellow
    Write-Host "🔑 Senha: admin123" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🌐 Acesse: http://localhost:8080" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Erro ao criar usuário:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Possíveis causas:" -ForegroundColor Yellow
    Write-Host "   - Servidor ainda não iniciou (aguarde 10 segundos e tente novamente)" -ForegroundColor Gray
    Write-Host "   - Usuário já existe (tente fazer login)" -ForegroundColor Gray
    Write-Host "   - Porta 3001 ocupada (verifique se o servidor está rodando)" -ForegroundColor Gray
}

