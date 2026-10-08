// saare games ek jagah: menu, board aur API teeno yahin se padhte hain
// max = server pe score ki upar seema, daily = fixed rounds (seed se same sawal)
export const GAMES = [
  { id: "border", icon: "🧵", name: "Border Blind", tag: "Sirf ek border ki lakeer. Kaunse do desh?", max: 30, daily: true },
  { id: "river", icon: "🌊", name: "River Rewind", tag: "Nadi draw ho rahi hai. Points ghat rahe hain.", max: 800, daily: true },
  { id: "higher", icon: "⚖️", name: "Weird Higher/Lower", tag: "Islands, neighbours, latitude… streak bana.", max: 500, daily: false },
  { id: "hops", icon: "🧭", name: "Border Hops", tag: "A se B, sirf land border cross karke. Kam hops = zyada points.", max: 500, daily: true },
  { id: "truesize", icon: "🔍", name: "True Size", tag: "Same box mein fit hue desh. Asli mein kaun bada?", max: 500, daily: false },
  { id: "length", icon: "📏", name: "Border Guesstimate", tag: "Border kitne km lambi hai? Slider se bol.", max: 800, daily: true },
  { id: "antipode", icon: "⛏️", name: "Antipode", tag: "Zameen ke aar-paar khod. Dusri taraf kya?", max: 10, daily: true },
  { id: "sun", icon: "🌅", name: "Sunrise Roulette", tag: "UTC time se solar noon dhundh. Suraj abhi kis desh pe?", max: 10, daily: true },
  { id: "duel", icon: "⚔️", name: "Distance Duel", tag: "Kaunsi jodi zyada door hai?", max: 10, daily: true },
  { id: "blitz", icon: "⚡", name: "Quadrant Blitz", tag: "30 second. NE/NW/SE/SW. Jitne ho sake.", max: 60, daily: false },
  { id: "trio", icon: "🔺", name: "Shared Neighbour", tag: "Do desh, ek common padosi. Kaun?", max: 10, daily: true },
] as const;

export const byId = (id: string) => GAMES.find((g) => g.id === id);
export const today = () => new Date().toISOString().slice(0, 10); // UTC din
