// Sri Lanka's full moon Poya days, as gazetted under the Holidays Act.
// Poya days can fall a day off the astronomical full moon, so these come from
// the official lists rather than a moon calculation. Add each new year here
// once its holidays are gazetted (usually mid-year for the following year).
const poyaDays: Record<string, string> = {
  "2026-01-03": "Duruthu",
  "2026-02-01": "Navam",
  "2026-03-02": "Medin",
  "2026-04-01": "Bak",
  "2026-05-01": "Vesak",
  "2026-05-30": "Adhi Poson",
  "2026-06-29": "Poson",
  "2026-07-29": "Esala",
  "2026-08-27": "Nikini",
  "2026-09-26": "Binara",
  "2026-10-25": "Vap",
  "2026-11-24": "Il",
  "2026-12-23": "Unduvap",
  "2027-01-22": "Duruthu",
  "2027-02-20": "Navam",
  "2027-03-22": "Medin",
  "2027-04-20": "Bak",
  "2027-05-19": "Vesak",
  "2027-06-18": "Poson",
  "2027-07-18": "Esala",
  "2027-08-16": "Nikini",
  "2027-09-15": "Binara",
  "2027-10-15": "Vap",
  "2027-11-13": "Il",
  "2027-12-13": "Unduvap"
};

export function getPoyaName(date: string) {
  const name = poyaDays[date];
  return name ? `${name} Full Moon Poya Day` : null;
}
