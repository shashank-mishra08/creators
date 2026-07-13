import { prisma } from './src/lib/db/prisma';

async function main() {
  const arden = await prisma.property.findFirst({where:{name:'Arden'}});
  if (arden) {
    await prisma.propertyMedia.create({data:{propertyId:arden.id, type:'cover', url:'/properties/arden-aerial.jpg', sortOrder:0}});
    console.log('Fixed Arden');
  }
  const whisper = await prisma.property.findFirst({where:{name:'Wishpers of Wonder'}});
  if (whisper) {
    await prisma.propertyMedia.create({data:{propertyId:whisper.id, type:'cover', url:'/properties/whisper-cover.jpg', sortOrder:0}});
    await prisma.propertyMedia.create({data:{propertyId:whisper.id, type:'gallery', url:'/properties/whisper-g1.jpg', sortOrder:1}});
    console.log('Fixed Whisper');
  }
}

main().catch(console.error).finally(()=>prisma.$disconnect());
