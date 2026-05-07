/**
 * seedForum.js — Populate the Community Forum with realistic mock posts & comments.
 *
 * Uses the actual public photos already in frontend/public/:
 *   /sitio-villegas.png          — aerial/landscape of Sitio Villegas
 *   /sitio-villegas_feeding.JPG  — feeding day photo
 *   /hume100-students-part2.JPG  — UPLB Hume Hall volunteer group
 *
 * The `media.data` field accepts both base64 data-URLs AND plain URL strings.
 * The frontend's <img src={m.data}> renders both natively.
 *
 * Run:  node --env-file=.env src/scripts/seedForum.js
 * Or via npm script: npm run seed:forum
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User }    from '../models/User.js';
import { Post }    from '../models/Post.js';
import { Comment } from '../models/Comment.js';

// ── Image references (served by the Vite/static frontend) ────────────────────
const IMG = {
  sitio:    { data: '/sitio-villegas.png',         mimeType: 'image/png'  },
  feeding:  { data: '/sitio-villegas_feeding.JPG', mimeType: 'image/jpeg' },
  students: { data: '/hume100-students-part2.JPG', mimeType: 'image/jpeg' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const daysAgo  = (n) => new Date(Date.now() - n * 86_400_000);
const hoursAgo = (n) => new Date(Date.now() - n * 3_600_000);

// ── Run ───────────────────────────────────────────────────────────────────────
const run = async () => {
  await connectDB();

  // Wipe existing forum data only
  console.log('🧹  Clearing existing forum posts & comments…');
  await Promise.all([Post.deleteMany({}), Comment.deleteMany({})]);

  // ── Look up seeded users ──────────────────────────────────────────────────
  const byEmail = async (email) => {
    const u = await User.findOne({ email }).lean();
    if (!u) throw new Error(`User not found: ${email} — run npm run seed first`);
    return u;
  };

  const [
    kristine, mark, rhea,
    drSantos, liza,
    sampleVol, aira, jb, patricia, enzo, mika, jp, cathy, rico, shey, kim,
    sampleDonor, umc, lbcc, irri,
  ] = await Promise.all([
    byEmail('organizer@kalingalink.local'),
    byEmail('mark@kalingalink.local'),
    byEmail('rhea@kalingalink.local'),
    byEmail('health@kalingalink.local'),
    byEmail('liza.cruz@kalingalink.local'),
    byEmail('volunteer@kalingalink.local'),
    byEmail('aira@kalingalink.local'),
    byEmail('jb@kalingalink.local'),
    byEmail('patricia@kalingalink.local'),
    byEmail('enzo@kalingalink.local'),
    byEmail('mika@kalingalink.local'),
    byEmail('jp@kalingalink.local'),
    byEmail('cathy@kalingalink.local'),
    byEmail('rico@kalingalink.local'),
    byEmail('shey@kalingalink.local'),
    byEmail('kim@kalingalink.local'),
    byEmail('donor@kalingalink.local'),
    byEmail('umc@kalingalink.local'),
    byEmail('lbcc@kalingalink.local'),
    byEmail('irri@kalingalink.local'),
  ]);

  console.log('📝  Creating forum posts…');

  // ══════════════════════════════════════════════════════════════════════════
  // POST 1 — PINNED ANNOUNCEMENT · upcoming visit reminder
  // ══════════════════════════════════════════════════════════════════════════
  const p1 = await Post.create({
    authorId:   kristine._id,
    authorName: kristine.fullName,
    authorRole: kristine.role,
    type:       'announcement',
    program:    'feeding',
    isPinned:   true,
    content:
`📢 PAALALA SA LAHAT — JUNE FEEDING VISIT

This Saturday, June 14, is our monthly feeding & check-up visit to Sitio Villegas, Brgy. Putho-Tuntungin!

🕖 Muster time: 7:00 AM at the barangay hall entrance
🍚 Menu: Arroz caldo + pandesal + juice
📋 We need volunteers for:
  • Cooking committee (4 slots open)
  • Measuring & weighing (2 slots open)
  • Games & activities for the children (3 slots open)

Please sign up via the Events tab so we know who's coming. If you already signed up — thank you! Bring a good attitude and comfy shoes. 💚

For donations: we still need 2 sacks of rice and hygiene kits. Check the Resources section to pledge.

Kita tayo sa Sabado!`,
    media:     [],
    likes:     [mark._id, rhea._id, aira._id, jb._id, patricia._id, enzo._id, liza._id, rico._id, shey._id],
    likeCount: 9,
    commentCount: 5,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  });

  await Comment.insertMany([
    {
      postId: p1._id, authorId: aira._id,
      authorName: 'Aira Mendoza', authorRole: 'volunteer',
      content: 'Naka-sign up na po ako sa cooking committee! Excited na 🍳',
      createdAt: daysAgo(1.9), updatedAt: daysAgo(1.9),
    },
    {
      postId: p1._id, authorId: jb._id,
      authorName: 'JB Ramos', authorRole: 'volunteer',
      content: 'Count me in sa games committee! Gagawa pa ko ng bingo cards para sa bata haha',
      createdAt: daysAgo(1.8), updatedAt: daysAgo(1.8),
    },
    {
      postId: p1._id, authorId: irri._id,
      authorName: 'IRRI Staff Council', authorRole: 'donor',
      content: 'We will donate 3 sacks of rice and 20 hygiene kits. Saan po ideliver? 🙏',
      createdAt: daysAgo(1.5), updatedAt: daysAgo(1.5),
    },
    {
      postId: p1._id, authorId: kristine._id,
      authorName: 'Kristine Villegas', authorRole: 'organizer',
      content: 'Thank you IRRI! Please drop off at 6:30 AM at the barangay hall. We\'ll send the exact address on Saturday morning. 🙌',
      createdAt: daysAgo(1.4), updatedAt: daysAgo(1.4),
    },
    {
      postId: p1._id, authorId: mika._id,
      authorName: 'Mika Tan', authorRole: 'volunteer',
      content: 'Pupunta rin kami ng BS Stat group namin! 5 kami lahat 😊',
      createdAt: hoursAgo(20), updatedAt: hoursAgo(20),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 2 — PHOTO · feeding day recap (real feeding photo, students photo)
  // ══════════════════════════════════════════════════════════════════════════
  const p2 = await Post.create({
    authorId:   kristine._id,
    authorName: kristine.fullName,
    authorRole: kristine.role,
    type:       'photo',
    program:    'feeding',
    isPinned:   false,
    content:
`May feeding visit na naman tayo kahapon at sobrang saya ng puso ko! 🍚❤️

Nakapag-serve tayo ng mainit na arroz caldo at pandesal sa 36 bata at kanilang mga pamilya sa Sitio Villegas. Lahat busog, lahat masaya — yun ang importante.

Malaking salamat sa ating 24 volunteers na nagluto, nagmeasure, naglaro, at nagtuturo kahapon. Hindi kaya ng iilan lang ito nang wala kayo.

Special thanks din sa IRRI Staff Council at Los Baños Coffee Club sa generous na donation ng bigas at juice! 🙏

See you next month! Kaya natin 'to. 💚 #KalingaLink #SitioVillegas #BrgyPuthoTuntungin`,
    media:     [IMG.feeding, IMG.students],
    likes:     [mark._id, rhea._id, aira._id, jb._id, patricia._id, enzo._id, rico._id, shey._id, kim._id, liza._id, irri._id, umc._id],
    likeCount: 12,
    commentCount: 6,
    createdAt: daysAgo(8),
    updatedAt: daysAgo(8),
  });

  await Comment.insertMany([
    {
      postId: p2._id, authorId: enzo._id,
      authorName: 'Enzo Garcia', authorRole: 'volunteer',
      content: 'First time ko pumunta at talagang worth it! Nakaka-inspire yung mga bata, miss ko na sila ngayon 😭💚',
      createdAt: daysAgo(7.9), updatedAt: daysAgo(7.9),
    },
    {
      postId: p2._id, authorId: patricia._id,
      authorName: 'Patricia Lim', authorRole: 'volunteer',
      content: 'Ang sarap makita ng ngiti ng mga bata habang kumakain! Sana mas marami pa tayong matulong sa susunod.',
      createdAt: daysAgo(7.8), updatedAt: daysAgo(7.8),
    },
    {
      postId: p2._id, authorId: lbcc._id,
      authorName: 'Los Baños Coffee Club', authorRole: 'donor',
      content: 'Happy to be part of this! Let us know what you need for next month and we\'ll try to help again ☕',
      createdAt: daysAgo(7.7), updatedAt: daysAgo(7.7),
    },
    {
      postId: p2._id, authorId: drSantos._id,
      authorName: 'Dr. Maria Santos', authorRole: 'health',
      content: 'Napansin ko marami sa mga bata ang mas healthy na kumpara sa baseline natin 3 months ago. Good progress! We should document more thoroughly next visit. 📋',
      createdAt: daysAgo(7.5), updatedAt: daysAgo(7.5),
    },
    {
      postId: p2._id, authorId: jb._id,
      authorName: 'JB Ramos', authorRole: 'volunteer',
      content: 'Ate Kristine ang galing mo talaga mag-organise! See you all next month 🙌',
      createdAt: daysAgo(7.2), updatedAt: daysAgo(7.2),
    },
    {
      postId: p2._id, authorId: aira._id,
      authorName: 'Aira Mendoza', authorRole: 'volunteer',
      content: 'Yung mga kids, nung nalaman nilang mga UPLB sila nagtanong kung kaya bang mag-enroll sa UPLB someday 😭 Sana makarating sila.',
      createdAt: daysAgo(7), updatedAt: daysAgo(7),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 3 — PHOTO · Sitio Villegas scenery + volunteers (3 images)
  // ══════════════════════════════════════════════════════════════════════════
  const p3 = await Post.create({
    authorId:   mark._id,
    authorName: mark.fullName,
    authorRole: mark.role,
    type:       'photo',
    program:    null,
    isPinned:   false,
    content:
`Sitio Villegas — our second home. 🌿

Every time I make this trip, I'm reminded why we do this. The trail up to the sitio, the familiar faces of the families, the children running to greet us — sobrang special ng lugar na ito.

Proud of this community and the people who keep showing up. Year 3 of the Kalinga program and still going strong. 💚`,
    media:     [IMG.sitio, IMG.feeding, IMG.students],
    likes:     [kristine._id, rhea._id, aira._id, jb._id, rico._id, shey._id, kim._id, drSantos._id],
    likeCount: 8,
    commentCount: 3,
    createdAt: daysAgo(15),
    updatedAt: daysAgo(15),
  });

  await Comment.insertMany([
    {
      postId: p3._id, authorId: rico._id,
      authorName: 'Rico Andrada', authorRole: 'volunteer',
      content: 'Sobrang ganda ng view paakyat ng Sitio! Yung trail natin, effort pero worth it every single time 🌄',
      createdAt: daysAgo(14.9), updatedAt: daysAgo(14.9),
    },
    {
      postId: p3._id, authorId: shey._id,
      authorName: 'Shey Villaflor', authorRole: 'volunteer',
      content: 'The families there are the warmest people I\'ve ever met. Lagi akong umuwi feeling hopeful.',
      createdAt: daysAgo(14.5), updatedAt: daysAgo(14.5),
    },
    {
      postId: p3._id, authorId: umc._id,
      authorName: 'UPLB Mountaineers', authorRole: 'donor',
      content: 'We know that trail well! Happy to support the Kalinga program. Hit us up if you need trail maintenance support too 🏔️',
      createdAt: daysAgo(14), updatedAt: daysAgo(14),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 4 — ANNOUNCEMENT · health program update
  // ══════════════════════════════════════════════════════════════════════════
  const p4 = await Post.create({
    authorId:   rhea._id,
    authorName: rhea.fullName,
    authorRole: rhea.role,
    type:       'announcement',
    program:    'health',
    isPinned:   false,
    content:
`📋 HEALTH PROGRAM UPDATE — QUARTERLY DEWORMING COMPLETED

Good news! We successfully completed the Q2 deworming session for 34 out of 36 registered children in Sitio Villegas. The remaining 2 children were absent due to illness and will be followed up on our next visit.

Health data highlights (confidential summary only):
• 28 children showed weight improvement vs. Q1 baseline
• 4 children maintained weight (no change)
• 2 children below target — will be monitored closely
• All Vitamin A supplementation completed ✅

Dr. Santos and Liza Cruz from UPLB University Health Service led the health station, with support from 3 volunteer student nurses. Malaking tulong ninyo!

Next health screening: July 12 (BP screening for parents + vitamin distribution)

If you know families who may have missed the screening, please message me directly. 🙏`,
    media:     [],
    likes:     [kristine._id, mark._id, drSantos._id, liza._id, aira._id, jb._id],
    likeCount: 6,
    commentCount: 3,
    createdAt: daysAgo(22),
    updatedAt: daysAgo(22),
  });

  await Comment.insertMany([
    {
      postId: p4._id, authorId: drSantos._id,
      authorName: 'Dr. Maria Santos', authorRole: 'health',
      content: 'Great summary, Ate Rhea! The improvement in weight-for-age scores is encouraging. The lugaw + arroz caldo rotation is definitely helping. Keep it up! 👨‍⚕️',
      createdAt: daysAgo(21.8), updatedAt: daysAgo(21.8),
    },
    {
      postId: p4._id, authorId: liza._id,
      authorName: 'Liza Cruz, RN', authorRole: 'health',
      content: 'For the 2 children we\'re monitoring closely — I\'ve already coordinated with the brgy health station for a home visit next week. Will update on the group chat.',
      createdAt: daysAgo(21.5), updatedAt: daysAgo(21.5),
    },
    {
      postId: p4._id, authorId: kristine._id,
      authorName: 'Kristine Villegas', authorRole: 'organizer',
      content: 'Thank you Dr. Santos, Ate Liza, at lahat ng health partners! You\'re the backbone of the program 💚',
      createdAt: daysAgo(21), updatedAt: daysAgo(21),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 5 — STATUS · learning / reading circle update
  // ══════════════════════════════════════════════════════════════════════════
  const p5 = await Post.create({
    authorId:   kim._id,
    authorName: kim.fullName,
    authorRole: kim.role,
    type:       'status',
    program:    'learning',
    isPinned:   false,
    content:
`Reading Circle update! 📚

Ngayong araw, nag-conduct kami ng ika-3 tutoring session para sa mga Grade 3-5 students ng Sitio Villegas. 8 kids ang dumating — dalawa pa kaysa last time!

Highlights:
✏️ Batang si Ryan (Grade 4) finally read his first full paragraph out loud. Ang tagal naming pinaghandaan yan. Umiiyak kami ng tutor niya haha.
📖 We distributed 12 second-hand storybooks donated by UPLB Library Org — salamat!
🔢 Started basic multiplication drills using laminated flash cards

Ang mga bata, hindi lang pag-aaral ang kinukuha sa atin — koneksyon din. Lagi silang nagtatanong kung kailan kami babalik.

Babalik tayo. Palagi. 💚

Next session: July 5 (1:00 PM, Brgy. Putho-Tuntungin Barangay Hall)
Need 2 more tutors for Math! DM me if interested.`,
    media:     [],
    likes:     [kristine._id, mark._id, cathy._id, patricia._id, aira._id, shey._id, jp._id],
    likeCount: 7,
    commentCount: 4,
    createdAt: daysAgo(11),
    updatedAt: daysAgo(11),
  });

  await Comment.insertMany([
    {
      postId: p5._id, authorId: cathy._id,
      authorName: 'Cathy Dela Cruz', authorRole: 'volunteer',
      content: 'Grabe yun kay Ryan! Naiyak rin ako sa kwento mo 😭 See you sa July session! Count me in bilang tutor 🙋‍♀️',
      createdAt: daysAgo(10.9), updatedAt: daysAgo(10.9),
    },
    {
      postId: p5._id, authorId: jp._id,
      authorName: 'Juan Paulo Santos', authorRole: 'volunteer',
      content: 'I can help with Math tutoring! BS HE tayo pero kaya ko naman yung Grade 3-5 level haha. Message kita para sa July!',
      createdAt: daysAgo(10.5), updatedAt: daysAgo(10.5),
    },
    {
      postId: p5._id, authorId: kristine._id,
      authorName: 'Kristine Villegas', authorRole: 'organizer',
      content: 'The Reading Circle is one of my favorite parts of the program. Keep it up Kim! So proud of you and the team 📚❤️',
      createdAt: daysAgo(10.2), updatedAt: daysAgo(10.2),
    },
    {
      postId: p5._id, authorId: aira._id,
      authorName: 'Aira Mendoza', authorRole: 'volunteer',
      content: 'Yung story kay Ryan 😭 I need to sign up for the next session. Will dm you!',
      createdAt: daysAgo(10), updatedAt: daysAgo(10),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 6 — STATUS · environment / trail cleanup
  // ══════════════════════════════════════════════════════════════════════════
  const p6 = await Post.create({
    authorId:   rico._id,
    authorName: rico.fullName,
    authorRole: rico.role,
    type:       'status',
    program:    'environment',
    isPinned:   false,
    content:
`Trail cleanup done! 🌱

Today's team collected 15 bags of mixed waste (mostly plastic packaging and food wrappers) from the 1.2 km trail leading to Sitio Villegas. Thanks to 11 volunteers and 4 community members who joined in!

We also planted 18 native seedlings along the trail margins:
🌳 8 × Molave (Vitex parviflora)
🌿 5 × Banaba (Lagerstroemia speciosa)
🌱 5 × Narra (Pterocarpus indicus)

Seedlings were donated by the UPLB Institute of Forestry. Proper planting pits, bamboo stakes, and organic mulch were used. Community members will water them weekly.

The trail is critical for the community's access to markets and health centers — keeping it clean and safe is part of caring for the people who live there.

Dalaw kayo sa susunod at sama-sama tayong magtanim! 🌿`,
    media:     [IMG.sitio],
    likes:     [kristine._id, mark._id, aira._id, jb._id, patricia._id, enzo._id],
    likeCount: 6,
    commentCount: 2,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
  });

  await Comment.insertMany([
    {
      postId: p6._id, authorId: enzo._id,
      authorName: 'Enzo Garcia', authorRole: 'volunteer',
      content: 'Sobrang ganda ng trail after ng cleanup! Mas masaya ring mag-akyat. Good job lahat! Excited para sa mga puno 🌳',
      createdAt: daysAgo(29.8), updatedAt: daysAgo(29.8),
    },
    {
      postId: p6._id, authorId: umc._id,
      authorName: 'UPLB Mountaineers', authorRole: 'donor',
      content: 'Great work! If you need more native seedlings, just coordinate with us — UPLB Mountaineers partners with the Forestry Institute. More than happy to supply for the next planting 🏔️🌿',
      createdAt: daysAgo(29.5), updatedAt: daysAgo(29.5),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 7 — ANNOUNCEMENT · livelihood program
  // ══════════════════════════════════════════════════════════════════════════
  const p7 = await Post.create({
    authorId:   mark._id,
    authorName: mark.fullName,
    authorRole: mark.role,
    type:       'announcement',
    program:    'livelihood',
    isPinned:   false,
    content:
`🌱 LIVELIHOOD WORKSHOP — HOME GARDENING & FOOD PRESERVATION

We are pleased to announce our upcoming livelihood workshop for families in Sitio Villegas!

📅 Date: July 19, 2025 (Saturday)
⏰ Time: 9:00 AM – 12:00 PM
📍 Venue: Sitio Villegas community area
👨‍🏫 Resource persons: UPLB College of Agriculture & Food Technology faculty

Workshop agenda:
1. Backyard vegetable gardening (container & raised-bed methods)
2. Composting using kitchen waste
3. Basic food preservation — atchara, vinegar, dried fish
4. Q&A with UPLB agriculture students

Seedlings (pechay, kangkong, petsay Baguio, sitaw) and garden tools will be provided for FREE to participating households.

Target: 12 households from Sitio Villegas and 5 from neighboring Sitio Bulak.

Please register by July 15 — limited slots only! Contact Mark Reyes or message the Kalinga page. 🙏`,
    media:     [],
    likes:     [kristine._id, rhea._id, aira._id, jp._id, shey._id],
    likeCount: 5,
    commentCount: 3,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5),
  });

  await Comment.insertMany([
    {
      postId: p7._id, authorId: shey._id,
      authorName: 'Shey Villaflor', authorRole: 'volunteer',
      content: 'As a BS Nutrition student, I\'m so excited for this! The link between home gardening and food security is so real. Pwede po bang mag-assist sa workshop? 🌱',
      createdAt: daysAgo(4.9), updatedAt: daysAgo(4.9),
    },
    {
      postId: p7._id, authorId: jp._id,
      authorName: 'Juan Paulo Santos', authorRole: 'volunteer',
      content: 'BS HE here! My thesis is literally on food preservation practices in upland communities. Pwede akong mag-resource person sa food preservation module? DM me, Kuya Mark!',
      createdAt: daysAgo(4.7), updatedAt: daysAgo(4.7),
    },
    {
      postId: p7._id, authorId: mark._id,
      authorName: 'Mark Reyes', authorRole: 'organizer',
      content: 'Noted both of you! I\'ll add you to the workshop committee. Will send details via email this week. Thank you! 🙌',
      createdAt: daysAgo(4.5), updatedAt: daysAgo(4.5),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 8 — PHOTO · livelihood garden progress
  // ══════════════════════════════════════════════════════════════════════════
  const p8 = await Post.create({
    authorId:   jp._id,
    authorName: jp.fullName,
    authorRole: jp.role,
    type:       'photo',
    program:    'livelihood',
    isPinned:   false,
    content:
`Update mula sa mga household gardens ng Sitio Villegas! 🥬🍅

3 weeks after seedling distribution at grabe ang progress na! Ang pamilya ni Nanay Rosario ang pinaka-mabilis lumago — kamatis, pechay, at sitaw na lahat! Sabi niya halos hindi na sila bumibili ng gulay sa palengke ngayong buwan.

This is exactly what the livelihood program is about — hindi lang isang beses na tulong, kundi pangmatagalang kasarian ng pagbabago.

Proud ng programa at proud ng mga pamilyang ito! 🌱❤️`,
    media:     [IMG.sitio],
    likes:     [kristine._id, mark._id, shey._id, rhea._id],
    likeCount: 4,
    commentCount: 2,
    createdAt: daysAgo(18),
    updatedAt: daysAgo(18),
  });

  await Comment.insertMany([
    {
      postId: p8._id, authorId: shey._id,
      authorName: 'Shey Villaflor', authorRole: 'volunteer',
      content: 'This is so wholesome! Nanay Rosario is such an inspiration 🥹 The fresh vegetables will make a big difference nutritionally.',
      createdAt: daysAgo(17.8), updatedAt: daysAgo(17.8),
    },
    {
      postId: p8._id, authorId: kristine._id,
      authorName: 'Kristine Villegas', authorRole: 'organizer',
      content: 'Sobrang natutuwa ako sa update na ito! Ito ang pinakamagandang feedback na matatanggap natin. 💚',
      createdAt: daysAgo(17.5), updatedAt: daysAgo(17.5),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 9 — PHOTO · youth & arts day
  // ══════════════════════════════════════════════════════════════════════════
  const p9 = await Post.create({
    authorId:   cathy._id,
    authorName: cathy.fullName,
    authorRole: cathy.role,
    type:       'photo',
    program:    'youth',
    isPinned:   false,
    content:
`PAHIYAS ART DAY was the most fun I've had in a long time! 🎨

Today we ran a mini-Pahiyas art session with 22 children from Sitio Villegas. Each kid designed their own "kiping" cutout using recycled paper, watercolor, and indigenous motifs. The creativity of these kids — grabe, hindi pa sila 10 years old at mas magaling na sila sa akin 😂

Activities done:
🖌️ Kiping making & decoration
🎶 Cultural songs — "Bahay Kubo", "Magtanim Ay Di Biro"
🎭 Short skit about the environment (the kids made up their own story!)
📸 Photo exhibit corner — mga prints ng Sitio na isinali namin

3 of the kids asked if they could join UPLB someday. I couldn't hold back tears.

Big thanks sa UPLB Fine Arts students na tumulong sa facilitation at sa Los Baños Coffee Club sa snacks! ☕`,
    media:     [IMG.students, IMG.sitio],
    likes:     [kristine._id, mark._id, rhea._id, aira._id, jb._id, patricia._id, rico._id, kim._id, lbcc._id],
    likeCount: 9,
    commentCount: 4,
    createdAt: daysAgo(25),
    updatedAt: daysAgo(25),
  });

  await Comment.insertMany([
    {
      postId: p9._id, authorId: patricia._id,
      authorName: 'Patricia Lim', authorRole: 'volunteer',
      content: 'Nakita ko yung kiping art ng mga bata — they\'re genuinely talented! The one who made the blue-and-green kiping with fish patterns was amazing 🐟🎨',
      createdAt: daysAgo(24.9), updatedAt: daysAgo(24.9),
    },
    {
      postId: p9._id, authorId: lbcc._id,
      authorName: 'Los Baños Coffee Club', authorRole: 'donor',
      content: 'So glad we could help! The art day sounds wonderful. We\'d love to sponsor a bigger exhibition someday ☕🖼️',
      createdAt: daysAgo(24.7), updatedAt: daysAgo(24.7),
    },
    {
      postId: p9._id, authorId: aira._id,
      authorName: 'Aira Mendoza', authorRole: 'volunteer',
      content: 'Yung skit na ginawa ng mga bata about the environment, sobrang ganda! They talked about keeping the sitio clean better than any PSA I\'ve seen. 😭💚',
      createdAt: daysAgo(24.5), updatedAt: daysAgo(24.5),
    },
    {
      postId: p9._id, authorId: kristine._id,
      authorName: 'Kristine Villegas', authorRole: 'organizer',
      content: 'Cathy you absolutely crushed this event! Sana mayroon tayong Youth & Arts Day every visit. The kids love it and honestly so do we 🎨❤️',
      createdAt: daysAgo(24), updatedAt: daysAgo(24),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 10 — STATUS · volunteer call to action
  // ══════════════════════════════════════════════════════════════════════════
  const p10 = await Post.create({
    authorId:   rhea._id,
    authorName: rhea.fullName,
    authorRole: rhea.role,
    type:       'status',
    program:    null,
    isPinned:   false,
    content:
`Calling all UPLB students, faculty, and Los Baños community members!

The Kalinga-Link Sitio Villegas program is looking for more regular volunteers for our monthly visits. Hindi mo kailangang buti sa lahat — we just need willing hearts and hands.

What you can do:
🍚 Cook and serve food
📏 Assist with child measurements
📚 Tutor kids in reading and math
🎨 Lead art or music activities
🌿 Help with trail and garden maintenance
📸 Document and tell the community's story

No previous experience needed — we train and pair you with veterans.

Our next visit is June 14 (Saturday). If you're interested, sign up on the Events tab or message me. Let's bring more people into this family! 💚`,
    media:     [],
    likes:     [kristine._id, mark._id, aira._id, jb._id, rico._id, cathy._id, umc._id],
    likeCount: 7,
    commentCount: 3,
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4),
  });

  await Comment.insertMany([
    {
      postId: p10._id, authorId: sampleVol._id,
      authorName: sampleVol.fullName, authorRole: 'volunteer',
      content: 'I just signed up! First time ko. Excited pero medyo kinakabahan haha 😅 Any tips for newbies?',
      createdAt: daysAgo(3.9), updatedAt: daysAgo(3.9),
    },
    {
      postId: p10._id, authorId: aira._id,
      authorName: 'Aira Mendoza', authorRole: 'volunteer',
      content: 'Welcome! Tip #1: Bring extra water and sunblock. Tip #2: Let the kids lead conversations — they\'re hilarious. Tip #3: Prepare to not want to leave 😂💚',
      createdAt: daysAgo(3.7), updatedAt: daysAgo(3.7),
    },
    {
      postId: p10._id, authorId: rhea._id,
      authorName: 'Rhea Bautista', authorRole: 'organizer',
      content: 'So excited to meet you on Saturday! Don\'t worry — everyone is nervous the first time. You\'ll feel right at home within the first 10 minutes 🙌',
      createdAt: daysAgo(3.5), updatedAt: daysAgo(3.5),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 11 — STATUS · donor appreciation
  // ══════════════════════════════════════════════════════════════════════════
  const p11 = await Post.create({
    authorId:   kristine._id,
    authorName: kristine.fullName,
    authorRole: kristine.role,
    type:       'status',
    program:    null,
    isPinned:   false,
    content:
`Maraming salamat, donors! 🙏

This month's donations received:
• IRRI Staff Council: 5 sacks (50 kg) jasmine rice + 24 hygiene kits ✅
• Los Baños Coffee Club: 3 flats (36 liters) orange juice + biscuits ✅
• UPLB Mountaineers: 25 second-hand children's books ✅
• Anonymous donor: ₱2,000 cash (used for deworming medicine) ✅

Because of your generosity:
→ 36 children received warm meals last Saturday
→ 32 children completed their deworming
→ 8 families received hygiene kits
→ The reading library now has 47 books!

Every kilogram of rice, every peso, every hour of your time matters more than you know. The families of Sitio Villegas are grateful — and so are we. ❤️

See you all on the next visit! And to anyone reading this who wants to donate — check the Resources section!`,
    media:     [],
    likes:     [mark._id, rhea._id, drSantos._id, liza._id, aira._id, jb._id, patricia._id, enzo._id, irri._id, umc._id, lbcc._id],
    likeCount: 11,
    commentCount: 3,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(9),
  });

  await Comment.insertMany([
    {
      postId: p11._id, authorId: irri._id,
      authorName: 'IRRI Staff Council', authorRole: 'donor',
      content: 'Always happy to help! We\'ll coordinate a bigger donation for the July visit. Keep up the great work, Kalinga team! 💚',
      createdAt: daysAgo(8.9), updatedAt: daysAgo(8.9),
    },
    {
      postId: p11._id, authorId: umc._id,
      authorName: 'UPLB Mountaineers', authorRole: 'donor',
      content: 'Glad the books are being used! We\'ll collect more before the next visit. Some of our members also want to volunteer — will sign them up soon.',
      createdAt: daysAgo(8.7), updatedAt: daysAgo(8.7),
    },
    {
      postId: p11._id, authorId: sampleDonor._id,
      authorName: sampleDonor.fullName, authorRole: 'donor',
      content: 'Happy to contribute! Please post the specific needs for each visit — makes it easier for us to plan what to buy. 🙏',
      createdAt: daysAgo(8.5), updatedAt: daysAgo(8.5),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 12 — STATUS · health · BP screening for parents
  // ══════════════════════════════════════════════════════════════════════════
  const p12 = await Post.create({
    authorId:   drSantos._id,
    authorName: drSantos.fullName,
    authorRole: drSantos.role,
    type:       'status',
    program:    'health',
    isPinned:   false,
    content:
`Health note from the team:

During last month's visit, we also set up a blood pressure screening station for parents and guardians in Sitio Villegas. Results were eye-opening:
→ 9 out of 22 adults screened had elevated BP (pre-hypertension range)
→ 3 adults had readings in the hypertension Stage 1 range
→ All were counseled and given referrals to the brgy. health station

Hypertension is often called the "silent killer" — malaking bahagi ng ating programa na hindi lang ang mga bata ang tinutulungan natin, kundi ang buong pamilya.

We are coordinating with the Brgy. Putho-Tuntungin health station for follow-up monitoring. If you are a health professional and want to volunteer for our screening station, please reach out!

The next screening will include blood sugar testing for diabetic risk. Any sponsors for glucometer strips? 🙏`,
    media:     [],
    likes:     [kristine._id, rhea._id, mark._id, liza._id],
    likeCount: 4,
    commentCount: 2,
    createdAt: daysAgo(20),
    updatedAt: daysAgo(20),
  });

  await Comment.insertMany([
    {
      postId: p12._id, authorId: liza._id,
      authorName: 'Liza Cruz, RN', authorRole: 'health',
      content: 'The three Stage 1 cases have been referred and one already went to the brgy. health center. Thank you for bringing this to the community\'s attention! 🩺',
      createdAt: daysAgo(19.8), updatedAt: daysAgo(19.8),
    },
    {
      postId: p12._id, authorId: irri._id,
      authorName: 'IRRI Staff Council', authorRole: 'donor',
      content: 'We can donate glucometer strips — how many do you need for the July screening? Just let us know and we\'ll procure them.',
      createdAt: daysAgo(19.5), updatedAt: daysAgo(19.5),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 13 — PHOTO · students group photo (multi-image 2 photos)
  // ══════════════════════════════════════════════════════════════════════════
  const p13 = await Post.create({
    authorId:   aira._id,
    authorName: aira.fullName,
    authorRole: aira.role,
    type:       'photo',
    program:    null,
    isPinned:   false,
    content:
`HUME HALL represent! 🏠💚

20 of us from Hume Hall (UPLB dormitory) came out for today's visit — biggest batch from our dorm yet! So proud of my dormmates for showing up.

Special mention to those who came for the first time: Enzo, Mika, Mike — you guys were naturals!

Hindi lang volunteer experience ito. Ito ay bago nating pamilya. 💚

#HumeHall #UPLB #KalingaLink #SitioVillegas`,
    media:     [IMG.students, IMG.feeding],
    likes:     [kristine._id, jb._id, enzo._id, mika._id, patricia._id, rico._id],
    likeCount: 6,
    commentCount: 3,
    createdAt: daysAgo(36),
    updatedAt: daysAgo(36),
  });

  await Comment.insertMany([
    {
      postId: p13._id, authorId: enzo._id,
      authorName: 'Enzo Garcia', authorRole: 'volunteer',
      content: 'Grabe yung experience! Kinukuha pa namin ng bata yung kamay namin nung umalis na kami 😭 Babalik talaga ako.',
      createdAt: daysAgo(35.9), updatedAt: daysAgo(35.9),
    },
    {
      postId: p13._id, authorId: mika._id,
      authorName: 'Mika Tan', authorRole: 'volunteer',
      content: 'Best decision signing up 🥺 Already signed up for next month!',
      createdAt: daysAgo(35.7), updatedAt: daysAgo(35.7),
    },
    {
      postId: p13._id, authorId: jb._id,
      authorName: 'JB Ramos', authorRole: 'volunteer',
      content: '20 from Hume lang agad! By next year pag-sikapin nating maging 40. Let\'s make this a dorm tradition 🎉',
      createdAt: daysAgo(35.5), updatedAt: daysAgo(35.5),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 14 — STATUS · environment / monsoon preparation
  // ══════════════════════════════════════════════════════════════════════════
  const p14 = await Post.create({
    authorId:   rico._id,
    authorName: rico.fullName,
    authorRole: rico.role,
    type:       'status',
    program:    'environment',
    isPinned:   false,
    content:
`Heads up sa lahat ng darating sa Sabado!

Ngayong tag-ulan, ang trail papunta sa Sitio ay medyo madulas — especially yung gitna. Please wear appropriate footwear (rubber shoes or trekking sandals). Flip-flops are a no. 🙅

Also — with the heavy rains last week, there's a small washout near the mango tree before the first curve. Our forestry volunteers are coordinating with the barangay to install temporary bamboo reinforcement. Should be passable Saturday.

Environmental reminder: Please pack light, bring reusable containers. Zero waste policy on our visits — we pack in, we pack out.

Nature is our host sa Sitio Villegas. Alagaan natin siya. 🌿`,
    media:     [],
    likes:     [kristine._id, mark._id, enzo._id, patricia._id],
    likeCount: 4,
    commentCount: 1,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  });

  await Comment.insertMany([
    {
      postId: p14._id, authorId: enzo._id,
      authorName: 'Enzo Garcia', authorRole: 'volunteer',
      content: 'Noted! Will wear my trekking shoes. Also bringing extra bamboo stakes in case needed for the washout area 🪵',
      createdAt: daysAgo(2.9), updatedAt: daysAgo(2.9),
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // POST 15 — STATUS · general reflection
  // ══════════════════════════════════════════════════════════════════════════
  const p15 = await Post.create({
    authorId:   liza._id,
    authorName: liza.fullName,
    authorRole: liza.role,
    type:       'status',
    program:    'health',
    isPinned:   false,
    content:
`Just want to take a moment to appreciate what we're building here. 🙏

As a nurse, I've seen many community health programs come and go. What makes Kalinga different is the continuity — we show up every month, we know these children by name, we track their growth, and we celebrate every small win together.

Yung bata na dati underweight at ngayon ay normal range na — yun ang tagumpay. Hindi yun nangyayari sa isang beses na visit. Nangyayari kasi nagbabalik tayo.

To every volunteer, donor, and organizer in this program: you are making a measurable difference in the lives of real children and real families. Hindi lang parang — totoong pagbabago.

Keep going. 💚🩺`,
    media:     [],
    likes:     [kristine._id, mark._id, rhea._id, drSantos._id, aira._id, jb._id, patricia._id, enzo._id, mika._id, rico._id, shey._id, kim._id],
    likeCount: 12,
    commentCount: 2,
    createdAt: daysAgo(12),
    updatedAt: daysAgo(12),
  });

  await Comment.insertMany([
    {
      postId: p15._id, authorId: kristine._id,
      authorName: 'Kristine Villegas', authorRole: 'organizer',
      content: 'Ate Liza, you made me cry at work haha. Thank you for being such a pillar of this program. We are so lucky to have you. 💚',
      createdAt: daysAgo(11.9), updatedAt: daysAgo(11.9),
    },
    {
      postId: p15._id, authorId: drSantos._id,
      authorName: 'Dr. Maria Santos', authorRole: 'health',
      content: 'Well said, Liza. Continuity of care is everything. That\'s why KalingaLink matters — it makes consistency possible. 🩺💚',
      createdAt: daysAgo(11.5), updatedAt: daysAgo(11.5),
    },
  ]);

  // ──────────────────────────────────────────────────────────────────────────
  console.log('✅  Forum seeded successfully!');
  console.log(`   Posts created: 15`);
  console.log(`   Comments created: ${5 + 6 + 3 + 3 + 4 + 2 + 3 + 2 + 4 + 3 + 3 + 2 + 3 + 1 + 2}`);
  await mongoose.connection.close();
};

run().catch((err) => {
  console.error('❌  seedForum error:', err.message);
  process.exit(1);
});
