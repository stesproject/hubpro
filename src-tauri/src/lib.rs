use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

fn expand_tilde(path_str: &str) -> String {
    let trimmed = path_str.trim();
    if trimmed == "~" {
        if let Ok(home) = env::var("HOME") {
            return home;
        }
    } else if let Some(rest) = trimmed.strip_prefix("~/") {
        if let Ok(home) = env::var("HOME") {
            return format!("{}/{}", home.trim_end_matches('/'), rest);
        }
    }
    trimmed.to_string()
}

fn get_hubpro_data_file() -> Result<PathBuf, String> {
    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map_err(|_| "Could not determine user home directory".to_string())?;
    let dir = Path::new(&home).join(".hubpro");
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create ~/.hubpro directory: {}", e))?;
    }
    let target_file = dir.join("projects.json");
    if !target_file.exists() {
        let legacy_file = Path::new(&home).join(".prohub").join("projects.json");
        if legacy_file.exists() {
            let _ = fs::copy(&legacy_file, &target_file);
        }
    }
    Ok(target_file)
}

#[tauri::command]
fn get_storage_path() -> Result<String, String> {
    let file = get_hubpro_data_file()?;
    Ok(file.to_string_lossy().to_string())
}

#[tauri::command]
fn load_projects_data() -> Result<Option<String>, String> {
    let file = get_hubpro_data_file()?;
    if !file.exists() {
        return Ok(None);
    }
    let content = fs::read_to_string(&file)
        .map_err(|e| format!("Failed to read {}: {}", file.display(), e))?;
    Ok(Some(content))
}

#[tauri::command]
fn save_projects_data(data: String) -> Result<String, String> {
    let file = get_hubpro_data_file()?;
    fs::write(&file, data)
        .map_err(|e| format!("Failed to write {}: {}", file.display(), e))?;
    Ok(file.to_string_lossy().to_string())
}

fn escape_applescript_string(input: &str) -> String {
    input.replace('\\', "\\\\").replace('"', "\\\"")
}

