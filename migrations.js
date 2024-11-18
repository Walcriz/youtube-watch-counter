function load(name) {
  return browser.storage.local.get(name);
}

function migrateV1(keys) {
  const migrated = {};
  for (const key in keys) {
    if (key == "version") continue;

    const url = new URL(key);
    const name = url.searchParams.get('v');
    var value = keys[key];
    if (!value || typeof value != "number") value = 0;

    if (name) {
      if (migrated[name]) {
        migrated[name] = migrated[name] + value;
        continue;
      }

      migrated[name] = value;
      console.log("Migrated " + key + " to " + name);
    } else {
      console.log("Failed to migrate " + key);
    }
  }

  migrated["version"] = 2;

  browser.storage.local.set(migrated);
}

// Load version
load("version").then(version => {
  // Migration #1
  if (!version) {
    // Loop all keys in storage
    let keys = browser.storage.local.get();
    keys.then(keys => {
      migrateV1(keys);
    }, error => { console.log(error); });
  }
});
