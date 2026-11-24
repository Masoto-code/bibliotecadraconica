import os
import sys
import html
import sqlite3

conn = sqlite3.connect('backend/biblioteca_draconica.db')
c = conn.cursor()
c.execute('SELECT id, titulo, sistema, tipo_jogo, categoria, capa_url FROM livros ORDER BY id')
books = c.fetchall()

THEMES = {
    'JJRPG': {
        'bg1': '#1e1035', 'bg2': '#3b1d60', 'accent': '#e0b0ff', 'border': '#a855f7',
        'badge_bg': '#581c87', 'symbol': '&#9876;', 'sub': 'JRPG / ANIME'
    },
    'Fantasia Medieval': {
        'bg1': '#1c1917', 'bg2': '#292524', 'accent': '#facc15', 'border': '#d97706',
        'badge_bg': '#78350f', 'symbol': '&#9819;', 'sub': 'FANTASIA MEDIEVAL'
    },
    'Horror Cósmico': {
        'bg1': '#062016', 'bg2': '#0f382a', 'accent': '#4ade80', 'border': '#10b981',
        'badge_bg': '#064e3b', 'symbol': '&#9737;', 'sub': 'HORROR &amp; INVESTIGAÇÃO'
    },
    'Cyberpunk': {
        'bg1': '#0a192f', 'bg2': '#172a45', 'accent': '#38bdf8', 'border': '#0284c7',
        'badge_bg': '#0c4a6e', 'symbol': '&#9881;', 'sub': 'CYBERPUNK / SCI-FI'
    }
}

os.makedirs('frontend/imagens/capas', exist_ok=True)

def wrap_text(text, max_chars=20):
    words = text.split()
    lines = []
    cur = ''
    for w in words:
        if len(cur + ' ' + w) <= max_chars:
            cur = (cur + ' ' + w).strip()
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines[:3]

updated = 0
for b in books:
    bid, btitle, bsys, btipo, bcat, bcapa = b
    svg_filename = f'frontend/imagens/capas/livro_{bid}.svg'
    rel_path = f'../imagens/capas/livro_{bid}.svg'
    
    tinfo = THEMES.get(btipo, THEMES['Fantasia Medieval'])
    clean_title = btitle.replace(' - ', ' ').replace(':', '')
    title_lines = wrap_text(clean_title, 20)
    
    y_start = 220
    text_elements = []
    for i, line in enumerate(title_lines):
        y = y_start + (i * 26)
        text_elements.append(
            f'<text x="175" y="{y}" font-family="Georgia, serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">{html.escape(line)}</text>'
        )
    title_svg = '\n      '.join(text_elements)
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 500" width="350" height="500">
  <defs>
    <linearGradient id="bg_{bid}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="{tinfo['bg1']}"/>
      <stop offset="50%" stop-color="{tinfo['bg2']}"/>
      <stop offset="100%" stop-color="#0a0a0c"/>
    </linearGradient>
    <linearGradient id="gold_{bid}" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="{tinfo['accent']}"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
  </defs>

  <rect width="350" height="500" fill="url(#bg_{bid})" rx="10"/>
  <rect x="10" y="10" width="330" height="480" rx="8" fill="none" stroke="{tinfo['border']}" stroke-width="2" stroke-opacity="0.7"/>
  <rect x="16" y="16" width="318" height="468" rx="6" fill="none" stroke="{tinfo['accent']}" stroke-width="1" stroke-opacity="0.4" stroke-dasharray="6 4"/>

  <circle cx="24" cy="24" r="4" fill="{tinfo['accent']}"/>
  <circle cx="326" cy="24" r="4" fill="{tinfo['accent']}"/>
  <circle cx="24" cy="476" r="4" fill="{tinfo['accent']}"/>
  <circle cx="326" cy="476" r="4" fill="{tinfo['accent']}"/>

  <rect x="45" y="36" width="260" height="24" rx="12" fill="{tinfo['badge_bg']}" stroke="{tinfo['border']}" stroke-width="1"/>
  <text x="175" y="52" font-family="'Segoe UI', sans-serif" font-size="11" font-weight="bold" fill="{tinfo['accent']}" text-anchor="middle" letter-spacing="2">{tinfo['sub']}</text>

  <text x="175" y="95" font-family="'Segoe UI', sans-serif" font-size="14" font-weight="600" fill="#cbd5e1" text-anchor="middle" letter-spacing="1.5">{html.escape(bsys.upper())}</text>

  <circle cx="175" cy="150" r="38" fill="#000000" fill-opacity="0.4" stroke="{tinfo['accent']}" stroke-width="2"/>
  <text x="175" y="162" font-family="serif" font-size="36" fill="url(#gold_{bid})" text-anchor="middle">{tinfo['symbol']}</text>

  <line x1="60" y1="198" x2="290" y2="198" stroke="{tinfo['accent']}" stroke-width="1.5" stroke-opacity="0.8"/>
  <polygon points="175,194 179,198 175,202 171,198" fill="{tinfo['accent']}"/>

  <g>
      {title_svg}
  </g>

  <rect x="85" y="350" width="180" height="26" rx="6" fill="#000000" fill-opacity="0.6" stroke="{tinfo['border']}" stroke-width="1"/>
  <text x="175" y="367" font-family="'Segoe UI', sans-serif" font-size="12" font-weight="600" fill="#e2e8f0" text-anchor="middle">{html.escape(bcat)}</text>

  <line x1="70" y1="430" x2="280" y2="430" stroke="{tinfo['border']}" stroke-width="1" stroke-opacity="0.5"/>
  <text x="175" y="452" font-family="Georgia, serif" font-size="12" fill="{tinfo['accent']}" text-anchor="middle" letter-spacing="1">BIBLIOTECA DRACÔNICA</text>
  <text x="175" y="468" font-family="sans-serif" font-size="9" fill="#94a3b8" text-anchor="middle">TOMO OFICIAL • ACERVO DE RPG</text>
</svg>'''
    
    with open(svg_filename, 'w', encoding='utf-8') as f:
        f.write(svg)
    
    # Check if current capa exists
    capa_clean = bcapa.replace('../', '').replace('/', os.sep)
    if not os.path.exists(os.path.join('frontend', capa_clean)):
        c.execute('UPDATE livros SET capa_url = ? WHERE id = ?', (rel_path, bid))
        updated += 1

conn.commit()
print(f'[OK] Total de livros: {len(books)}. Capas atualizadas no DB: {updated}')
