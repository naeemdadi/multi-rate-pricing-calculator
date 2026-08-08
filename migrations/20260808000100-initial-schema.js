/**
 * @param {import("mongodb").Db} db
 * @param {import("mongodb").MongoClient} client
 */
export async function up(db, client) {
  await Promise.all([
    db.collection("documents").createIndexes([
      {
        key: { userId: 1, issueDate: -1 },
        name: "documents_userId_issueDate_desc",
      },
      {
        key: { userId: 1, status: 1, updatedAt: -1 },
        name: "documents_userId_status_updatedAt_desc",
      },
      {
        key: { userId: 1, finalizedAt: -1 },
        name: "documents_userId_finalizedAt_desc",
      },
    ]),
    db.collection("documents").createIndex(
      { userId: 1, title: 1, issueDate: -1 },
      { name: "documents_userId_title_issueDate_desc" },
    ),
  ]);
}

/**
 * @param {import("mongodb").Db} db
 * @param {import("mongodb").MongoClient} client
 */
export async function down(db, client) {
  await Promise.all([
    db.collection("documents").dropIndex("documents_userId_issueDate_desc").catch(() => undefined),
    db.collection("documents").dropIndex("documents_userId_status_updatedAt_desc").catch(() => undefined),
    db.collection("documents").dropIndex("documents_userId_finalizedAt_desc").catch(() => undefined),
    db.collection("documents").dropIndex("documents_userId_title_issueDate_desc").catch(() => undefined),
  ]);
}
