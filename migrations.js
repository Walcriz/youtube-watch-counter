function load(name) {
  return browser.storage.local.get(name);
}

function migrateV1(keys) {
  const migrated = {};
  for (const key in keys) {
    if (key == "version") continue;

    // Split key at last /
    const splitKey = key.split("/");
    const type = splitKey[splitKey.length - 1];
    // Key is the part before the last /
    const link = splitKey.slice(0, splitKey.length - 1).join('/');

    const url = new URL(link);
    const name = url.searchParams.get('v');
    var value = keys[key];
    if (!value || typeof value != "number") value = 0;

    if (name) {
      const migratedKey = name + "/" + type;
      if (migrated[migratedKey]) {
        migrated[migratedKey] = migrated[migratedKey] + value;
        console.log("Migrated " + key + " to " + migratedKey + "(Duplicate)");
        continue;
      }

      migrated[migratedKey] = value;
      console.log("Migrated " + key + " to " + migratedKey);
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

