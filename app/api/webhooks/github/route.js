import { prisma } from "@/lib/prisma";

export async function POST(req) {
  try {
    // event type from github header
    const event = req.headers.get("x-github-event");

    // 2. Parse request body
    const body = await req.json();

    console.log("GitHub Event:", event);

//  handling installation
    if (event === "installation") {
      const installationId = body.installation.id;
      const accountLogin = body.installation.account.login;
      const accountType = body.installation.account.type;

      console.log("Installation received:", installationId);

      //  get first user (later we improve this)
      const user = await prisma.user.findFirst();

      if (user) {
        await prisma.installation.upsert({
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


    // handle repo Add/Remove

    if (event === "installation_repositories") {
      const installationId = body.installation.id;

      const installation = await prisma.installation.findUnique({
        where: {
          githubInstId: installationId.toString(),
        },
      });

      if (!installation)
        return new Response("No installation", { status: 200 });

      // Repos added
      const addedRepos = body.repositories_added || [];

      for (const repo of addedRepos) {
        await prisma.repository.upsert({
          where: {
            githubRepoId: repo.id.toString(),
          },
          update: {},
          create: {
            githubRepoId: repo.id.toString(),
            name: repo.name,
            fullName: repo.full_name,
            isPrivate: repo.private,
            defaultBranch: repo.default_branch,
            installationId: installation.id,
          },
        });
      }

      // Repos removed
      const removedRepos = body.repositories_removed || [];

      for (const repo of removedRepos) {
        await prisma.repository.deleteMany({
          where: {
            githubRepoId: repo.id.toString(),
          },
        });
      }
    }


    // handle pull request

    if (event === "pull_request") {
      const action = body.action;

      console.log("PR action:", action);

      if (action === "opened" || action === "synchronize") {
        const repoId = body.repository.id;
        const prNumber = body.pull_request.number;

        console.log("New PR or update:", repoId, prNumber);

        //enqueue scan job (later)
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
}
