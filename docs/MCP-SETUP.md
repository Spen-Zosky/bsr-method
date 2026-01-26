# BSR Method - MCP Server Setup

## Claude Desktop Integration

Il BSR Method include un server MCP (Model Context Protocol) per l'integrazione diretta con Claude Desktop.

## Installazione

### 1. Build del progetto

```bash
cd bsr-method
pnpm install
pnpm build
```

### 2. Configurazione Claude Desktop

Aggiungi al file `claude_desktop_config.json`:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bsr-method": {
      "command": "node",
      "args": ["C:/path/to/bsr-method/dist/mcp/server.js"],
      "env": {
        "BSR_PROJECT_PATH": "C:/path/to/your/project"
      }
    }
  }
}
```

### 3. Riavvia Claude Desktop

## Tools Disponibili

| Tool | Descrizione |
|------|-------------|
| `bsr_status` | Stato del progetto BSR |
| `bsr_list_tasks` | Lista task con filtri |
| `bsr_get_task` | Dettagli singolo task |
| `bsr_update_task` | Aggiorna stato task |
| `bsr_get_spec` | Leggi specifiche feature |
| `bsr_get_idea` | Leggi idea progetto |
| `bsr_run_command` | Esegui comando BSR |
| `bsr_save_implementation` | Salva codice implementato |

## Resources Disponibili

| URI | Descrizione |
|-----|-------------|
| `bsr://config` | Configurazione progetto |
| `bsr://tasks` | Lista task JSON |
| `bsr://idea` | Documento idea |
| `bsr://loop-state` | Stato Ralph Loop |
| `bsr://progress` | Progress tracking |

## Esempio di Utilizzo

In Claude Desktop:

```
Mostrami lo stato del progetto BSR
```

Claude chiamerà `bsr_status` e mostrerà:
- Nome progetto
- Task totali/completati/bloccati
- Stato del Ralph Loop

```
Lista i task ad alta priorità ancora da fare
```

Claude chiamerà `bsr_list_tasks` con filtri:
```json
{
  "status": "todo",
  "priority": "high"
}
```

```
Implementa il task TASK-005
```

Claude può:
1. Chiamare `bsr_get_task` per i dettagli
2. Generare il codice
3. Chiamare `bsr_save_implementation` per salvarlo
4. Chiamare `bsr_update_task` per marcarlo come completato

## Environment Variables

| Variabile | Descrizione | Default |
|-----------|-------------|---------|
| `BSR_PROJECT_PATH` | Path del progetto BSR | Current directory |
| `ANTHROPIC_API_KEY` | API key Claude (per LLM integration) | - |
| `OPENAI_API_KEY` | API key OpenAI (alternativa) | - |

## Troubleshooting

### Server non si avvia

1. Verifica che Node.js >= 18 sia installato
2. Verifica il path nel config
3. Controlla i log di Claude Desktop

### Comandi non funzionano

1. Verifica `BSR_PROJECT_PATH` punti a un progetto BSR inizializzato
2. Verifica che `.bsr/config.yaml` esista
3. Riavvia Claude Desktop

### Permission errors

Su Windows, assicurati che il path non contenga spazi o usa il formato 8.3:
```json
"args": ["C:/Users/USERNA~1/Projects/bsr-method/dist/mcp/server.js"]
```

## Sviluppo

Per testare il server MCP localmente:

```bash
# Build
pnpm build

# Test manuale (richiede input JSON su stdin)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/mcp/server.js
```

Per debug:
```bash
BSR_PROJECT_PATH=/path/to/project node dist/mcp/server.js 2>&1 | tee mcp.log
```
