import "./style.css";
import PouchDB from "pouchdb";
import PouchdbFind from "pouchdb-find";
import { html, render } from "lit-html";
import { until } from "lit-html/directives/until.js";

// setup pouchdb
PouchDB.plugin(PouchdbFind);
var db = new PouchDB("cats");

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
  html` <div class="card cat-card" style="width: 18rem;">
    <img src="${catDoc.url}" class="card-img-top" alt="image of cat" />
    <div class="card-body">
      <div class="card-text">
        ${catDoc.name}, ${catDoc.age}. <br />
        ${catDoc.hobbies.join(", ")}
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

// customElements.define("catCardTemplate", catCardTemplate);
// customElements.define("catCardListTemplate", catCardListTemplate);

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

// init page
window.onload = async () => {
  const info = await db.info();
  console.info("DB info:", info);

  await renderCatList();
};
