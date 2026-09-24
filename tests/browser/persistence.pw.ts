import { test, expect, type Page } from "@playwright/test";

async function readNotes(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("keyval-store");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const notes = await new Promise<unknown>((resolve, reject) => {
      const request = db.transaction("keyval", "readonly").objectStore("keyval").get("bearings-notes");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return notes;
  });
}

test("notes survive reload and wipe clears every open tab without resurrection", async ({ context }) => {
  const notes = await context.newPage();
  await notes.goto("/notes");
  for (const body of ["first private note", "second private note"]) {
    await notes.locator("#note").fill(body);
    await notes.getByRole("button", { name: "Save on this device" }).click();
    await expect(notes.getByText(body)).toBeVisible();
  }
  await notes.reload();
  await expect(notes.getByText("first private note")).toBeVisible();
  await expect(notes.getByText("second private note")).toBeVisible();

  const settings = await context.newPage();
  await settings.goto("/settings");
  settings.once("dialog", (dialog) => dialog.accept());
  await settings.getByRole("button", { name: "Delete everything on this device" }).click();
  await expect(settings.getByText(/were deleted from this browser/)).toBeVisible();
  await expect(notes.getByText("first private note")).toHaveCount(0);
  await expect(notes.getByText("second private note")).toHaveCount(0);
  expect(await readNotes(settings)).toBeUndefined();

  await notes.locator("#note").fill("new note after wipe");
  await notes.getByRole("button", { name: "Save on this device" }).click();
  await expect(notes.getByText("new note after wipe")).toBeVisible();
  const stored = (await readNotes(notes)) as Array<{ body: string }>;
  expect(stored.map((note) => note.body)).toEqual(["new note after wipe"]);
});
