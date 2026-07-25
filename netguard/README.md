# NetGuard — vigia da rede local

Agente que corre no teu telemóvel (Termux) e/ou no desktop e vigia a rede do
router TP-Link: deteta dispositivos que não estão na tua lista, avisa se o MAC
do router mudar (ARP spoofing), verifica portas abertas no router, recebe o
syslog do router e escreve **um relatório por dia** em Markdown.

Zero dependências: só Python 3.8+ e a biblioteca padrão.

---

## O que faz e o que não faz

**Faz (deteção e registo):**

| Deteção | Severidade | Para que serve |
| --- | --- | --- |
| `unauthorized_device` | crítico | Alguém entrou na tua Wi-Fi com um equipamento fora da lista |
| `gateway_mac_changed` | crítico | O MAC do router mudou — ARP spoofing / man-in-the-middle |
| `duplicate_mac` | crítico | O mesmo MAC em dois IP — clonagem de MAC |
| `router_port_unexpected` | crítico | Telnet/SSH/UPnP abertos no router |
| `router_unreachable` | crítico | O router deixou de responder |
| `syslog_*` | crítico/aviso | Tentativas de login falhadas e alterações de configuração no router |
| `device_ip_mismatch` | aviso | Um dispositivo teu apareceu num IP que não é o reservado |
| `device_missing` | aviso | Um dispositivo marcado como `required` desapareceu |
| `degraded_scan` | aviso | O equipamento não deixa ler a tabela ARP (ver Android, abaixo) |
| `device_ip_changed` | info | O DHCP deu outro IP a um dispositivo teu |

**Não faz:** não bloqueia ninguém. É um sensor, não uma firewall. O bloqueio
é feito no router (ver "Fechar o TP-Link"). Um script a correr no telemóvel
não tem como cortar o tráfego de outro dispositivo da rede — quem prometer
isso está a vender-te fumo.

**Limite honesto:** o filtro de MAC do router e esta lista de autorizados são
contornáveis por quem clone um MAC teu. Por isso existe a deteção
`duplicate_mac`. A defesa a sério é a palavra-passe Wi-Fi (WPA2/WPA3 longa) e
a palavra-passe de admin do router — o NetGuard diz-te se algo passou, não
substitui essas duas.

---

## Instalação

### No desktop Asus K550C (recomendado — é o posto de vigia principal)

```bash
git clone <este-repo> && cd superpowers/netguard
cp config.example.json config.json
python3 netguard.py learn      # regista os equipamentos que estão agora na rede
```

Corre o `learn` **com a rede limpa**: só com os teus equipamentos ligados. Tudo
o que estiver ligado nesse momento passa a ser considerado autorizado.

Depois abre o `config.json` e arruma a lista: põe os nomes reais
("Xiaomi 14T Pro", "Asus K550C", "Router TP-Link") e **apaga tudo o que não
reconheceres** — se apagares, o próximo scan denuncia-o como intruso.

```bash
python3 netguard.py scan       # varredura + eventos
python3 netguard.py status     # estado atual
python3 netguard.py report --stdout
```

### No telemóvel Xiaomi 14T Pro (Termux)

