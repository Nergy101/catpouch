import "./style.css";
import PouchDB from "pouchdb";
import PouchdbFind from "pouchdb-find";
PouchDB.plugin(PouchdbFind);

var db = new PouchDB("cats");

async function addCat(catName, catAge) {
  let doc = await tryGetCat(catName);

  doc._id = doc._id ?? new Date().toJSON();
  doc._rev = doc._rev ?? "";

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

async function sync() {
  await db.sync("cats");
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

document.getElementById("submitBtn").addEventListener("click", (event) => {
  if (document.querySelector("form").checkValidity()) {
    event.preventDefault();
    onSubmit().catch((e) => console.log("Error when submitting", e));
  }
});

async function renderCatList() {
  const cats = await getCats();
  const catsList = document.getElementById("catList");
  catsList.innerHTML = "";

  cats.forEach(async (cat) => {
    const catDoc = cat.doc;

    let newLi = document.createElement("li");
    newLi.appendChild(
      document.createTextNode(
        `${catDoc.name}, ${catDoc.age}: ${catDoc.hobbies}`
      )
    );
    newLi.classList.add("list-group-item");
    catsList.appendChild(newLi);
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

async function listCats() {
  const cats = await getCats();
  cats.map((c) => c.doc).forEach((c) => console.log(c));
}

async function deleteCats() {
  var docs = await getCats();

  docs.forEach(async (c) => {
    var cat = await getCat(c.id);
    console.log("test", cat);
    db.remove(cat);
  });
}

window.onload = async () => {
  const info = await db.info();
  console.log("DB info:", info);

  await renderCatList();
};
