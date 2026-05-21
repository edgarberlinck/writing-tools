#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rusqlite::{params, Connection};
use serde::Serialize;
use serde_json::Value;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Manager;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopInfo {
    version: String,
    platform: String,
    app_name: String,
    is_tauri: bool,
}

#[derive(Serialize)]
struct PutResult {
    ok: bool,
    id: String,
    rev: String,
}

#[derive(Serialize)]
struct RemoveResult {
    ok: bool,
}

#[derive(Serialize)]
struct AllDocsResult {
    rows: Vec<AllDocsRow>,
}

#[derive(Serialize)]
struct AllDocsRow {
    doc: Value,
}

fn parse_rev_number(rev: &str) -> Option<i64> {
    let head = rev.split('-').next()?;
    head.parse::<i64>().ok()
}

fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let mut dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    dir.push("data");
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    dir.push("writing-tools.db");
    Ok(dir)
}

fn maybe_migrate_legacy_db(app: &tauri::AppHandle, new_db_path: &Path) -> Result<(), String> {
    if new_db_path.exists() {
        return Ok(());
    }

    let new_data_dir = new_db_path
        .parent()
        .ok_or_else(|| "invalid_db_path".to_string())?;
    let current_app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let app_data_parent = current_app_data_dir
        .parent()
        .ok_or_else(|| "invalid_app_data_dir".to_string())?;

    // Keep this list as an ordered set of known legacy data folders.
    let legacy_data_dirs = [
        app_data_parent.join("com.writingtools.app").join("data"),
        app_data_parent.join("Writing Tools").join("data"),
    ];

    for legacy_data_dir in legacy_data_dirs {
        let legacy_db_path = legacy_data_dir.join("writing-tools.db");
        if !legacy_db_path.exists() {
            continue;
        }

        fs::create_dir_all(new_data_dir).map_err(|e| e.to_string())?;
        fs::copy(&legacy_db_path, new_db_path).map_err(|e| e.to_string())?;

        // SQLite can use sidecar files; migrate them when present.
        for suffix in ["-wal", "-shm"] {
            let legacy_sidecar = legacy_data_dir.join(format!("writing-tools.db{suffix}"));
            if legacy_sidecar.exists() {
                let new_sidecar = new_data_dir.join(format!("writing-tools.db{suffix}"));
                fs::copy(legacy_sidecar, new_sidecar).map_err(|e| e.to_string())?;
            }
        }

        eprintln!(
            "Migrated legacy database from {} to {}",
            legacy_db_path.display(),
            new_db_path.display()
        );
        return Ok(());
    }

    Ok(())
}

fn open_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let path = db_path(app)?;
    maybe_migrate_legacy_db(app, &path)?;
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS docs (
          id TEXT PRIMARY KEY,
          doc_type TEXT NOT NULL,
          data TEXT NOT NULL,
          rev INTEGER NOT NULL,
          updated_at TEXT NOT NULL
        )",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn)
}

#[tauri::command]
fn desktop_info(app: tauri::AppHandle) -> DesktopInfo {
    DesktopInfo {
        version: app.package_info().version.to_string(),
        platform: std::env::consts::OS.to_string(),
        app_name: app.package_info().name.to_string(),
        is_tauri: true,
    }
}

#[tauri::command]
fn db_all_docs(app: tauri::AppHandle) -> Result<AllDocsResult, String> {
    let conn = open_db(&app)?;
    let mut stmt = conn
        .prepare("SELECT data FROM docs")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let data: String = row.get(0)?;
            let parsed: Value = serde_json::from_str(&data).unwrap_or(Value::Null);
            Ok(AllDocsRow { doc: parsed })
        })
        .map_err(|e| e.to_string())?;

    let mut out = Vec::new();
    for item in rows {
        out.push(item.map_err(|e| e.to_string())?);
    }

    Ok(AllDocsResult { rows: out })
}

#[tauri::command]
fn db_get(app: tauri::AppHandle, id: String) -> Result<Value, String> {
    let conn = open_db(&app)?;
    let data: String = conn
        .query_row("SELECT data FROM docs WHERE id = ?1", [id], |row| row.get(0))
        .map_err(|_| "not_found".to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[tauri::command]
fn db_put(app: tauri::AppHandle, mut doc: Value) -> Result<PutResult, String> {
    let conn = open_db(&app)?;
    let obj = doc
        .as_object_mut()
        .ok_or_else(|| "invalid_document".to_string())?;

    let id = obj
        .get("_id")
        .and_then(Value::as_str)
        .ok_or_else(|| "missing_id".to_string())?
        .to_string();

    let doc_type = obj
        .get("type")
        .and_then(Value::as_str)
        .ok_or_else(|| "missing_type".to_string())?
        .to_string();

    let provided_rev = obj
        .get("_rev")
        .and_then(Value::as_str)
        .and_then(parse_rev_number);

    let existing_rev: Option<i64> = conn
        .query_row("SELECT rev FROM docs WHERE id = ?1", [id.clone()], |row| row.get(0))
        .ok();

    if let Some(current) = existing_rev {
        if provided_rev != Some(current) {
            return Err("conflict".to_string());
        }
    }

    let next_rev = existing_rev.unwrap_or(0) + 1;
    let rev_str = next_rev.to_string();
    obj.insert("_rev".to_string(), Value::String(rev_str.clone()));

    let now = chrono::Utc::now().to_rfc3339();
    let data = serde_json::to_string(&doc).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO docs (id, doc_type, data, rev, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET
           doc_type = excluded.doc_type,
           data = excluded.data,
           rev = excluded.rev,
           updated_at = excluded.updated_at",
        params![id, doc_type, data, next_rev, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(PutResult {
        ok: true,
        id,
        rev: rev_str,
    })
}

#[tauri::command]
fn db_remove(app: tauri::AppHandle, id: String, rev: String) -> Result<RemoveResult, String> {
    let conn = open_db(&app)?;
    let expected_rev = parse_rev_number(&rev).ok_or_else(|| "invalid_rev".to_string())?;
    let current_rev: i64 = conn
        .query_row("SELECT rev FROM docs WHERE id = ?1", [id.clone()], |row| row.get(0))
        .map_err(|_| "not_found".to_string())?;

    if current_rev != expected_rev {
        return Err("conflict".to_string());
    }

    conn.execute("DELETE FROM docs WHERE id = ?1", [id])
        .map_err(|e| e.to_string())?;
    Ok(RemoveResult { ok: true })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            desktop_info,
            db_all_docs,
            db_get,
            db_put,
            db_remove
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
