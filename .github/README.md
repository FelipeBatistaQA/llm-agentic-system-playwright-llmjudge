# GitHub Actions Workflows

## Test and Generate Reports

Este workflow executa os testes do Playwright e gera relatórios CSV e HTML automaticamente.

### Como usar

1. **Execução Manual (Workflow Dispatch)**
   - Vá para a aba "Actions" no GitHub
   - Selecione "Test and Generate Reports"
   - Clique em "Run workflow"
   - Escolha o tipo de teste (opcional):
     - `all` - Executa todos os testes (padrão)
     - `conversation-api` - Apenas testes da API de conversação
     - `history-enthusiast` - Apenas testes do agente especialista em história
     - `llm-judge` - Apenas testes do LLM Judge
     - `semantic-similarity` - Apenas testes de similaridade semântica

### Artefatos Gerados

O workflow gera os seguintes artefatos que podem ser baixados:

1. **csv-report** - Arquivo CSV com resultados dos julgamentos
2. **html-report** - Relatório HTML visual
3. **playwright-report** - Relatório padrão do Playwright
4. **all-generated-reports** - Todos os relatórios gerados
5. **system-logs** - Logs do sistema
6. **test-results** - Resultados brutos dos testes

### Configuração Necessária

Para que o workflow funcione corretamente, você precisa configurar:

1. **Secret `OPENAI_API_KEY`**
   - Vá em Settings → Secrets and variables → Actions
   - Adicione um novo secret chamado `OPENAI_API_KEY`
   - Cole sua chave da API da OpenAI

### Estrutura do Workflow

O workflow executa os seguintes passos:

1. ✅ Checkout do código
2. ✅ Setup do Node.js 18
3. ✅ Instalação das dependências
4. ✅ Instalação dos browsers do Playwright
5. ✅ Criação do diretório de logs
6. ✅ Execução dos testes
7. ✅ Geração dos relatórios
8. ✅ Upload dos artefatos

### Retenção de Artefatos

Todos os artefatos são mantidos por **30 dias** após a execução do workflow.
