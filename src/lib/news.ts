type Season = 'early_season' | 'peak_shopping' | 'crunch_time' | 'christmas_eve' | 'christmas_day' | 'post_christmas' | 'off_season';

type NewsType = 'breaking' | 'analysis' | 'earnings' | 'rumor' | 'interview' | 'investigation' | 'black_swan';

interface NewsEvent {
  type: NewsType;
  headline: string;
  message: string;
  impact: Record<string, number>; // ticker -> % change
}

// Black swan events - rare but catastrophic/euphoric market-wide events
const BLACK_SWAN_EVENTS: NewsEvent[] = [
  {
    type: 'black_swan',
    headline: '🦠 PANDEMIC ALERT: Reindeer Flu Outbreak at North Pole',
    message: `CATASTROPHIC DEVELOPMENT: A highly contagious strain of reindeer flu has swept through Santa's stables.

Initial reports indicate 60% of the reindeer fleet is showing symptoms. Rudolph has been quarantined. Backup teams are being evaluated but the situation is dire.

"This is unprecedented," said North Pole Health Director Dr. Snowflake Winters. "We're implementing emergency protocols but... I won't sugarcoat it. This is bad."

REIN shares have halted trading twice already due to volatility. Circuit breakers triggered.

Santa Corp has issued a force majeure warning. The workshop is continuing production but delivery logistics are in chaos.

Markets are in freefall. This could be the worst crisis in North Pole history.

[EMERGENCY: All positions at risk. Hedge accordingly.]`,
    impact: { REIN: -25, SANTA: -18, ELF: -8, GIFT: -12, COAL: 15 }
  },
  {
    type: 'black_swan',
    headline: '💥 DISASTER: Explosion Rocks Main Workshop Complex',
    message: `BREAKING: A massive explosion has destroyed Workshop 7, the largest toy production facility at the North Pole.

Emergency services are on scene. Early reports suggest the blast originated in the experimental toy division. Casualty reports are unclear but evacuation is underway.

"The building is... gone," said a visibly shaken witness. "Decades of work. The specialized equipment. The prototype toys for next year..."

ELF Industries stock has collapsed. Trading volume is 50x normal as panic selling overwhelms the market.

Santa has declared a state of emergency. Production has halted across ALL workshops pending safety review.

The timing couldn't be worse. Peak season is approaching and capacity has been cut by an estimated 40%.

[CRISIS: Supply chain catastrophically compromised. Recovery timeline unknown.]`,
    impact: { ELF: -30, SANTA: -15, GIFT: -10, REIN: -5, COAL: 8 }
  },
  {
    type: 'black_swan',
    headline: '🎄 MIRACLE: Definitive Proof of Santa Goes Viral',
    message: `THE WORLD HAS CHANGED: Undeniable video evidence of Santa Claus has gone viral, with 2 billion views in 3 hours.

The footage, captured by a child's bedroom camera, shows Santa emerging from a chimney, placing gifts, eating cookies, and - crucially - his sleigh and reindeer departing into the sky.

Experts have verified the video is not AI-generated or manipulated. Multiple independent analyses confirm authenticity.

"This is the most significant event in modern history," declared one cultural commentator. "Everything we thought we knew..."

Global markets are surging on the news. The "belief premium" is now quantifiable. Consumer confidence has spiked to all-time highs.

North Pole stocks are experiencing their biggest single-day gains EVER. Circuit breakers triggered on the upside.

The world believes. And belief is the most powerful force in the market.

[EUPHORIA: Historic rally. All North Pole assets repricing higher.]`,
    impact: { SANTA: 25, REIN: 20, ELF: 18, GIFT: 22, COAL: -10 }
  },
  {
    type: 'black_swan',
    headline: '📋 SCANDAL: Naughty List Database Leaked to Dark Web',
    message: `BOMBSHELL: The complete Naughty/Nice database has been leaked online, exposing every child's behavioral record.

The breach includes detailed reports, incident logs, and - most damaging - the algorithm Santa uses to make his list. Privacy advocates are calling it "the worst data breach in magical history."

Parents are furious. Class action lawsuits are being filed. Regulators are demanding answers.

"This is a fundamental violation of trust," said privacy expert Cipher Snowden. "Santa's entire operation depends on confidentiality."

Santa Corp shares are in freefall on existential concerns. If children stop believing their behavior is being watched, the entire model breaks down.

Meanwhile, COAL is surging as the leak confirmed the naughty list is 40% larger than previously disclosed.

Mrs. Claus has scheduled an emergency press conference. The future of Christmas is in question.

[EXISTENTIAL RISK: Trust collapse could be unrecoverable.]`,
    impact: { SANTA: -22, REIN: -10, ELF: -8, GIFT: -15, COAL: 35 }
  },
  {
    type: 'black_swan',
    headline: '🤖 DISRUPTION: Amazon Announces "Prime Sleigh" Drone Fleet',
    message: `COMPETITIVE NIGHTMARE: Amazon has unveiled "Prime Sleigh" - an autonomous drone delivery network capable of Christmas Eve global coverage.

The system uses 50 million AI-powered drones, satellite coordination, and - most shockingly - technology that appears to manipulate time dilation for simultaneous worldwide delivery.

"We've solved Christmas logistics," announced Jeff Bezos's hologram. "No reindeer required. No coal. Just packages, delivered perfectly, for Prime members."

North Pole stocks are in crisis. The monopoly that has protected Santa Corp for centuries is under existential threat.

Analysts are scrambling to model the competitive impact. Some see coexistence. Others predict a brutal market share war.

"This is the disruption we always feared," admitted one Santa Corp board member. "We got complacent."

The holiday season will never be the same.

[DISRUPTION: Competitive moat breached. Strategic response required.]`,
    impact: { SANTA: -20, REIN: -18, ELF: -12, GIFT: -8, COAL: 5 }
  },
  {
    type: 'black_swan',
    headline: '✨ PHENOMENON: Global Belief Surge Breaks Records',
    message: `UNPRECEDENTED: A spontaneous global movement has triggered the largest surge in Christmas belief ever recorded.

It started with a viral TikTok from a child in Norway, spread through a celebrity endorsement cascade, and culminated in a simultaneous worldwide "Believe" event with 500 million participants.

The North Pole Belief Index hit 99.7% - a number previously thought impossible in the modern era.

"We're seeing magic levels we haven't recorded since the 1800s," said Chief Magic Officer Sparkle Aurora. "The implications for operations are... extraordinary."

All North Pole assets are surging. The belief premium is translating directly into operational efficiency and consumer demand.

Santa Corp has upgraded guidance. ELF is announcing capacity expansion. REIN is reporting unprecedented reindeer performance metrics.

This is what a paradigm shift looks like.

[EUPHORIA: Belief is the ultimate currency. Market repricing accordingly.]`,
    impact: { SANTA: 22, REIN: 18, ELF: 20, GIFT: 25, COAL: -15 }
  },
  {
    type: 'black_swan',
    headline: '❄️ CATASTROPHE: Polar Vortex Collapse Threatens North Pole',
    message: `CLIMATE EMERGENCY: The polar vortex has collapsed in an unprecedented weather event, bringing extreme conditions to the North Pole.

Temperatures have swung 40 degrees in 12 hours. Blizzard conditions have grounded all air operations. The main workshop complex is snowed in.

"We've never seen anything like this," said meteorologist Flurry Stormwatch. "The weather models broke. Literally broke."

All North Pole operations are suspended. Reindeer cannot fly. Elves cannot commute to work. Even the magical heating systems are struggling.

Supply chains are frozen - literally. Deliveries to and from the North Pole have halted indefinitely.

Santa has invoked emergency powers but options are limited. You can't negotiate with weather.

The timing, weeks before Christmas, could not be worse. Recovery timeline: unknown.

[FORCE MAJEURE: Operations paralyzed. All forecasts suspended.]`,
    impact: { SANTA: -18, REIN: -22, ELF: -15, GIFT: -12, COAL: 10 }
  },
  {
    type: 'black_swan',
    headline: '🎁 WINDFALL: Anonymous Donor Gifts $100B to North Pole',
    message: `STUNNING: An anonymous donor has transferred $100 billion to the North Pole Foundation, the largest charitable gift in history.

The donation comes with a single condition: "Make Christmas better for everyone."

Santa Corp has announced the funds will be used for:
- Massive workshop expansion
- Reindeer wellness and breeding programs
- Gift quality improvements across all categories
- Elf wage increases and benefits
- Technology modernization

"This changes everything," said Santa, visibly emotional. "Someone out there really believes in what we do."

Markets are euphoric. The capital injection removes all financial constraints for the foreseeable future.

Speculation about the donor's identity is rampant. Leading theories: Elon Musk, Warren Buffett's estate, or a sovereign wealth fund.

[TRANSFORMATIONAL: Balance sheet transformed. Growth unlimited.]`,
    impact: { SANTA: 20, REIN: 15, ELF: 22, GIFT: 18, COAL: -5 }
  },
];

