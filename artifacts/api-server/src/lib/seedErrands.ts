import { db, errandsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

type DemoErrand = {
  title: string;
  description: string;
  category: string;
  requesterName: string;
  requesterLocation: string;
  estimatedDuration?: string;
  tripFrom?: string;
  tripTo?: string;
  tripWhen?: string;
  passengers?: number;
  returnTrip?: boolean;
};

/**
 * Demo errands so the board doesn't look empty before real activity picks up.
 * Deliberately have:
 *  - NO phone and NO address — they aren't real people, so nothing fake is ever
 *    shown to a helper who opens one.
 *  - NO budget — the "Pay" button only renders for errands with a budget > 0, so
 *    leaving budget unset means no real money can ever flow into a placeholder.
 *  - No requesterUserId (anonymous) — so they can't be reviewed.
 * They are pure display placeholders. Remove this seed once real posts flow.
 */
const DEMO_ERRANDS: DemoErrand[] = [
  {
    title: "Collect a parcel from Nenagh post office",
    description:
      "I'm stuck at work until six and the post office closes before I can get there. Would someone be able to collect a small parcel and drop it to me near Pearse Street? It's already paid for, just needs picking up.",
    category: "Delivery",
    requesterName: "Orla Ryan",
    requesterLocation: "Nenagh",
    estimatedDuration: "30 mins",
  },
  {
    title: "Help carry shopping up to first-floor flat",
    description:
      "I do a big weekly shop and struggle with the stairs up to my flat. Looking for a hand carrying bags up once a week, usually Friday afternoons. Friendly and reliable would be great.",
    category: "Grocery Shopping",
    requesterName: "Tadhg Walsh",
    requesterLocation: "Nenagh",
    estimatedDuration: "20 mins",
  },
  {
    title: "Feed my cat while I'm away for the weekend",
    description:
      "Heading away Friday to Sunday and need someone to pop in twice a day to feed Milo and top up his water. He's very friendly. Food and a key will be left ready.",
    category: "Pet Care",
    requesterName: "Niamh Hayes",
    requesterLocation: "Dromineer",
    estimatedDuration: "2 days",
  },
  {
    title: "Wash and hoover the inside of my car",
    description:
      "Car is in bits after the kids and the dog. Looking for a good wash outside and a proper hoover and wipe-down inside. I have all the bits, just no time this week.",
    category: "Car Care",
    requesterName: "Declan Morrissey",
    requesterLocation: "Nenagh",
    estimatedDuration: "1 hour",
  },
  {
    title: "Mow a small front and back lawn",
    description:
      "Two small lawns getting away from me. Would suit someone with their own mower. Should only take an hour or so. Happy to sort a regular slot if it goes well.",
    category: "Gardening",
    requesterName: "Bridget Connell",
    requesterLocation: "Puckane",
    estimatedDuration: "1 hour",
  },
  {
    title: "Pick up a prescription from the chemist",
    description:
      "I'm minding little ones and can't get out to the chemist in town. Looking for someone to collect a prescription and drop it back. I'll ring ahead so it's ready to go.",
    category: "Elderly Assistance",
    requesterName: "Margaret Fox",
    requesterLocation: "Nenagh",
    estimatedDuration: "30 mins",
  },
  {
    title: "Hand needed to move a wardrobe upstairs",
    description:
      "Bought a second-hand wardrobe and need a second pair of strong hands to get it up the stairs and into the back bedroom. Should be a 20-minute job for two people.",
    category: "Moving Help",
    requesterName: "Cathal Brennan",
    requesterLocation: "Nenagh",
    estimatedDuration: "30 mins",
  },
  {
    title: "Walk my two dogs around Tyone a few mornings",
    description:
      "Recovering from a knee op and can't manage the dogs for a couple of weeks. Looking for a reliable morning walk, about 30 minutes, for two well-behaved labs.",
    category: "Pet Care",
    requesterName: "Eimear Doyle",
    requesterLocation: "Nenagh",
    estimatedDuration: "30 mins",
  },
  {
    title: "Lift to Limerick on Thursday morning",
    description:
      "Have an appointment in Limerick on Thursday and no way of getting there. Happy to chip in for fuel. Would need to leave Nenagh around 8am and back by lunchtime.",
    category: "Lifts & Transport",
    requesterName: "Sean Gleeson",
    requesterLocation: "Nenagh",
    tripFrom: "Nenagh",
    tripTo: "Limerick",
    tripWhen: "Thursday, around 8am",
    passengers: 1,
    returnTrip: true,
  },
  {
    title: "Lift to Shannon Airport early Saturday",
    description:
      "Flying out Saturday morning and looking for a lift to Shannon. Early start, around 5am from Nenagh. Will sort fuel and a bit extra for the early hour.",
    category: "Lifts & Transport",
    requesterName: "Aoife Carroll",
    requesterLocation: "Nenagh",
    tripFrom: "Nenagh",
    tripTo: "Limerick Airport (Shannon)",
    tripWhen: "Saturday, 5am",
    passengers: 2,
    returnTrip: false,
  },
];

/**
 * Idempotent: inserts any demo errand whose title isn't already present, so it
 * runs safely on every startup without creating duplicates.
 */
export async function ensureDemoErrands(): Promise<void> {
  for (const e of DEMO_ERRANDS) {
    const existing = await db
      .select({ id: errandsTable.id })
      .from(errandsTable)
      .where(eq(errandsTable.title, e.title));
    if (existing.length === 0) {
      await db.insert(errandsTable).values({
        title: e.title,
        description: e.description,
        category: e.category,
        requesterName: e.requesterName,
        requesterLocation: e.requesterLocation,
        estimatedDuration: e.estimatedDuration ?? null,
        tripFrom: e.tripFrom ?? null,
        tripTo: e.tripTo ?? null,
        tripWhen: e.tripWhen ?? null,
        passengers: e.passengers ?? null,
        returnTrip: e.returnTrip ?? false,
      });
      logger.info({ title: e.title }, "Seeded demo errand");
    }
  }
}
