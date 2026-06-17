/**
 * Mapeia nomes em inglês (da API-Football) e variantes para o nome em PT
 * usado no seed local (002_seed_teams.sql).
 *
 * Sempre que a API retornar um nome que não case com a chave exata,
 * adicione aqui (chave em lowercase).
 */

export const TEAM_NAME_ALIASES_PT: Record<string, string> = {
  // Grupo A
  'mexico': 'México',
  'south korea': 'Coreia do Sul',
  'korea republic': 'Coreia do Sul',
  'south africa': 'África do Sul',
  'czech republic': 'Tchéquia',
  'czechia': 'Tchéquia',

  // Grupo B
  'canada': 'Canadá',
  'switzerland': 'Suíça',
  'qatar': 'Catar',
  'bosnia and herzegovina': 'Bósnia e Herzegovina',
  'bosnia & herzegovina': 'Bósnia e Herzegovina',

  // Grupo C
  'brazil': 'Brasil',
  'morocco': 'Marrocos',
  'scotland': 'Escócia',
  'haiti': 'Haiti',

  // Grupo D
  'usa': 'Estados Unidos',
  'united states': 'Estados Unidos',
  'paraguay': 'Paraguai',
  'turkey': 'Turquia',
  'türkiye': 'Turquia',
  'australia': 'Austrália',

  // Grupo E
  'germany': 'Alemanha',
  'ecuador': 'Equador',
  'ivory coast': 'Costa do Marfim',
  "cote d'ivoire": 'Costa do Marfim',
  'curacao': 'Curaçao',
  'curaçao': 'Curaçao',

  // Grupo F
  'netherlands': 'Holanda',
  'japan': 'Japão',
  'sweden': 'Suécia',
  'tunisia': 'Tunísia',

  // Grupo G
  'belgium': 'Bélgica',
  'egypt': 'Egito',
  'iran': 'Irã',
  'new zealand': 'Nova Zelândia',

  // Grupo H
  'spain': 'Espanha',
  'uruguay': 'Uruguai',
  'saudi arabia': 'Arábia Saudita',
  'cape verde': 'Cabo Verde',
  'cape verde islands': 'Cabo Verde',
  'cabo verde': 'Cabo Verde',

  // Grupo I
  'france': 'França',
  'senegal': 'Senegal',
  'norway': 'Noruega',
  'iraq': 'Iraque',

  // Grupo J
  'argentina': 'Argentina',
  'austria': 'Áustria',
  'algeria': 'Argélia',
  'jordan': 'Jordânia',

  // Grupo K
  'portugal': 'Portugal',
  'colombia': 'Colômbia',
  'uzbekistan': 'Uzbequistão',
  'dr congo': 'RD Congo',
  'congo dr': 'RD Congo',
  'democratic republic of congo': 'RD Congo',

  // Grupo L
  'england': 'Inglaterra',
  'croatia': 'Croácia',
  'ghana': 'Gana',
  'panama': 'Panamá',
}

export function resolvePtName(apiName: string): string | null {
  const key = apiName.trim().toLowerCase()
  return TEAM_NAME_ALIASES_PT[key] ?? null
}