const NEWS_POOLS: Record<Season, NewsEvent[]> = {
  early_season: [
    {
      type: 'breaking',
      headline: 'BREAKING: Holiday Shopping Season Officially Begins',
      message: `The North Pole Commerce Department has officially declared the start of the holiday shopping season. Early indicators suggest consumer enthusiasm is running 15% above last year's levels.

"We're seeing unprecedented early engagement," said Chief Elf Economist Jingles McSparkle. "Parents are shopping earlier to avoid last year's supply chain nightmares."

SANTA Corp shares jumped in pre-market trading on the news. Analysts at Frosty Capital have upgraded their holiday forecast, citing strong consumer confidence data.

[Hidden signal: Watch ELF - workshop overtime authorizations were filed yesterday]`,
      impact: { GIFT: 4, SANTA: 3, ELF: 2 }
    },
    {
      type: 'earnings',
      headline: 'Q4 PREVIEW: ELF Workshop Industries Expected to Beat',
      message: `ELF Workshop Industries is scheduled to report Q4 earnings next week, and Wall Street is bullish.

Consensus estimates:
- Revenue: $4.2B (up 12% YoY)
- EPS: $2.15 (vs $1.89 last year)
- Toy production capacity: +18%

"The workshop expansion in Sector 7G is already paying dividends," noted analyst Candy Cane at Polar Bear Sachs. "We're raising our price target to $95."

However, some bears point to rising gingerbread costs and elf overtime expenses as potential headwinds. The elf union's new contract negotiations could be a wildcard.

[Competitor note: SANTA's logistics costs are tied to ELF production volume]`,
      impact: { ELF: 5, SANTA: 1 }
    },
    {
      type: 'rumor',
      headline: 'RUMOR MILL: Santa Corp Eyeing Acquisition?',
      message: `Whispers are circulating through North Pole financial circles that Santa Claus Enterprises may be preparing a major acquisition bid.

Sources close to the matter (who requested anonymity because they're technically reindeer) suggest SANTA is in preliminary talks with either Reindeer Logistics Corp or a smaller gift-wrapping startup.

"Santa's been building a war chest," one insider told the Arctic Financial Times. "The balance sheet is pristine. Something big is coming."

REIN shares have been unusually active in recent sessions. Neither company has commented on the speculation.

[Analyst take: If REIN acquisition happens, expect 20%+ premium. But could also be nothing.]`,
      impact: { SANTA: 2, REIN: 4 }
    },
    {
      type: 'analysis',
      headline: 'DEEP DIVE: Why Smart Money Is Watching COAL',
      message: `Coal Holdings Ltd (COAL) has been the forgotten ticker of the North Pole exchange - until now.

Our investigative team has discovered that institutional ownership of COAL has quietly increased 40% over the past month. The buyers? Mostly hedge funds with contrarian track records.

"Everyone loves the feel-good stocks," explains fund manager Ebenezer Frost. "But COAL has real fundamentals. The naughty list isn't shrinking, folks."

Key metrics:
- P/E ratio: 8.2 (vs sector average 22)
- Dividend yield: 4.8%
- Short interest: Down 15% from peak

The contrarian case: If gift-giving disappoints, COAL could be this season's surprise winner.

[Risk warning: High volatility expected. Not for the faint of heart.]`,
      impact: { COAL: 6, GIFT: -2 }
    },
    {
      type: 'interview',
      headline: 'EXCLUSIVE: Mrs. Claus on This Year\'s Strategy',
      message: `In a rare interview with Arctic Business Weekly, Mrs. Claus shared insights into Santa Corp's holiday preparation.

"The team has been working around the clock," she revealed. "We've invested heavily in sleigh technology and reindeer wellness programs. The results speak for themselves."

When asked about competitor pressure from Amazon drones and other delivery services:

"Look, we've been doing this for centuries. Our brand loyalty is unmatched. Children don't leave cookies out for Jeff Bezos."

On elf labor relations: "We're in productive discussions. I'm confident we'll reach a fair agreement."

The interview sent SANTA shares higher in extended trading.

[Reading between the lines: "Productive discussions" often means negotiations are stuck]`,
      impact: { SANTA: 3, ELF: -1, REIN: 2 }
    },
  ],

  peak_shopping: [
    {
      type: 'breaking',
      headline: 'BLACK FRIDAY BONANZA: Records Shattered Across The Board',
      message: `Black Friday has exceeded all expectations, with preliminary data showing a 23% increase in gift purchases compared to last year.

GIFT index components surged as retailers reported overwhelming demand. Several popular toys sold out within hours of store openings.

"This is exactly what we needed to see," said North Pole Fed Chairman Snowden Bernanke. "Consumer spending is the backbone of our holiday economy."

Top sellers:
1. Interactive Elf Companions (+340% vs last year)
2. Reindeer Flight Simulators (+180%)
3. Santa Tracking Devices (+95%)

REIN logistics is operating at 98% capacity to handle the surge.

[Warning: Supply chain stress emerging. Watch for bottleneck news.]`,
      impact: { GIFT: 7, SANTA: 4, REIN: 5, ELF: 3 }
    },
    {
      type: 'investigation',
      headline: 'INVESTIGATION: Are Elves Being Overworked?',
      message: `An explosive investigative report by the Arctic Labor Tribune has raised serious questions about working conditions at ELF Workshop Industries.

Anonymous sources describe 16-hour shifts, mandatory overtime, and "dangerously low" hot cocoa rations. The Elf Workers Union has filed a formal complaint.

"We love making toys," said union representative Sparkle Tinseltoes. "But we're not machines. Even elves need rest."

ELF Industries released a statement: "We categorically deny any labor violations. Our elves are our family."

However, internal documents obtained by reporters show overtime costs have tripled this quarter. If production slows due to labor action, the entire supply chain could be affected.

[Market impact: ELF could face a 5-10% correction if strike materializes. SANTA dependent on ELF output.]`,
      impact: { ELF: -5, SANTA: -2 }
    },
    {
      type: 'earnings',
      headline: 'REIN Q4 Earnings: Delivery Metrics Through The Roof',
      message: `Reindeer Logistics Corp crushed expectations in its Q4 preliminary report.

KEY NUMBERS:
- Packages delivered: 2.4B (est. 2.1B)
- On-time delivery rate: 99.7%
- Fuel efficiency: +12% (new organic carrot blend)
- Revenue: $8.9B (est. $8.2B)

CEO Blitzen McFly: "Our reindeer have never been in better shape. The wellness program is paying off. Dasher just set a personal speed record."

The stock is up 8% after hours. Analysts are scrambling to raise price targets.

However, one concern: Rudolph has been listed as "day-to-day" with a minor nose-light flicker. He's expected to be ready for Christmas Eve.

[Hidden signal: Weather forecasts showing potential fog issues in Northeast sector]`,
      impact: { REIN: 8, SANTA: 2 }
    },
    {
      type: 'rumor',
      headline: 'DRAMA: Board Tensions at Santa Corp?',
      message: `Sources report growing tensions in the Santa Corp boardroom over strategic direction.

The divide apparently centers on whether to pursue aggressive expansion or maintain the traditional "quality over quantity" approach that has defined the company for centuries.

"There are two camps," an insider revealed. "The old guard wants to keep things classic. The younger executives want to modernize - new markets, new products, maybe even year-round operations."

Santa himself has remained above the fray, but the board meeting scheduled for next week could be contentious.

Some analysts see this as healthy debate. Others worry about distraction during the critical holiday push.

[Watch for: Leadership announcements, strategic pivots, or executive departures]`,
      impact: { SANTA: -3 }
    },
    {
      type: 'analysis',
      headline: 'CONTRARIAN CORNER: The Case Against GIFT',
      message: `Everyone is bullish on GIFT. That's exactly why you should be worried.

Our quantitative analysis shows GIFT is now trading at 2.3 standard deviations above its historical average. The last time we saw these levels? Right before the 2019 correction.

Red flags:
- Insider selling has ticked up 40%
- Short interest is at multi-year lows (no one left to squeeze)
- The "everything is perfect" narrative rarely ages well

"When taxi drivers start recommending GIFT, it's time to sell," quipped veteran trader Frosty McBear.

Counterpoint: Holiday momentum is real, and timing the top is notoriously difficult.

[Not financial advice: But consider trimming winners and rebalancing]`,
      impact: { GIFT: -4, COAL: 3 }
    },
  ],

  crunch_time: [
    {
      type: 'breaking',
      headline: 'CRISIS ALERT: Major Shipping Delays Reported',
      message: `A perfect storm of challenges is threatening holiday deliveries.

Multiple sources confirm:
- Blizzard conditions have grounded 30% of reindeer fleet in Northern sectors
- A conveyor belt malfunction at Workshop 7 has slowed toy production
- Gift wrap supplies running dangerously low

"This is our worst nightmare scenario," admitted a REIN logistics coordinator who spoke on condition of anonymity. "We're doing everything we can."

SANTA has activated emergency protocols. All hands on deck. Mrs. Claus was spotted personally supervising loading operations.

Consumer anxiety is spiking. Social media is flooded with #WillChristmasBeOkay posts.

[Critical period: Next 48 hours will determine if recovery is possible]`,
      impact: { SANTA: -6, REIN: -8, ELF: -4, GIFT: -3 }
    },
    {
      type: 'breaking',
      headline: 'SAVE THE DAY: Reindeer Team B Steps Up',
      message: `In an inspiring turn of events, the reserve reindeer team has been cleared for active duty and is exceeding all performance benchmarks.

Led by veteran backup Prancer Jr., Team B has already completed 40% of the backlogged deliveries. Industry observers are calling it "The Miracle Shift."

"These deer have been training for this moment their entire careers," said REIN CEO Blitzen McFly, visibly emotional. "I couldn't be prouder."

REIN shares have reversed earlier losses on the news. The fog is also beginning to clear in affected regions.

Rudolph remains sidelined but has been providing motivational support from the stable.

[Market sentiment shifting: Crisis may have been overblown]`,
      impact: { REIN: 7, SANTA: 4 }
    },
    {
      type: 'analysis',
      headline: 'EMERGENCY ANALYSIS: COAL Surges on Naughty List Expansion',
      message: `In an unexpected development, COAL has become the day's biggest winner.

The reason? A leaked internal memo from Santa Corp suggests the Naughty List has grown 15% year-over-year, with a particularly large cohort of misbehaving children in key markets.

"Coal demand is real and quantifiable," explained commodity analyst Rocky Quarry. "Every child on that list needs a lump. It's basic supply and demand."

COAL is up 12% and showing no signs of slowing. Some traders are calling it "the ultimate hedge" against holiday sentiment.

Critics argue this is a temporary spike and fundamentals don't support the rally. Supporters counter that COAL has been undervalued for years.

[Volatility warning: COAL can give back gains as quickly as it made them]`,
      impact: { COAL: 12, GIFT: -2 }
    },
    {
      type: 'interview',
      headline: 'CANDID: Santa Addresses Holiday Concerns',
      message: `In a hastily arranged press conference, Santa Claus himself addressed mounting concerns about holiday delivery.

"Let me be crystal clear," the jolly CEO stated firmly. "Christmas WILL happen. Every child who deserves a gift will receive one. That is my personal guarantee."

When pressed about the logistics challenges:

"We've faced blizzards before. We've faced equipment failures. We've faced doubt. And every single year, we deliver. This year will be no different."

The confidence seemed to reassure markets. SANTA shares stabilized during the address.

Mrs. Claus, standing nearby, added: "He hasn't slept in three days. But he's never let anyone down."

[Sentiment: Cautiously optimistic. Leadership matters in crisis.]`,
      impact: { SANTA: 5, REIN: 2, ELF: 2 }
    },
    {
      type: 'rumor',
      headline: 'WHISPERS: Secret Backup Plan Activated?',
      message: `Unconfirmed reports suggest Santa Corp has activated "Protocol Snowflake" - a closely guarded contingency plan developed after the close calls of 2020.

Details are scarce, but sources describe:
- Hidden toy reserves in undisclosed Arctic locations
- Partnership agreements with friendly magical entities
- Advanced sleigh technology not yet revealed to shareholders

"They always have something up their sleeve," noted longtime Santa Corp watcher Gloria Northstar. "The man has been doing this for centuries. You think he doesn't have backup plans?"

Neither Santa Corp nor any affiliated entities would comment on the existence of Protocol Snowflake.

[Speculation: If true, could completely change the risk calculus]`,
      impact: { SANTA: 3, GIFT: 2 }
    },
  ],

  christmas_eve: [
    {
      type: 'breaking',
      headline: 'LIFTOFF: Santa\'s Sleigh Has Departed!',
      message: `At precisely 6:00 PM North Pole Time, Santa's sleigh lifted off from the main runway, beginning the most important journey of the year.

Tracking data shows the sleigh is operating at peak efficiency. All eight reindeer (plus Rudolph, cleared to fly despite concerns) are performing magnificently.

"Sleigh velocity nominal. Toy payload secure. Christmas is GO," announced Mission Control Chief Icicle Pemberton.

Global markets are rallying on the news. SANTA shares hit an all-time high in the final minutes of trading.

Families worldwide are setting out cookies and milk. Children are going to bed with visions of sugarplums.

This is it. The moment we've all been waiting for.

[Status: All systems green. Belief index at maximum.]`,
      impact: { SANTA: 10, REIN: 8, ELF: 5, GIFT: 6 }
    },
    {
      type: 'breaking',
      headline: 'LIVE UPDATE: Record Pace Confirmed',
      message: `Three hours into Christmas Eve operations, Santa Corp is reporting unprecedented efficiency.

By the numbers:
- Deliveries completed: 1.2 billion (ahead of schedule)
- Average time per chimney: 0.003 seconds (new record)
- Cookie quality rating: Exceptional
- Milk freshness: Above expectations

"We're witnessing perfection," said commentator Holly Evergreen on the 24-hour Christmas Eve broadcast. "This might be the greatest performance in holiday history."

REIN navigation systems are working flawlessly. Zero weather delays. Zero mechanical issues.

Even the elves watching from the North Pole are emotional. "We made all those toys," one was overheard saying. "And they're actually getting there."

[Market note: This is pure holiday magic converting to shareholder value]`,
      impact: { SANTA: 6, REIN: 5, GIFT: 4 }
    },
    {
      type: 'analysis',
      headline: 'CHRISTMAS EVE SPECIAL: The Winners and Losers',
      message: `As the world waits for morning, let's review this extraordinary season:

WINNERS:
- SANTA: Leadership in crisis, flawless execution tonight
- REIN: Team B story is instant legend
- ELF: Production records despite labor tensions
- GIFT: Consumer demand remained robust throughout

LOSERS:
- Bears who bet against Christmas
- Anyone who sold REIN during the crisis
- Short sellers on SANTA

WILDCARD:
- COAL: Volatile but provided genuine hedging value

What's next? Post-Christmas typically sees profit-taking, but this year's momentum could carry into New Year trading.

[Analyst consensus: Don't fight the Santa rally]`,
      impact: { SANTA: 2, REIN: 2, ELF: 2, GIFT: 2 }
    },
  ],

  christmas_day: [
    {
      type: 'breaking',
      headline: 'MISSION ACCOMPLISHED: Christmas Is Saved!',
      message: `It's official. Santa Claus has completed his rounds.

Final statistics:
- Total gifts delivered: 2.8 billion
- Countries visited: 195
- Cookies consumed: 892 million
- Milk gallons: 156 million
- "Ho ho ho"s: Countless

"We did it," Santa announced upon landing, embracing Mrs. Claus and the exhausted but jubilant elf team. "Together, we did it."

Global celebrations are underway. Markets are closed, but futures indicate a strong open.

The reindeer have been given three days off and unlimited carrot access. Rudolph's nose is glowing brighter than ever.

[This is what it's all about. Merry Christmas to all.]`,
      impact: { SANTA: 8, REIN: 6, ELF: 5, GIFT: 4 }
    },
    {
      type: 'interview',
      headline: 'POST-GAME: Santa Reflects on Historic Season',
      message: `In a Christmas morning interview, a tired but triumphant Santa shared thoughts on the remarkable season.

"There were moments I worried," he admitted. "The delays, the weather, the pressure... but then I remembered why we do this. The children. The joy. The magic."

On the team: "Every single elf, every reindeer, everyone who believed - this was their victory too."

On next year: "We'll rest. We'll learn. We'll improve. And next Christmas, we'll be even better."

When asked about retirement rumors that surface every year: Santa laughed heartily. "Retirement? I'm just getting started."

The interview ended with Santa falling asleep mid-sentence. He earned it.

[Sentiment: Peak holiday warmth. Markets closed but optimism high.]`,
      impact: { SANTA: 4, ELF: 3, REIN: 3 }
    },
  ],

  post_christmas: [
    {
      type: 'breaking',
      headline: 'RETURN TSUNAMI: Gift Returns Hit Record Levels',
      message: `The day after Christmas has brought a flood of gift returns that's overwhelming retailers.

Early data suggests return rates are up 25% from last year. Top returned items:
- Wrong-size sweaters (as always)
- Duplicate board games
- "Creative" gift choices from well-meaning relatives

GIFT index is under pressure as return processing costs mount. Several retailers have issued profit warnings.

"Returns are just part of the game," explained retail analyst Penny Pincher. "But this volume is exceptional. Someone bought a LOT of ugly sweaters."

The silver lining: Return activity is still commerce activity, and exchanges are running strong.

[Trading note: GIFT typically recovers within 2-3 sessions post-Christmas]`,
      impact: { GIFT: -7, SANTA: -2 }
    },
    {
      type: 'analysis',
      headline: 'COAL VICTORY LAP: Contrarians Celebrate',
      message: `COAL investors are having their moment.

The often-mocked stock has delivered its best holiday season in a decade, with gains of over 30% from November lows. The naughty list expansion thesis proved correct.

"Everyone laughed at us," said COAL bull Ebenezer Frost. "Who's laughing now?"

The success has sparked debate about whether COAL deserves permanent portfolio allocation as a holiday hedge, or whether this was a one-time anomaly.

Critics note: "You can't build a strategy around children being naughty."

Supporters counter: "You can if you have the data."

COAL's dividend payment is scheduled for next week - expected to be a record payout.

[Lesson: Never underestimate contrarian positions in sentiment-driven markets]`,
      impact: { COAL: 8, GIFT: -2 }
    },
    {
      type: 'breaking',
      headline: 'ELF UNION: Contract Negotiations Collapse',
      message: `Hopes for a smooth post-holiday period were dashed as elf labor negotiations broke down late last night.

The Elf Workers Union is demanding:
- 15% wage increase
- Guaranteed 8-hour shifts during non-peak periods
- Better hot cocoa quality in break rooms

ELF Industries has countered with a 5% increase and "cocoa improvements contingent on productivity metrics."

"This is insulting," declared union leader Sparkle Tinseltoes. "We just saved Christmas. We deserve better."

A work slowdown is possible. No strike has been called yet, but tensions are high.

[Risk factor: If unresolved, could impact next season's preparation timeline]`,
      impact: { ELF: -6, SANTA: -3 }
    },
    {
      type: 'rumor',
      headline: 'YEAR-END RESHUFFLING: Big Moves Coming?',
      message: `With the year winding down, institutional investors are reportedly making significant portfolio adjustments.

Heard on the trading floor:
- Several funds rotating out of GIFT winners into beaten-down value plays
- Unusual options activity on REIN suggests someone expects volatility
- SANTA long-term holders quietly adding to positions

"Tax-loss harvesting meets repositioning," explained portfolio manager Ivy Winter. "Everyone's cleaning house before New Year."

The question: Are these smart repositions or knee-jerk reactions to a wild year?

Historical data suggests post-Christmas reshuffling often creates opportunities for patient investors.

[Strategy note: Volatility = opportunity for those with conviction]`,
      impact: { GIFT: -3, COAL: 2, REIN: -2 }
    },
  ],

  off_season: [
    {
      type: 'analysis',
      headline: 'Q1 OUTLOOK: What to Watch in the Off-Season',
      message: `With the holiday rush behind us, attention turns to Q1 planning and preparation.

Key themes to monitor:

SANTA: Executive team evaluating lessons learned. Board meeting scheduled for January.

REIN: Reindeer breeding program kicks off. Next generation talent is crucial.

ELF: Labor negotiations ongoing. Resolution expected by February.

GIFT: Consumer sentiment surveys will set the tone for next season.

COAL: Traditionally quiet period, but contrarians stay vigilant.

"The off-season is when champions are made," noted strategist Aurora Borealis. "The work done now determines next Christmas."

[Long view: Patient accumulation during quiet periods often rewards]`,
      impact: { SANTA: 1, ELF: 1, REIN: 1 }
    },
    {
      type: 'interview',
      headline: 'EXCLUSIVE: Inside the North Pole\'s Innovation Lab',
      message: `Our reporters gained rare access to Santa Corp's secretive R&D facility.

Projects in development:
- Next-generation sleigh with improved fuel efficiency
- AI-powered naughty/nice detection (controversial)
- Sustainable gift-wrap alternatives
- Reindeer performance optimization through nutrition science

"We never stop improving," explained Chief Innovation Officer Tinker Frost. "The world changes. Children's wishes evolve. We have to stay ahead."

The most intriguing project: A rumored partnership with renewable energy providers to power the North Pole grid with aurora-captured energy.

Innovation spending is up 20% year-over-year - a sign of confidence in the company's future.

[Forward-looking: These investments typically take 2-3 seasons to impact earnings]`,
      impact: { SANTA: 2, REIN: 1, ELF: 1 }
    },
    {
      type: 'breaking',
      headline: 'RESOLVED: Elf Union Reaches Agreement',
      message: `After weeks of negotiations, ELF Workshop Industries and the Elf Workers Union have reached a new three-year contract.

Terms include:
- 10% wage increase over three years
- Maximum 10-hour shifts during peak season
- Premium hot cocoa guaranteed year-round
- New mental health and wellness benefits

"This is a fair deal that recognizes our workers' contributions," said ELF CEO Bramble Woodsworth.

Union leader Sparkle Tinseltoes agreed: "We didn't get everything, but this is progress. Our elves can be proud."

The resolution removes a major uncertainty for the sector. ELF shares are rallying on the news.

[Stability restored: One less thing to worry about for next season]`,
      impact: { ELF: 6, SANTA: 2 }
    },
    {
      type: 'rumor',
      headline: 'WILD SPECULATION: Merger Talks Resume?',
      message: `Remember those acquisition rumors from early season? They're back.

Industry insiders report that Santa Corp has restarted preliminary discussions with Reindeer Logistics Corp about a potential combination.

The logic: Vertical integration would give SANTA complete control over the delivery pipeline. REIN would gain access to SANTA's massive balance sheet for fleet expansion.

"It makes strategic sense on paper," noted M&A analyst Icicle Morgan. "The question is valuation. REIN won't come cheap after their heroic Christmas Eve performance."

No official comment from either party. As always, treat rumors with appropriate skepticism.

[If you're speculating: REIN typically trades up on M&A chatter, regardless of outcome]`,
      impact: { REIN: 4, SANTA: 1 }
    },
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
  // 2% chance of BLACK SWAN event (rare but catastrophic)
  if (random() < 0.02) {
    const blackSwanIndex = Math.floor(random() * BLACK_SWAN_EVENTS.length);
    const blackSwan = BLACK_SWAN_EVENTS[blackSwanIndex];
    return {
      ...blackSwan,
      message: `[🚨 BLACK SWAN EVENT 🚨] ${blackSwan.headline}\n\n${blackSwan.message}`,
    };
  }

  const season = getSeasonalContext(date);
  const pool = NEWS_POOLS[season];

  // 70% chance of regular news each tick
  if (random() > 0.7) {
    return null;
  }

  const index = Math.floor(random() * pool.length);
  const news = pool[index];

  // Format the full message with type tag
  return {
    ...news,
    message: `[${news.type.toUpperCase()}] ${news.headline}\n\n${news.message}`,
  };
}

export function applyNewsToPrice(basePrice: number, impactPercent: number): number {
  return basePrice * (1 + impactPercent / 100);
}