1. Instala o [Termux](https://f-droid.org/packages/com.termux/) pelo F-Droid
   (a versão da Play Store está desatualizada).
2. No Termux:

```bash
pkg install python git iproute2 termux-api
git clone <este-repo> && cd superpowers/netguard
cp config.example.json config.json
python3 netguard.py scan
```

**Aviso sobre Android:** a partir do Android 10 as aplicações sem root não
conseguem ler a tabela ARP. Nesse caso o NetGuard entra em modo degradado —
identifica os equipamentos só por IP, não por MAC, e diz-te isso no relatório
(`degraded_scan`). Continua a detetar IP novos na rede e problemas no router,
mas a identificação por MAC e a deteção de clonagem só funcionam a sério no
desktop. **Por isso: o desktop é o vigia principal; o telemóvel é o segundo par
de olhos.** Corre `python3 netguard.py scan` no telemóvel e vê se o relatório
menciona `degraded_scan` — se não mencionar, o teu Android deixa ler o ARP e
tens tudo.

---

## Relatórios diários

Cada varredura acrescenta linhas a `events.jsonl`. O relatório do dia é gerado
a partir daí:

```bash
python3 netguard.py report                 # hoje
python3 netguard.py report --day yesterday
python3 netguard.py report --day 2026-07-20
```

Fica em `reports/netguard-AAAA-MM-DD.md`. Os relatórios mais velhos que
`report.keep_days` (90 por omissão) são apagados automaticamente.

### Automatizar no desktop (Linux) — cron

`crontab -e`:

```cron
*/10 * * * * cd ~/superpowers/netguard && /usr/bin/python3 netguard.py scan >> scan.log 2>&1
5 8 * * *    cd ~/superpowers/netguard && /usr/bin/python3 netguard.py report --day yesterday
```

O `scan` devolve código de saída 2 quando há eventos críticos — o cron pode
usar isso para te enviar mail.

### Automatizar no Windows

Agendador de Tarefas → Criar Tarefa Básica → Diariamente/Repetir a cada 10 min
→ Programa: `python.exe`, Argumentos: `netguard.py scan`, Iniciar em: a pasta
`netguard`.

### Automatizar no telemóvel

```bash
pkg install termux-services cronie
sv-enable crond
crontab -e   # as mesmas linhas do cron acima
```

Alternativa sem cron, deixando correr em ciclo:

```bash
python3 netguard.py watch --interval 10
```

O `watch` faz a varredura a cada N minutos e gera o relatório do dia à hora
definida em `report.daily_hour`.

---

## Alertas no telemóvel

Em `config.json`, `alerts.command` é um comando de shell que recebe o texto do
alerta pelo stdin e na variável `NETGUARD_MESSAGE`.

Notificação local no Android (precisa do Termux:API):

```json
"alerts": { "command": "termux-notification --title 'NetGuard' --content \"$NETGUARD_MESSAGE\"", "min_severity": "warning" }
```

Push para o telemóvel a partir do desktop, via [ntfy](https://ntfy.sh):

```json
"alerts": { "command": "curl -s -d @- ntfy.sh/o-teu-topico-secreto", "min_severity": "critical" }
```

Escolhe um tópico ntfy longo e impossível de adivinhar — quem souber o nome do
tópico lê os teus alertas.

---

## Receber o syslog do TP-Link

Se o teu modelo suportar (Avançado → Ferramentas do sistema → Registo do
sistema → Guardar num servidor remoto), aponta-o para o IP do desktop e a
porta 1514. Depois:

```bash
python3 netguard.py syslog
```

Cada tentativa de login falhada no painel do router passa a ficar no relatório.
Os padrões de texto reconhecidos (`login failed`, `unauthorized`, `attack`,
`wps`, …) são genéricos: o texto exato varia com o firmware, por isso confirma
com o teu router à frente que as linhas aparecem como esperado.

A porta 1514 é usada em vez da 514 porque abaixo de 1024 seria preciso root.
Se o router só deixar enviar para a 514, corre com `sudo python3 netguard.py
syslog --port 514`.

---

## Fechar o TP-Link (isto é o que realmente protege)

O agente deteta; estas definições é que impedem. No painel do router
(`http://192.168.0.1` ou `http://tplinkwifi.net`):

1. **Palavra-passe de admin** diferente da do Wi-Fi, longa. A de fábrica
   (`admin`/`admin`) é o primeiro sítio onde qualquer um tenta.
2. **WPA3**, ou WPA2-AES se algum equipamento antigo não suportar WPA3. Nunca
   WEP nem WPA/TKIP.
3. **Desligar o WPS** — o PIN de 8 dígitos é forçável por bruta em horas.
4. **Desligar a administração remota / WAN** (Remote Management).
5. **Desligar o UPnP** se não precisares (consolas e algum P2P precisam).
6. **Desligar o TR-069 / CWMP** se não for exigido pelo teu operador (porta
   7547 — está na lista de portas vigiadas por isso mesmo).
7. **Reserva de IP (DHCP reservation)** para o Xiaomi e para o Asus. Depois põe
   esses IP em `expected_ip` no `config.json` e passas a saber quando algo
   aparece fora do sítio.
8. **Controlo de acesso / filtro de MAC** em lista branca com só os teus
   equipamentos. Trava o oportunista; não trava quem clone um MAC — mas nessa
   altura o NetGuard dispara `duplicate_mac`.
9. **Actualizar o firmware** e voltar a ver estas definições depois, porque
   algumas actualizações repõem valores de fábrica.
10. **Rede de convidados** separada para visitas, para não teres de dar a
    palavra-passe principal a ninguém.

Se alguma vez apanhares um `unauthorized_device`: muda já a palavra-passe do
Wi-Fi e a de admin do router (só mudar a do Wi-Fi não chega se já entraram no
painel), e só depois vais ver a lista de clientes ligados.

---

## Configuração

| Chave | O que faz |
| --- | --- |
| `network.cidr` | `auto`, ou a rede fixa (`192.168.0.0/24`). Máximo /22 |
| `network.gateway` | `auto`, ou o IP do router |
| `authorized[]` | `name`, `mac`, `expected_ip` (opcional), `required` (avisa se faltar) |
| `router.allowed_ports` | Portas que podem estar abertas no router. Tudo o resto é crítico |
| `router.watch_ports` | Portas testadas no router a cada varredura |
| `scan.timeout_ms` | Tempo de espera por host. Sobe para 1500 se a Wi-Fi for lenta |
| `scan.workers` | Varreduras em paralelo. Baixa para 16 no telemóvel se aquecer |
| `alerts.command` / `alerts.min_severity` | Comando de alerta e patamar (`info`/`warning`/`critical`) |
| `report.keep_days` / `report.daily_hour` | Retenção e hora do relatório no modo `watch` |

Ficheiros gerados na pasta: `state.json` (o que já é conhecido),
`events.jsonl` (histórico completo), `reports/` (relatórios diários).

---

## Testes

```bash
python3 tests/test_netguard.py
```

26 testes cobrem os parsers de ARP/syslog e toda a lógica de deteção com
capturas de rede sintéticas. A varredura em si (ping, ARP, portas TCP) depende
do sistema operativo e só pode ser validada na tua rede — a primeira coisa a
fazer depois de instalar é correr `scan` e confirmar que a contagem de hosts
bate certo com o que tens ligado.
