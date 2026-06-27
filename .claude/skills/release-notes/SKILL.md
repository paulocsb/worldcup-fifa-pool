---
disable-model-invocation: true
name: release-notes
description: |
  Generate release notes in friendly pt-BR for sharing with the friends group
  on WhatsApp/Telegram. Reads commits since the last reference point (last
  tag, or N days back), groups by theme (features / fixes / chore), and
  produces a short text. Use before announcing updates to friends.
---

# /release-notes — Changelog for the friends group

Generates a friendly message (pt-BR, WhatsApp tone) describing what changed in
the app since the last communication. Focus on **user benefit**, not technical
detail.

> The release notes themselves are always in **pt-BR** because the audience
> is the Brazilian friends group, regardless of which language the developer
> is using with you in chat.

## How to run

- Without args: pulls commits from the last **7 days**.
- With arg `<since>`: accepts git format (`HEAD~10`, `2026-06-10`, `v1.2.0`, etc.).

### Step 1: list commits

```bash
git log --since="<arg>" --pretty=format:"%h | %s | %an | %ar" | head -50
```

### Step 2: classify by theme

Categories:
- 🎯 **Novidades** (new features — keywords: "add", "feat", "novo")
- 🐛 **Correções** (bugs — "fix", "corrigir", "ajustar")
- 💅 **Melhorias** (UX/visual — "improve", "melhorar", "polish")
- ⚙️ **Bastidores** (refactor, infra — may be omitted or summarized)

### Step 3: translate to "user language"

Each technical commit becomes a friendly sentence:

```
git: "feat: add /me/predictions screen with tabs by source"
↓
release: "Nova tela 'Meus palpites' (no perfil) com tabs por categoria — partidas, grupos, torneio"

git: "fix: BottomNav iOS scroll detachment"
↓
release: "Corrigido: barra de navegação inferior não 'desgruda' mais ao rolar no iPhone"

git: "feat: phase 2 — see other users' predictions after lock"
↓
release: "Agora dá pra cotilhar os palpites dos outros! Só aparecem depois que o palpite daquele jogo fechar"
```

### Step 4: assemble the message

Format ready for WhatsApp paste:

```
🏆 Bolão FIFA 2026 — Update <DATE>

🎯 *Novidades*
• [feature 1 in user language]
• [feature 2...]

💅 *Melhorias*
• [item 1]
• [item 2]

🐛 *Correções*
• [bug 1]

Próximos passos: [if there's something pending that affects the user]

Bora apostar! ⚽
```

## Principles

- **Tone**: casual, colloquial pt-BR. It's friends on WhatsApp, not a press release.
- **Benefit-focused**: NEVER cite a file, function, or technical term (RLS, hook, edge function). Translate to what the user perceives.
- **Brevity**: max 8–10 bullets total. If there are more, group them.
- **Honesty**: if a bug affected the user (e.g., stuck ranking), acknowledge it without over-apologizing.
- **Call-to-action**: if there's an expected action (clear cache, reopen the app, new invite), highlight it.

## What NOT to include

- Pure chore commits ("update package.json", "regenerate types").
- Refactors invisible to the user.
- Implementation details ("we use the new hook X").
- Technical terms without translation ("RLS now opens after the lock").

## Output

- **Language**: always pt-BR for the release notes themselves (audience: Brazilian friends, even if the developer speaks English to you).
- **Format**: light markdown compatible with WhatsApp (bold with `*`, lists with `•`).
- **End with** a question asking whether to adjust tone/scope before sending to the group.
