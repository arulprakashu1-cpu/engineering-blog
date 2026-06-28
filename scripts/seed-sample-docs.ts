// Seeds one sample PDF per document category, exercising the same on-disk
// storage path the upload action uses. Run: see package.json "db:seed-docs".
import { PrismaClient, type DocumentCategory } from "@prisma/client";

const prisma = new PrismaClient();

/** Build a small but valid PDF with a single line of text. */
function makePdf(text: string): Buffer {
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 360 220] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
  ];
  const stream = `BT /F1 22 Tf 30 120 Td (${text}) Tj ET`;
  objs.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  objs.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

const samples: {
  title: string;
  description: string;
  category: DocumentCategory;
  text: string;
}[] = [
  // Three docs that share a NAME across all categories — these group together
  // and can be compared side by side on /documents/compare.
  {
    title: "PCB Design (Rev A)",
    description: "Controlled standard for PCB layout and clearances.",
    category: "STANDARD_DOCUMENT",
    text: "PCB Design - Standard",
  },
  {
    title: "PCB Design",
    description: "Lessons learnt from past PCB design spins.",
    category: "LESSON_LEARNT",
    text: "PCB Design - Lessons Learnt",
  },
  {
    title: "PCB Design",
    description: "Pre-fabrication review checklist for PCB design.",
    category: "CHECKLIST",
    text: "PCB Design - Checklist",
  },
  // A standalone single-category doc.
  {
    title: "Power Supply Bring-up",
    description: "What went wrong and right during the SMPS bring-up.",
    category: "LESSON_LEARNT",
    text: "Power Supply Bring-up",
  },
];

async function main() {
  for (const s of samples) {
    const existing = await prisma.document.findFirst({
      where: { title: s.title, category: s.category },
    });
    if (existing) {
      console.log(`• exists: ${s.title} [${s.category}]`);
      continue;
    }
    const buf = makePdf(s.text);

    await prisma.document.create({
      data: {
        title: s.title,
        description: s.description,
        category: s.category,
        fileName: `${s.text.replace(/\s+/g, "-").toLowerCase()}.pdf`,
        mimeType: "application/pdf",
        fileSize: buf.length,
        fileData: buf,
        published: true,
      },
    });
    console.log(`✔ created: ${s.title} [${s.category}] (${buf.length} bytes)`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
