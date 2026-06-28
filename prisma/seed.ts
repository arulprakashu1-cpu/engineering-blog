import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const explicitHash = process.env.ADMIN_PASSWORD_HASH;
  const plaintext = process.env.ADMIN_PASSWORD ?? "change-me-in-production";

  const hashedPassword =
    explicitHash && explicitHash.length > 0
      ? explicitHash
      : bcrypt.hashSync(plaintext, 12);

  await prisma.admin.upsert({
    where: { email },
    update: { hashedPassword },
    create: { email, hashedPassword },
  });

  console.log(`✔ Admin ready: ${email}`);
}

async function seedLabels(names: string[]) {
  const labels = new Map<string, string>();
  for (const name of names) {
    const slug = slugify(name);
    const label = await prisma.label.upsert({
      where: { name },
      update: { slug },
      create: { name, slug },
    });
    labels.set(name, label.id);
  }
  return labels;
}

// A sample post that demonstrates the "raw embedded widget" use case:
// an Ohm's law calculator written as inline HTML + JS in the post body.
const ohmsLawWidget = `
<h2>Ohm's Law: V = I × R</h2>
<p>
  Ohm's law relates voltage (V), current (I), and resistance (R). The
  calculator below is an interactive widget embedded directly in the post
  body as raw HTML + JavaScript.
</p>

<table>
  <thead>
    <tr><th>Quantity</th><th>Symbol</th><th>Unit</th></tr>
  </thead>
  <tbody>
    <tr><td>Voltage</td><td>V</td><td>Volts (V)</td></tr>
    <tr><td>Current</td><td>I</td><td>Amperes (A)</td></tr>
    <tr><td>Resistance</td><td>R</td><td>Ohms (Ω)</td></tr>
  </tbody>
</table>

<div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;background:#f8fafc;">
  <strong>Ohm's Law Calculator</strong>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;">
    <label>I (A): <input id="ohm-i" type="number" value="2" step="0.1" style="width:90px;"></label>
    <label>R (Ω): <input id="ohm-r" type="number" value="10" step="1" style="width:90px;"></label>
    <button id="ohm-go" type="button" style="padding:4px 12px;">Compute V</button>
  </div>
  <p id="ohm-out" style="margin-top:10px;font-weight:600;">V = 20 V</p>
  <script>
    (function () {
      var i = document.getElementById('ohm-i');
      var r = document.getElementById('ohm-r');
      var out = document.getElementById('ohm-out');
      var go = document.getElementById('ohm-go');
      function calc() {
        var v = (parseFloat(i.value) || 0) * (parseFloat(r.value) || 0);
        out.textContent = 'V = ' + v.toFixed(2) + ' V';
      }
      go.addEventListener('click', calc);
    })();
  </script>
</div>

<p>Try changing the current and resistance, then press <em>Compute V</em>.</p>
`;

const rcFilterPost = `
<h2>Designing a First-Order RC Low-Pass Filter</h2>
<p>
  A first-order RC low-pass filter attenuates frequencies above its cutoff
  frequency <code>f_c = 1 / (2&pi;RC)</code>. Below is a quick reference and
  an embedded cutoff calculator.
</p>
<pre><code>f_c = 1 / (2 * pi * R * C)</code></pre>

<div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;background:#f8fafc;">
  <strong>RC Cutoff Frequency</strong>
  <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px;">
    <label>R (kΩ): <input id="rc-r" type="number" value="10" style="width:90px;"></label>
    <label>C (nF): <input id="rc-c" type="number" value="100" style="width:90px;"></label>
  </div>
  <p id="rc-out" style="margin-top:10px;font-weight:600;"></p>
  <script>
    (function () {
      var r = document.getElementById('rc-r');
      var c = document.getElementById('rc-c');
      var out = document.getElementById('rc-out');
      function calc() {
        var R = (parseFloat(r.value) || 0) * 1000;
        var C = (parseFloat(c.value) || 0) * 1e-9;
        if (R <= 0 || C <= 0) { out.textContent = 'Enter positive values'; return; }
        var fc = 1 / (2 * Math.PI * R * C);
        out.textContent = 'f_c ≈ ' + fc.toFixed(1) + ' Hz';
      }
      r.addEventListener('input', calc);
      c.addEventListener('input', calc);
      calc();
    })();
  </script>
</div>
`;

async function seedPosts(labels: Map<string, string>) {
  const posts = [
    {
      title: "Ohm's Law, Explained with an Interactive Calculator",
      excerpt:
        "The single most important relationship in electronics, with an embedded calculator widget to build intuition.",
      contentHtml: ohmsLawWidget,
      coverImageUrl:
        "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1200&q=80",
      published: true,
      labelNames: ["Fundamentals", "Calculators"],
    },
    {
      title: "Designing a First-Order RC Low-Pass Filter",
      excerpt:
        "Cutoff frequency math, a reference table, and an embedded calculator for picking R and C values.",
      contentHtml: rcFilterPost,
      coverImageUrl:
        "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1200&q=80",
      published: true,
      labelNames: ["Analog", "Calculators"],
    },
    {
      title: "Draft: Notes on SPI vs I2C",
      excerpt: "Work-in-progress comparison of two common embedded buses.",
      contentHtml:
        "<h2>SPI vs I2C</h2><p>This is an unpublished draft used to test the admin dashboard.</p>",
      coverImageUrl: null,
      published: false,
      labelNames: ["Embedded"],
    },
  ];

  for (const p of posts) {
    const slug = slugify(p.title);
    const post = await prisma.post.upsert({
      where: { slug },
      update: {
        title: p.title,
        excerpt: p.excerpt,
        contentHtml: p.contentHtml,
        coverImageUrl: p.coverImageUrl,
        published: p.published,
      },
      create: {
        title: p.title,
        slug,
        excerpt: p.excerpt,
        contentHtml: p.contentHtml,
        coverImageUrl: p.coverImageUrl,
        published: p.published,
      },
    });

    // Reset and re-link labels for idempotency.
    await prisma.postLabel.deleteMany({ where: { postId: post.id } });
    for (const name of p.labelNames) {
      const labelId = labels.get(name);
      if (labelId) {
        await prisma.postLabel.create({
          data: { postId: post.id, labelId },
        });
      }
    }

    console.log(`✔ Post ready: ${slug} (${p.published ? "published" : "draft"})`);
  }

  // A sample approved + pending comment on the first published post.
  const first = await prisma.post.findUnique({
    where: { slug: slugify(posts[0].title) },
  });
  if (first) {
    const existing = await prisma.comment.count({ where: { postId: first.id } });
    if (existing === 0) {
      await prisma.comment.createMany({
        data: [
          {
            postId: first.id,
            authorName: "Ada",
            body: "The embedded calculator is a great touch!",
            approved: true,
          },
          {
            postId: first.id,
            authorName: "SpamBot",
            body: "Pending comment awaiting moderation.",
            approved: false,
          },
        ],
      });
      console.log("✔ Sample comments added");
    }
  }
}

async function main() {
  await seedAdmin();
  const labels = await seedLabels([
    "Fundamentals",
    "Analog",
    "Embedded",
    "Calculators",
  ]);
  await seedPosts(labels);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
