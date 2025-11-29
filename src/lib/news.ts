type Season = 'early_season' | 'peak_shopping' | 'crunch_time' | 'christmas_eve' | 'christmas_day' | 'post_christmas' | 'off_season';

interface NewsEvent {
  message: string;
  impact: Record<string, number>; // ticker -> % change
}

const NEWS_POOLS: Record<Season, NewsEvent[]> = {
  early_season: [
    { message: "Holiday shopping season kicks off with strong consumer enthusiasm", impact: { GIFT: 3, SANTA: 2 } },
    { message: "Retailers report early signs of robust gift demand", impact: { GIFT: 4, ELF: 2 } },
    { message: "Supply chains ramping up for peak season", impact: { REIN: 2, ELF: 1 } },
    { message: "Consumer confidence survey shows optimistic holiday outlook", impact: { GIFT: 3, SANTA: 2, ELF: 1 } },
    { message: "Early bird shoppers drive unexpected surge in pre-orders", impact: { GIFT: 5 } },
  ],
  peak_shopping: [
    { message: "Black Friday results exceed analyst expectations", impact: { GIFT: 6, SANTA: 3 } },
    { message: "Shipping carriers report operating at full capacity", impact: { REIN: 4, SANTA: 2 } },
    { message: "Popular toy shortages reported in key markets", impact: { GIFT: -3, ELF: 5 } },
    { message: "Record online sales strain fulfillment operations", impact: { SANTA: -2, GIFT: 4 } },
    { message: "Elf workforce expansion announced to meet demand", impact: { ELF: 6 } },
  ],
  crunch_time: [
    { message: "Last-minute shoppers flood stores as Christmas approaches", impact: { GIFT: 8, SANTA: 4 } },
    { message: "Express shipping premiums skyrocket amid delivery rush", impact: { REIN: 7, SANTA: 3 } },
    { message: "Elf overtime reaches record levels as deadline looms", impact: { ELF: 5, SANTA: 2 } },
    { message: "Will Santa deliver on time? Analysts express uncertainty", impact: { SANTA: -4, REIN: -2 } },
    { message: "Emergency coal reserves activated for naughty list surge", impact: { COAL: 10 } },
    { message: "Weather concerns threaten Christmas Eve operations", impact: { REIN: -6, SANTA: -5 } },
  ],
  christmas_eve: [
    { message: "It's Christmas Eve! Final deliveries underway worldwide", impact: { SANTA: 8, REIN: 6 } },
    { message: "Santa's sleigh tracking shows record-breaking efficiency", impact: { SANTA: 10, REIN: 5 } },
    { message: "Last-minute gift rush crashes online retailers", impact: { GIFT: -5, SANTA: 3 } },
    { message: "Reindeer team performing flawlessly under pressure", impact: { REIN: 8 } },
  ],
  christmas_day: [
    { message: "Christmas miracle: All gifts delivered successfully!", impact: { SANTA: 12, REIN: 8, ELF: 6 } },
    { message: "Holiday cheer at all-time high as families celebrate", impact: { GIFT: 5, SANTA: 4 } },
    { message: "Minor delivery delays disappoint some households", impact: { SANTA: -6, REIN: -4 } },
    { message: "Social media flooded with unboxing videos", impact: { GIFT: 4 } },
  ],
  post_christmas: [
    { message: "Returns flood in as holiday hangover begins", impact: { GIFT: -8 } },
    { message: "Coal sales spike as naughty list recipients seek revenge trades", impact: { COAL: 12 } },
    { message: "Year-end portfolio rebalancing drives volatility", impact: { SANTA: -3, ELF: -2, GIFT: -2 } },
    { message: "Analysts downgrade GIFT after disappointing return rates", impact: { GIFT: -6 } },
    { message: "Santa Corp announces vacation policy for exhausted workforce", impact: { ELF: -4, SANTA: -2 } },
  ],
  off_season: [
    { message: "Quiet period begins at North Pole operations", impact: { SANTA: -1, ELF: -2 } },
    { message: "Planning begins for next holiday season", impact: { SANTA: 1, ELF: 1 } },
    { message: "Reindeer herd reports healthy recovery after busy season", impact: { REIN: 2 } },
    { message: "Coal prices stabilize as demand normalizes", impact: { COAL: -2 } },
  ],
};

export function getSeasonalContext(date: Date): Season {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // November is early season (pre-holiday buildup)
  if (month === 11) {
    return 'early_season';
  }

  if (month === 12) {
    if (day <= 10) return 'early_season';
    if (day <= 17) return 'peak_shopping';
    if (day <= 23) return 'crunch_time';
    if (day === 24) return 'christmas_eve';
    if (day === 25) return 'christmas_day';
    return 'post_christmas';
  }
  return 'off_season';
}

export function generateNews(date: Date, random: () => number): NewsEvent | null {
  const season = getSeasonalContext(date);
  const pool = NEWS_POOLS[season];

  // 70% chance of news each tick
  if (random() > 0.7) {
    return null;
  }

  const index = Math.floor(random() * pool.length);
  return pool[index];
}

export function applyNewsToPrice(basePrice: number, impactPercent: number): number {
  return basePrice * (1 + impactPercent / 100);
}