#[tauri::command]
fn execute_action(
    action_type: String,
    target: String,
    working_dir: Option<String>,
    app_name: Option<String>,
    run_in_terminal: Option<bool>,
) -> Result<String, String> {
    let expanded_target = expand_tilde(&target);
    let expanded_workdir = working_dir
        .as_deref()
        .map(expand_tilde)
        .filter(|s| !s.is_empty());

    match action_type.as_str() {
        "open_folder" | "open_app" => {
            if expanded_target.is_empty() {
                return Err("Path is empty.".to_string());
            }
            let path = Path::new(&expanded_target);
            if !path.exists() {
                return Err(format!("Path does not exist: {}", expanded_target));
            }
            #[cfg(target_os = "macos")]
            {
                Command::new("open")
                    .arg(&expanded_target)
                    .spawn()
                    .map_err(|e| format!("Failed to open target: {}", e))?;
            }
            #[cfg(target_os = "windows")]
            {
                Command::new("explorer")
                    .arg(&expanded_target)
                    .spawn()
                    .map_err(|e| format!("Failed to open folder in Explorer: {}", e))?;
            }
            #[cfg(target_os = "linux")]
            {
                Command::new("xdg-open")
                    .arg(&expanded_target)
                    .spawn()
                    .map_err(|e| format!("Failed to open folder: {}", e))?;
            }
            Ok(format!("Opened folder: {}", expanded_target))
        }

        "open_ide" => {
            let folder_to_open = if !expanded_target.is_empty() {
                expanded_target
            } else if let Some(ref wd) = expanded_workdir {
                wd.clone()
            } else {
                return Err("No project directory specified for IDE.".to_string());
            };

            let requested_app = app_name
                .unwrap_or_else(|| "Antigravity".to_string())
                .trim()
                .to_string();

            #[cfg(target_os = "macos")]
            {
                let resolved_app = if requested_app.eq_ignore_ascii_case("Antigravity")
                    || requested_app.eq_ignore_ascii_case("Antigravity IDE")
                    || requested_app.is_empty()
                {
                    if Path::new("/Applications/Antigravity.app").exists() {
                        "Antigravity".to_string()
                    } else if Path::new("/Applications/Antigravity IDE.app").exists() {
                        "Antigravity IDE".to_string()
                    } else {
                        "Antigravity".to_string()
                    }
                } else {
                    requested_app.clone()
                };

                let status = Command::new("open")
                    .arg("-a")
                    .arg(&resolved_app)
                    .arg(&folder_to_open)
                    .status()
                    .map_err(|e| format!("Failed to launch {}: {}", resolved_app, e))?;

                if !status.success() {
                    return Err(format!(
                        "Could not open '{}' with application '{}'. Make sure the app is installed in /Applications.",
                        folder_to_open, resolved_app
                    ));
                }
                Ok(format!("Opened in {}: {}", resolved_app, folder_to_open))
            }
            #[cfg(not(target_os = "macos"))]
            {
                Command::new(&requested_app)
                    .arg(&folder_to_open)
                    .spawn()
                    .map_err(|e| format!("Failed to launch {}: {}", requested_app, e))?;
                Ok(format!("Opened in {}: {}", requested_app, folder_to_open))
            }
        }

        "open_url" => {
            let raw_url = target.trim();
            if raw_url.is_empty() {
                return Err("URL is empty.".to_string());
            }
            let normalized_url = if raw_url.starts_with("http://")
                || raw_url.starts_with("https://")
                || raw_url.starts_with("mailto:")
            {
                raw_url.to_string()
            } else {
                format!("https://{}", raw_url)
            };

            #[cfg(target_os = "macos")]
            {
                Command::new("open")
                    .arg(&normalized_url)
                    .spawn()
                    .map_err(|e| format!("Failed to open URL in browser: {}", e))?;
            }
            #[cfg(target_os = "windows")]
            {
                Command::new("cmd")
                    .args(["/C", "start", "", &normalized_url])
                    .spawn()
                    .map_err(|e| format!("Failed to open URL: {}", e))?;
            }
            #[cfg(target_os = "linux")]
            {
                Command::new("xdg-open")
                    .arg(&normalized_url)
                    .spawn()
                    .map_err(|e| format!("Failed to open URL: {}", e))?;
            }
            Ok(format!("Opened URL: {}", normalized_url))
        }

        "run_command" => {
            let cmd_str = target.trim();
            if cmd_str.is_empty() {
                return Err("Terminal command is empty.".to_string());
            }
            let use_terminal = run_in_terminal.unwrap_or(true);

            #[cfg(target_os = "macos")]
            {
                if use_terminal {
                    let full_shell_cmd = if let Some(ref wd) = expanded_workdir {
                        format!("cd \"{}\" && {}", escape_applescript_string(wd), cmd_str)
                    } else {
                        cmd_str.to_string()
                    };

                    let escaped_script = escape_applescript_string(&full_shell_cmd);
                    let apple_script = format!(
                        "tell application \"Terminal\"\n\
                            activate\n\
                            do script \"{}\"\n\
                         end tell",
                        escaped_script
                    );

                    Command::new("osascript")
                        .arg("-e")
                        .arg(&apple_script)
                        .spawn()
                        .map_err(|e| format!("Failed to run command in Terminal.app: {}", e))?;

                    return Ok(format!("Launched in Terminal: {}", cmd_str));
                } else {
                    let mut cmd = Command::new("zsh");
                    cmd.arg("-lc").arg(cmd_str);
                    if let Some(ref wd) = expanded_workdir {
                        if Path::new(wd).exists() {
                            cmd.current_dir(wd);
                        }
                    }
                    cmd.spawn()
                        .map_err(|e| format!("Failed to spawn background command: {}", e))?;
                    return Ok(format!("Executed background command: {}", cmd_str));
                }
            }

            #[cfg(not(target_os = "macos"))]
            {
                let _ = use_terminal;
                let mut cmd = Command::new("sh");
                cmd.arg("-c").arg(cmd_str);
                if let Some(ref wd) = expanded_workdir {
                    if Path::new(wd).exists() {
                        cmd.current_dir(wd);
                    }
                }
                cmd.spawn()
                    .map_err(|e| format!("Failed to execute command: {}", e))?;
                Ok(format!("Executed command: {}", cmd_str))
            }
        }

        other => Err(format!("Unsupported action type: {}", other)),
    }
}

#[tauri::command]
fn pick_folder_dialog() -> Result<Option<String>, String> {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("osascript")
            .arg("-e")
            .arg("POSIX path of (choose folder with prompt \"Select Folder\")")
            .output()
            .map_err(|e| format!("Failed to open folder picker: {}", e))?;

        if !output.status.success() {
            return Ok(None);
        }
        let path = String::from_utf8_lossy(&output.stdout)
            .trim()
            .trim_end_matches('/')
            .to_string();
        if path.is_empty() {
            Ok(None)
        } else {
            Ok(Some(path))
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok(None)
    }
}

#[tauri::command]
fn pick_image_dialog() -> Result<Option<String>, String> {
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("osascript")
            .arg("-e")
            .arg("POSIX path of (choose file of type {\"public.image\"} with prompt \"Select Project Preview Image\")")
            .output()
            .map_err(|e| format!("Failed to open image picker: {}", e))?;

        if !output.status.success() {
            return Ok(None);
        }
        let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
        if path.is_empty() {
            Ok(None)
        } else {
            Ok(Some(path))
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        Ok(None)
    }
}

#[tauri::command]
fn read_local_image(path: String) -> Result<String, String> {
    let expanded = expand_tilde(&path);
    let file_path = Path::new(&expanded);
    if !file_path.exists() {
        return Err(format!("Image file not found: {}", expanded));
    }
    let bytes = fs::read(file_path).map_err(|e| format!("Failed to read image: {}", e))?;
    let ext = file_path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("png")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        _ => "image/png",
    };
    let encoded = BASE64.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, encoded))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_storage_path,
            load_projects_data,
            save_projects_data,
            execute_action,
            pick_folder_dialog,
            pick_image_dialog,
            read_local_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
