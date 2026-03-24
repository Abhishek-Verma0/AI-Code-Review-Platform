import { prisma } from "@/lib/prisma"


export async function POST(req) {
    try {
        //  gettign event

        const event = req.headers.get('x-github-event');

        const body = await req.json()
        console.log("github event : ", event);
        
        if (event === "installation") {
            const installationId = body.installation.id;
            const accountLogin = body.installation.account.login;
            const accountType = body.installation.account.type;
            console.log("Installation done id: ", installationId)

            //  for trial we take one for now
            const user = await prisma.user.findFirst();
            if (user) {
                await prisma.installationId.upsert({
                    where: {
                        githubInstId: installationId.toString(),
                    },
                    update: {},
                    create: {
                        githubInstId: installationId.toString(),
                        accountLogin,
                        accountType,
                        userId: user.id,
                    },
                });
            }
        }
    } catch (err) {
        console.log(err)
    }
}