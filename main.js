import "./style.css";
import PouchDB from "pouchdb";
import PouchdbFind from "pouchdb-find";
import toastr from "toastr";

import { html, render } from "lit-html";
import { until } from "lit-html/directives/until.js";

// toastr settings
toastr.options.closeButton = true;
toastr.options.preventDuplicates = true;

// setup pouchdb
PouchDB.plugin(PouchdbFind);

var db = new PouchDB("cats");

console.log("Imported env variables", import.meta.env);
console.log(import.meta.env.VITE_DB_URL);

// cat pouch changes
db.changes({ since: "now", live: true, include_docs: true }).on(
  "change",
  async (change) => {
    if (change.deleted) {
      // document was deleted
      console.log("deleted", change);
    } else {
      // document was added/modified
      console.log("change", change);
      if (change.doc?.type === "cat") {
        await renderCatList();
      }
    }
  }
);

// cat pouch functions
async function syncDatabase(
  remoteDbUrl = import.meta.env.VITE_DB_URL + "/cats"
) {
  var remoteDB = new PouchDB(remoteDbUrl);

  db.sync(remoteDB)
    .on("complete", function () {
      console.log("Synced to", remoteDbUrl);
      toastr.success("Synced to CouchDB");
    })
    .on("error", function (err) {
      console.error("Error syncing to", remoteDbUrl, err);
      toastr.error("Couldn't sync to CouchDB!");
    });
}

async function addCat(catName, catAge) {
  const response = await fetch("https://api.thecatapi.com/v1/images/search");
  const catImage = await response.json();

  let doc = await tryGetCat(catName);

  doc._id = doc._id ?? new Date().toJSON();
  doc._rev = doc._rev ?? "";

  doc.url = catImage[0].url;
  doc.type = "cat";
  doc.name = catName;
  doc.age = catAge;
  doc.hobbies = ["playing", "sleeping", "hunting"];

  await db.put(doc);
  toastr.success("Added kitty")
}

async function tryGetCat(catName) {
  try {
    return await db.get(catName);
  } catch {
    return {};
  }
}

async function getCats() {
  const cats = await db.allDocs({
    include_docs: true,
    descending: true,
  });
  return cats.rows;
}

async function getCat(catId) {
  const cat = await db.get(catId);
  return cat;
}

async function listCats() {
  const cats = await getCats();
  cats.map((c) => c.doc).forEach((c) => console.log(c));
}

async function deleteCats() {
  var docs = await getCats();

  docs.forEach(async (c) => {
    var cat = await getCat(c.id);
    db.remove(cat);
    await renderCatList();
  });

  toastr.success("Deleted kitties")
}

async function onSubmit() {
  const catName = document.getElementById("catName");
  const catAge = document.getElementById("catAge");
  const catAgeOutput = document.getElementById("catAgeOutput");
  await addCat(catName.value, catAge.value);

  catName.value = "";
  catAge.value = 20;
  catAgeOutput.value = "20";
}

// lit-html elements
const catCardTemplate = (catDoc) =>
  html` <div
    class="card bg-dark border-white text-white cat-card"
    style="width: 18rem;"
  >
    <img src="${catDoc.url}" class="card-img-top" alt="image of cat" />
    <div class="card-body">
      <div class="card-text">
        <h3>${catDoc.name}, ${catDoc.age}.</h3>
        <br />
        <div>
          ${catDoc.hobbies.map(
            (h) => html`<span class="badge rounded-pill bg-primary">${h}</span>`
          )}
        </div>
      </div>
    </div>
  </div>`;

const catCardListTemplate = () => {
  return html`${until(
    getCats().then((cats) => {
      return cats.map((c) => c.doc).map((catDoc) => catCardTemplate(catDoc));
    }),
    html`Loading cats...`
  )}`;
};

// render cat list

async function renderCatList() {
  render(catCardListTemplate(), document.getElementById("catList"));
}

// button listeners
document
  .getElementById("submitBtn")
  .addEventListener("click", async (event) => {
    if (document.querySelector("form").checkValidity()) {
      event.preventDefault();
      try {
        await onSubmit();
      } catch (e) {
        console.error("Error when submitting", e);
      }
    }
  });

document
  .getElementById("deleteBtn")
  .addEventListener("click", async (event) => {
    event.preventDefault();
    await deleteCats();
  });

document.getElementById("syncBtn").addEventListener("click", async (event) => {
  event.preventDefault();
  await syncDatabase();
});

// init page
window.onload = async () => {
  const info = await db.info();
  console.info("DB info:", info);

  await renderCatList();
};
